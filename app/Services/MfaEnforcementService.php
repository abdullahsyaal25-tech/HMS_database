<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Session;

class MfaEnforcementService
{
    /**
     * MFA verification timeout in minutes for high-risk operations.
     */
    protected int $mfaVerificationTimeout = 60;

    /**
     * High-risk operations that require MFA verification.
     */
    protected array $highRiskOperations = [
        'users.manage_roles',
        'users.manage_permissions',
        'users.delete',
        'system.settings.update',
        'system.backup',
        'system.restore',
        'billing.refund',
        'billing.void',
        'patients.delete',
        'patients.access_locked',
        'security.mfa',
        'security.block',
    ];

    /**
     * Roles that require mandatory MFA.
     */
    protected array $mandatoryMfaRoles = [
        'super-admin',
        'sub-super-admin',
        'hospital-admin',
    ];

    /**
     * Check if MFA is required for a specific role.
     *
     * @param int $roleId The role ID to check
     * @return bool Whether MFA is required
     */
    public function isMfaRequiredForRole(int $roleId): bool
    {
        $role = Role::find($roleId);
        
        if (!$role) {
            return false;
        }

        // Check explicit role setting
        if ($role->isMfaRequired()) {
            return true;
        }

        // Check role name for legacy support
        return in_array($role->slug, $this->mandatoryMfaRoles);
    }

    /**
     * Get MFA grace period end date for a role.
     *
     * @param int $roleId The role ID
     * @return \Carbon\Carbon|null Grace period end or null if not applicable
     */
    public function getMfaGracePeriodEnd(int $roleId): ?\Carbon\Carbon
    {
        $role = Role::find($roleId);
        
        if (!$role) {
            return null;
        }

        $graceDays = $role->getMfaGracePeriodDays();
        
        if ($graceDays === null) {
            return null;
        }

        return now()->addDays($graceDays);
    }

    /**
     * Check MFA compliance for a user.
     *
     * @param int $userId The user ID
     * @return array Compliance status details
     */
    public function checkMfaCompliance(int $userId): array
    {
        $user = User::find($userId);
        
        if (!$user) {
            return [
                'compliant' => false,
                'reason' => 'User not found',
            ];
        }

        // Check if user has MFA enabled
        $hasMfaEnabled = $this->isMfaEnabled($user);
        
        // Get user's role
        $role = $user->roleModel;
        
        if (!$role) {
            return [
                'compliant' => true,
                'has_mfa' => $hasMfaEnabled,
                'role_mfa_required' => false,
                'reason' => 'User has no role assigned',
            ];
        }

        $mfaRequired = $this->isMfaRequiredForRole($role->id);
        $gracePeriodEnd = $this->getMfaGracePeriodEnd($role->id);
        $isWithinGracePeriod = $gracePeriodEnd && now()->isBefore($gracePeriodEnd);

        // If MFA is not required and user doesn't have it enabled, they're compliant
        if (!$mfaRequired && !$hasMfaEnabled) {
            return [
                'compliant' => true,
                'has_mfa' => $hasMfaEnabled,
                'role_mfa_required' => false,
                'reason' => 'MFA not required for this role',
            ];
        }

        // If MFA is required and user has it enabled, they're compliant
        if ($mfaRequired && $hasMfaEnabled) {
            return [
                'compliant' => true,
                'has_mfa' => true,
                'role_mfa_required' => true,
                'reason' => 'MFA is enabled',
            ];
        }

        // MFA is required but user doesn't have it enabled
        if ($mfaRequired && !$hasMfaEnabled) {
            // Check if within grace period
            if ($isWithinGracePeriod) {
                return [
                    'compliant' => false,
                    'has_mfa' => false,
                    'role_mfa_required' => true,
                    'grace_period_end' => $gracePeriodEnd,
                    'days_remaining' => now()->diffInDays($gracePeriodEnd),
                    'reason' => 'MFA required - within grace period',
                ];
            }

            return [
                'compliant' => false,
                'has_mfa' => false,
                'role_mfa_required' => true,
                'grace_period_end' => null,
                'reason' => 'MFA required but not enabled',
            ];
        }

        return [
            'compliant' => true,
            'has_mfa' => $hasMfaEnabled,
            'role_mfa_required' => $mfaRequired,
            'reason' => 'Default compliant state',
        ];
    }

    /**
     * Enforce MFA for a user - mark them as requiring MFA verification.
     *
     * @param int $userId The user ID
     * @return bool Whether enforcement was successful
     */
    public function enforceMfaForUser(int $userId): bool
    {
        $user = User::find($userId);
        
        if (!$user) {
            return false;
        }

        // Clear any existing MFA verification session
        Session::forget('mfa_verified_at');
        Session::forget('mfa_verified_operations');

        // Set MFA requirement flag
        Session::put("mfa_required:{$userId}", true);
        Session::put("mfa_required_at:{$userId}", now()->toIso8601String());

        $this->logMfaEvent($userId, 'mfa_enforced', true, [
            'reason' => 'User role requires MFA',
        ]);

        return true;
    }

    /**
     * Verify MFA for a high-risk operation.
     *
     * @param int $userId The user ID
     * @param string $operation The operation being performed
     * @return bool Whether MFA verification passed
     */
    public function verifyMfaForHighRiskOperation(int $userId, string $operation): bool
    {
        // Check if operation is high-risk
        if (!$this->isHighRiskOperation($operation)) {
            return true;
        }

        // Check if already verified within timeout
        if ($this->isMfaVerified($userId, $operation)) {
            return true;
        }

        // Perform MFA verification (placeholder - actual implementation would integrate with Fortify or similar)
        $verified = $this->performMfaVerification($userId);

        if ($verified) {
            // Store verification in session
            Session::put("mfa_verified_at:{$userId}", now()->toIso8601String());
            $verifiedOperations = Session::get("mfa_verified_operations:{$userId}", []);
            $verifiedOperations[] = $operation;
            Session::put("mfa_verified_operations:{$userId}", $verifiedOperations);
            
            // Set expiration
            Session::put("mfa_verification_expires:{$userId}", now()->addMinutes($this->mfaVerificationTimeout)->toIso8601String());
        }

        $this->logMfaEvent($userId, 'mfa_verification_high_risk', $verified, [
            'operation' => $operation,
            'risk_level' => 'high',
        ]);

        return $verified;
    }

    /**
     * Check if an operation is high-risk and requires MFA.
     *
     * @param string $operation The operation name
     * @return bool Whether it's a high-risk operation
     */
    public function isHighRiskOperation(string $operation): bool
    {
        return in_array($operation, $this->highRiskOperations);
    }

    /**
     * Check if MFA has been verified for a specific operation.
     *
     * @param int $userId The user ID
     * @param string $operation The operation name
     * @return bool Whether MFA was verified
     */
    public function isMfaVerified(int $userId, ?string $operation = null): bool
    {
        $verifiedAt = Session::get("mfa_verified_at:{$userId}");
        
        if (!$verifiedAt) {
            return false;
        }

        $expiresAt = Session::get("mfa_verification_expires:{$userId}");
        
        if ($expiresAt && now()->isAfter($expiresAt)) {
            return false;
        }

        // If no specific operation, just check if MFA was verified
        if ($operation === null) {
            return true;
        }

        // Check if this specific operation was verified
        $verifiedOperations = Session::get("mfa_verified_operations:{$userId}", []);
        return in_array($operation, $verifiedOperations);
    }

    /**
     * Clear MFA verification for a user.
     *
     * @param int $userId The user ID
     */
    public function clearMfaVerification(int $userId): void
    {
        Session::forget("mfa_verified_at:{$userId}");
        Session::forget("mfa_verified_operations:{$userId}");
        Session::forget("mfa_verification_expires:{$userId}");
        Session::forget("mfa_required:{$userId}");
        Session::forget("mfa_required_at:{$userId}");
    }

    /**
     * Log an MFA event for audit purposes.
     *
     * @param int $userId The user ID
     * @param string $event The event type
     * @param bool $result The result of the event
     * @param array $context Additional context
     */
    public function logMfaEvent(int $userId, string $event, bool $result, array $context = []): void
    {
        try {
            $user = User::find($userId);
            
            AuditLog::create([
                'user_id' => $userId,
                'user_name' => $user?->name ?? 'Unknown',
                'user_role' => $user?->role ?? 'Unknown',
                'action' => "MFA: {$event}",
                'target_type' => 'MFA',
                'target_id' => $userId,
                'target_name' => $user?->name ?? 'Unknown',
                'details' => json_encode([
                    'event' => $event,
                    'result' => $result,
                    'context' => $context,
                ]),
                'severity' => $result ? 'info' : 'warning',
                'ip_address' => $context['ip_address'] ?? Request::ip(),
                'user_agent' => $context['user_agent'] ?? Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log MFA event: ' . $e->getMessage());
        }
    }

    /**
     * Get all high-risk operations.
     *
     * @return array Array of high-risk operation names
     */
    public function getHighRiskOperations(): array
    {
        return $this->highRiskOperations;
    }

    /**
     * Check if a user has MFA enabled.
     *
     * @param User $user The user to check
     * @return bool Whether MFA is enabled
     */
    public function isMfaEnabled(User $user): bool
    {
        // Check Fortify two-factor authentication fields
        if (method_exists($user, 'two_factor_confirmed_at')) {
            return !is_null($user->two_factor_confirmed_at);
        }

        // Fallback: check for any MFA-related field
        $mfaFields = ['two_factor_secret', 'two_factor_confirmed_at', 'mfa_enabled'];
        
        foreach ($mfaFields as $field) {
            if (isset($user->{$field}) && !is_null($user->{$field})) {
                return true;
            }
        }

        return false;
    }

    /**
     * Perform actual MFA verification.
     * This is a placeholder - actual implementation would use Laravel Fortify or similar.
     *
     * @param int $userId The user ID
     * @return bool Whether verification passed
     */
    protected function performMfaVerification(int $userId): bool
    {
        // Check if there's a verified flag in session (set by the MFA verification controller)
        return Session::get("mfa_challenge_passed:{$userId}", false);
    }

    /**
     * Set MFA challenge passed for a user.
     *
     * @param int $userId The user ID
     * @param string|null $code The MFA code submitted (for validation)
     * @return bool Whether the code was valid
     */
    public function setMfaChallengePassed(int $userId, ?string $code = null): bool
    {
        // In a real implementation, validate the code against the user's TOTP secret
        // For now, we just mark it as passed
        Session::put("mfa_challenge_passed:{$userId}", true);
        Session::put("mfa_challenge_at:{$userId}", now()->toIso8601String());

        $this->logMfaEvent($userId, 'mfa_challenge_passed', true, [
            'method' => $code ? 'code_verification' : 'session',
        ]);

        return true;
    }

    /**
     * Get MFA statistics for a user.
     *
     * @param int $userId The user ID
     * @return array MFA statistics
     */
    public function getMfaStats(int $userId): array
    {
        $user = User::find($userId);
        
        if (!$user) {
            return [];
        }

        return [
            'mfa_enabled' => $this->isMfaEnabled($user),
            'mfa_required' => $user->roleModel ? $this->isMfaRequiredForRole($user->roleModel->id) : false,
            'grace_period_end' => $user->roleModel ? $this->getMfaGracePeriodEnd($user->roleModel->id) : null,
            'compliance' => $this->checkMfaCompliance($userId),
            'last_verified' => Session::get("mfa_verified_at:{$userId}"),
            'verification_expires' => Session::get("mfa_verification_expires:{$userId}"),
        ];
    }

    /**
     * Get roles that require mandatory MFA.
     *
     * @return array Array of role slugs
     */
    public function getMandatoryMfaRoles(): array
    {
        return $this->mandatoryMfaRoles;
    }

    /**
     * Add a high-risk operation.
     *
     * @param string $operation The operation name
     */
    public function addHighRiskOperation(string $operation): void
    {
        if (!in_array($operation, $this->highRiskOperations)) {
            $this->highRiskOperations[] = $operation;
        }
    }

    /**
     * Remove a high-risk operation.
     *
     * @param string $operation The operation name
     */
    public function removeHighRiskOperation(string $operation): void
    {
        $this->highRiskOperations = array_values(array_diff($this->highRiskOperations, [$operation]));
    }
}
