<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\AuditLog;
use App\Models\PermissionAlert;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\DB;

class PrivilegeEscalationDetector
{
    /**
     * Sensitivity thresholds for anomaly detection.
     */
    protected int $permissionCountThreshold = 100;
    protected int $sensitivePermissionThreshold = 10;
    protected int $rapidChangeTimeframeHours = 24;
    protected int $rapidChangeThreshold = 5;

    /**
     * Critical roles that should be monitored closely.
     */
    protected array $criticalRoles = [
        'super-admin',
        'sub-super-admin',
    ];

    /**
     * High-risk permissions that require monitoring.
     */
    protected array $highRiskPermissions = [
        'users.manage_roles',
        'users.manage_permissions',
        'users.delete',
        'system.settings.update',
        'system.backup',
        'system.restore',
        'security.mfa',
        'security.block',
        'billing.refund',
        'billing.void',
        'patients.delete',
        'patients.access_locked',
    ];

    /**
     * Detect unauthorized role changes.
     *
     * @param int $actorId The user making the change
     * @param int $targetId The user whose role is being changed
     * @param int $newRoleId The new role ID
     * @return array Detection result with alert if suspicious
     */
    public function detectUnauthorizedRoleChanges(int $actorId, int $targetId, int $newRoleId): array
    {
        $actor = User::find($actorId);
        $target = User::find($targetId);
        $newRole = Role::find($newRoleId);

        if (!$actor || !$target || !$newRole) {
            return [
                'detected' => false,
                'reason' => 'invalid_parameters',
            ];
        }

        $violations = [];

        // Check if actor has permission to change roles
        if (!$actor->hasPermission('users.manage_roles')) {
            $violations[] = [
                'type' => 'unauthorized_role_change',
                'description' => 'User attempted to change role without users.manage_roles permission',
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'new_role' => $newRole->name,
            ];
        }

        // Check for privilege escalation
        $actorRole = $actor->roleModel;
        if ($actorRole && $newRole->priority >= $actorRole->priority) {
            // Check if actor is changing their own role
            if ($actorId === $targetId) {
                $violations[] = [
                    'type' => 'self_privilege_escalation',
                    'description' => 'User attempted to escalate their own privileges',
                    'actor_id' => $actorId,
                    'target_id' => $targetId,
                    'new_role' => $newRole->name,
                    'current_role' => $actorRole->name,
                ];
            } else {
                $violations[] = [
                    'type' => 'privilege_escalation',
                    'description' => 'User attempted to assign higher privileges',
                    'actor_id' => $actorId,
                    'target_id' => $targetId,
                    'new_role' => $newRole->name,
                    'current_role' => $actorRole->name,
                ];
            }
        }

        // Check if target role is in allowed assignments
        $rbacService = new RBACService();
        $allowedAssignments = $rbacService->getAllowedRoleAssignments($actor);
        if (!empty($allowedAssignments) && !in_array($newRoleId, $allowedAssignments)) {
            $violations[] = [
                'type' => 'unauthorized_role_assignment',
                'description' => 'User attempted to assign role outside their authority',
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'new_role' => $newRole->name,
            ];
        }

        // Log violations
        if (!empty($violations)) {
            foreach ($violations as $violation) {
                $this->logSecurityViolation($violation);
            }

            // Generate security alert
            $this->generateSecurityAlert('role_change_violation', [
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'new_role_id' => $newRoleId,
                'new_role_name' => $newRole->name,
                'violations' => $violations,
            ]);

            return [
                'detected' => true,
                'violations' => $violations,
                'blocked' => true,
            ];
        }

        return [
            'detected' => false,
            'reason' => 'no_violations_detected',
        ];
    }

    /**
     * Detect unusual permission patterns for a user.
     *
     * @param int $userId The user ID to check
     * @return array Detection result with anomalies if any
     */
    public function detectPermissionAnomalies(int $userId): array
    {
        $user = User::find($userId);

        if (!$user) {
            return [
                'anomalies' => [],
                'risk_score' => 0,
            ];
        }

        $anomalies = [];
        $riskScore = 0;

        // Get effective permissions
        $rbacService = new RBACService();
        $effectivePermissions = $rbacService->getEffectivePermissions($userId);
        $permissionCount = count($effectivePermissions);

        // Check for excessive permissions
        if ($permissionCount > $this->permissionCountThreshold) {
            $role = $user->roleModel;
            $rolePriority = $role?->priority ?? 0;

            if ($rolePriority < 80) {
                $anomalies[] = [
                    'type' => 'excessive_permissions',
                    'description' => 'User has unusually high number of permissions for their role level',
                    'permission_count' => $permissionCount,
                    'threshold' => $this->permissionCountThreshold,
                    'role_priority' => $rolePriority,
                ];

                $riskScore += min(30, ($permissionCount - $this->permissionCountThreshold) / 10);
            }
        }

        // Check for accumulation of sensitive permissions
        $sensitivePermissions = array_intersect($effectivePermissions, $this->highRiskPermissions);
        $sensitiveCount = count($sensitivePermissions);

        if ($sensitiveCount > $this->sensitivePermissionThreshold) {
            $anomalies[] = [
                'type' => 'sensitive_permission_accumulation',
                'description' => 'User has access to many high-risk permissions',
                'sensitive_permission_count' => $sensitiveCount,
                'threshold' => $this->sensitivePermissionThreshold,
                'permissions' => $sensitivePermissions,
            ];

            $riskScore += min(25, ($sensitiveCount - $this->sensitivePermissionThreshold) * 3);
        }

        // Check for rapid permission changes
        $recentChanges = $this->getRecentPermissionChanges($userId);
        if (count($recentChanges) > $this->rapidChangeThreshold) {
            $anomalies[] = [
                'type' => 'rapid_permission_changes',
                'description' => 'User has many permission changes in a short timeframe',
                'change_count' => count($recentChanges),
                'timeframe_hours' => $this->rapidChangeTimeframeHours,
            ];

            $riskScore += min(20, count($recentChanges) * 3);
        }

        // Check for permission changes outside working hours
        $offHoursChanges = $this->getOffHoursPermissionChanges($userId);
        if (!empty($offHoursChanges)) {
            $anomalies[] = [
                'type' => 'off_hours_permission_changes',
                'description' => 'Permission changes occurred outside normal working hours',
                'change_count' => count($offHoursChanges),
            ];

            $riskScore += 15;
        }

        return [
            'user_id' => $userId,
            'anomalies' => $anomalies,
            'risk_score' => min(100, $riskScore),
            'permission_count' => $permissionCount,
            'sensitive_permission_count' => $sensitiveCount,
        ];
    }

    /**
     * Detect cross-department access patterns.
     *
     * @param int $userId The user ID to check
     * @return array Detection result with violations if any
     */
    public function detectCrossDepartmentAccess(int $userId): array
    {
        $user = User::find($userId);

        if (!$user) {
            return [
                'violations' => [],
                'risk_score' => 0,
            ];
        }

        $role = $user->roleModel;

        if (!$role) {
            return [
                'violations' => [],
                'risk_score' => 0,
            ];
        }

        $violations = [];
        $riskScore = 0;

        // Check if role has department restrictions
        $moduleAccess = $role->module_access ?? [];
        $dataVisibility = $role->data_visibility_scope ?? [];

        // If role has limited module access, check for cross-module access
        if (!empty($moduleAccess) && !in_array('*', $moduleAccess)) {
            $recentAccess = $this->getRecentResourceAccess($userId);

            foreach ($recentAccess as $access) {
                $module = $access['module'] ?? '';

                if (!in_array($module, $moduleAccess) && $module !== 'unknown') {
                    $violations[] = [
                        'type' => 'cross_module_access',
                        'description' => "User accessed module outside their assigned scope",
                        'accessed_module' => $module,
                        'assigned_modules' => $moduleAccess,
                        'resource' => $access['resource'] ?? 'unknown',
                        'timestamp' => $access['timestamp'] ?? now()->toIso8601String(),
                    ];

                    $riskScore += 10;
                }
            }
        }

        // Check for data scope violations
        if (isset($dataVisibility['department_id']) && $dataVisibility['department_id'] === 'assigned') {
            $crossDepartmentAccess = $this->getCrossDepartmentDataAccess($userId);

            if (!empty($crossDepartmentAccess)) {
                foreach ($crossDepartmentAccess as $access) {
                    $violations[] = [
                        'type' => 'cross_department_data_access',
                        'description' => 'User accessed data outside their department',
                        'accessed_department' => $access['department_id'],
                        'assigned_department' => $dataVisibility['department_id'],
                        'resource_type' => $access['resource_type'] ?? 'unknown',
                        'resource_id' => $access['resource_id'] ?? null,
                    ];

                    $riskScore += 15;
                }
            }
        }

        return [
            'user_id' => $userId,
            'violations' => $violations,
            'risk_score' => min(100, $riskScore),
        ];
    }

    /**
     * Validate if a grantor has authority to grant a permission.
     *
     * @param int $grantorId The user granting the permission
     * @param int $granteeId The user receiving the permission
     * @param string $permission The permission being granted
     * @return array Validation result
     */
    public function validatePermissionGrant(int $grantorId, int $granteeId, string $permission): array
    {
        $grantor = User::find($grantorId);
        $grantee = User::find($granteeId);

        if (!$grantor || !$grantee) {
            return [
                'valid' => false,
                'reason' => 'user_not_found',
            ];
        }

        // Check if grantor has the permission management permission
        if (!$grantor->hasPermission('users.manage_permissions')) {
            return [
                'valid' => false,
                'reason' => 'grantor_lacks_management_permission',
                'required_permission' => 'users.manage_permissions',
            ];
        }

        // Check if grantor is granting a permission they don't have
        if (!$grantor->hasPermission($permission) && !$grantor->isSuperAdmin()) {
            return [
                'valid' => false,
                'reason' => 'grantor_lacks_target_permission',
                'permission' => $permission,
            ];
        }

        // Check for privilege escalation (granting higher permissions)
        $granteeRole = $grantee->roleModel;
        $grantorRole = $grantor->roleModel;

        if ($grantorRole && $granteeRole) {
            // Check if permission is outside grantee's role scope
            $rolePermissions = $granteeRole->permissions()->pluck('name')->toArray();
            
            if (!in_array($permission, $rolePermissions) && !in_array($permission, $grantee->getEffectivePermissions())) {
                // Granting a permission outside the grantee's role
                // This might be intentional but worth flagging
                $isCritical = Permission::where('name', $permission)->first()?->is_critical ?? false;

                if ($isCritical) {
                    return [
                        'valid' => false,
                        'reason' => 'critical_permission_outside_role_scope',
                        'permission' => $permission,
                        'warning' => 'Granting critical permissions outside role scope requires additional approval',
                    ];
                }
            }
        }

        return [
            'valid' => true,
            'reason' => 'permission_grant_validated',
        ];
    }

    /**
     * Check if role inheritance is safe.
     *
     * @param int $parentRoleId The parent role ID
     * @param int $childRoleId The child role ID
     * @return array Check result
     */
    public function checkInheritanceSafety(int $parentRoleId, int $childRoleId): array
    {
        $parentRole = Role::find($parentRoleId);
        $childRole = Role::find($childRoleId);

        if (!$parentRole || !$childRole) {
            return [
                'safe' => false,
                'reason' => 'role_not_found',
            ];
        }

        $issues = [];

        // Check for circular inheritance
        if ($this->wouldCreateCircularInheritance($parentRoleId, $childRoleId)) {
            $issues[] = 'circular_inheritance';
        }

        // Check if parent has higher priority
        if ($parentRole->priority <= $childRole->priority) {
            $issues[] = 'parent_priority_not_higher';
        }

        // Check if roles are compatible (same module access pattern)
        $parentModules = $parentRole->module_access ?? [];
        $childModules = $childRole->module_access ?? [];

        if (!empty($parentModules) && !in_array('*', $parentModules)) {
            // Parent has limited access, inheritance might be too restrictive
            if (!empty($childModules) && !in_array('*', $childModules)) {
                // Both have limited access, check compatibility
                $incompatible = array_diff($childModules, $parentModules);
                if (!empty($incompatible)) {
                    $issues[] = 'incompatible_module_access';
                }
            }
        }

        // Check for system role contamination
        if (!$parentRole->is_system && $childRole->is_system) {
            $issues[] = 'system_role_inheriting_from_custom_role';
        }

        return [
            'safe' => empty($issues),
            'issues' => $issues,
            'parent_role' => $parentRole->name,
            'child_role' => $childRole->name,
        ];
    }

    /**
     * Generate a security alert for suspicious activity.
     *
     * @param string $type Alert type
     * @param array $details Alert details
     * @return int|null Created alert ID
     */
    public function generateSecurityAlert(string $type, array $details): ?int
    {
        try {
            $alert = PermissionAlert::create([
                'type' => $type,
                'details' => json_encode($details),
                'severity' => $this->getAlertSeverity($type),
                'status' => 'new',
                'created_at' => now(),
            ]);

            // Log to audit
            AuditLog::create([
                'user_id' => $details['actor_id'] ?? 0,
                'user_name' => 'Security System',
                'user_role' => 'System',
                'action' => "Security Alert: {$type}",
                'target_type' => 'SecurityAlert',
                'target_id' => $alert->id,
                'target_name' => "Alert #{$alert->id}",
                'details' => json_encode($details),
                'severity' => $this->getAlertSeverity($type),
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);

            // Log to system
            Log::alert("Security alert generated: {$type}", $details);

            return $alert->id;

        } catch (\Exception $e) {
            Log::error('Failed to generate security alert: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Run a comprehensive privilege audit for a user.
     *
     * @param int $userId The user ID to audit
     * @return array Audit report
     */
    public function runPrivilegeAudit(int $userId): array
    {
        $user = User::find($userId);

        if (!$user) {
            return [
                'error' => 'User not found',
            ];
        }

        $report = [
            'user_id' => $userId,
            'user_name' => $user->name,
            'role' => $user->roleModel?->name ?? 'No Role',
            'audit_date' => now()->toIso8601String(),
            'findings' => [],
            'risk_score' => 0,
            'recommendations' => [],
        ];

        // Check permission anomalies
        $anomalies = $this->detectPermissionAnomalies($userId);
        $report['findings']['permission_anomalies'] = $anomalies['anomalies'];
        $report['risk_score'] += $anomalies['risk_score'];

        // Check cross-department access
        $crossAccess = $this->detectCrossDepartmentAccess($userId);
        $report['findings']['cross_department_access'] = $crossAccess['violations'];
        $report['risk_score'] += $crossAccess['risk_score'];

        // Check recent role changes
        $recentRoleChanges = $this->getRecentRoleChanges($userId);
        $report['findings']['recent_role_changes'] = $recentRoleChanges;

        // Check temporary permissions
        $temporaryPermissions = $this->getActiveTemporaryPermissions($userId);
        $report['findings']['temporary_permissions'] = $temporaryPermissions;

        // Check MFA status
        $mfaService = new MfaEnforcementService();
        $mfaStatus = $mfaService->checkMfaCompliance($userId);
        $report['findings']['mfa_status'] = $mfaStatus;

        // Generate recommendations
        $report['recommendations'] = $this->generateRecommendations($report['findings']);

        // Normalize risk score
        $report['risk_score'] = min(100, $report['risk_score']);

        // Log the audit
        $this->logPrivilegeAudit($report);

        return $report;
    }

    /**
     * Log a security violation.
     *
     * @param array $violation Violation details
     */
    public function logSecurityViolation(array $violation): void
    {
        try {
            AuditLog::create([
                'user_id' => $violation['actor_id'] ?? 0,
                'user_name' => 'Security System',
                'user_role' => 'System',
                'action' => "Security Violation: {$violation['type']}",
                'target_type' => 'SecurityViolation',
                'target_id' => null,
                'target_name' => $violation['type'],
                'details' => json_encode($violation),
                'severity' => 'critical',
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);

            Log::warning('Security violation detected', $violation);

        } catch (\Exception $e) {
            Log::error('Failed to log security violation: ' . $e->getMessage());
        }
    }

    /**
     * Get recent permission changes for a user.
     */
    protected function getRecentPermissionChanges(int $userId): array
    {
        $cutoff = now()->subHours($this->rapidChangeTimeframeHours);

        return AuditLog::where('user_id', $userId)
            ->whereIn('action', ['Permission Granted', 'Role Permission Update', 'Temporary Permission Granted'])
            ->where('logged_at', '>=', $cutoff)
            ->orderBy('logged_at', 'desc')
            ->limit($this->rapidChangeThreshold + 10)
            ->get()
            ->map(fn($log) => [
                'action' => $log->action,
                'timestamp' => $log->logged_at,
            ])
            ->toArray();
    }

    /**
     * Get permission changes outside working hours.
     */
    protected function getOffHoursPermissionChanges(int $userId): array
    {
        return AuditLog::where('user_id', $userId)
            ->whereIn('action', ['Permission Granted', 'Role Permission Update'])
            ->where(function ($query) {
                $query->whereHour('logged_at', '<', 7)
                      ->orWhereHour('logged_at', '>', 19);
            })
            ->orderBy('logged_at', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Get recent resource access for a user.
     */
    protected function getRecentResourceAccess(int $userId): array
    {
        // This is a placeholder - actual implementation would track module access
        return [];
    }

    /**
     * Get cross-department data access records.
     */
    protected function getCrossDepartmentDataAccess(int $userId): array
    {
        // This is a placeholder - actual implementation would track data access
        return [];
    }

    /**
     * Get recent role changes for a user.
     */
    protected function getRecentRoleChanges(int $userId): array
    {
        return AuditLog::where('user_id', $userId)
            ->where('action', 'User Role Assignment')
            ->orderBy('logged_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($log) => [
                'action' => $log->action,
                'timestamp' => $log->logged_at,
                'details' => json_decode($log->details, true),
            ])
            ->toArray();
    }

    /**
     * Get active temporary permissions for a user.
     */
    protected function getActiveTemporaryPermissions(int $userId): array
    {
        return \App\Models\TemporaryPermission::where('user_id', $userId)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->with('permission')
            ->get()
            ->map(fn($tp) => [
                'permission' => $tp->permission?->name,
                'expires_at' => $tp->expires_at,
                'reason' => $tp->reason,
            ])
            ->toArray();
    }

    /**
     * Check if inheritance would create a circular reference.
     */
    protected function wouldCreateCircularInheritance(int $parentId, int $childId): bool
    {
        $ancestors = Role::find($childId)?->getAncestorIds() ?? [];

        return in_array($parentId, $ancestors);
    }

    /**
     * Get severity for a security alert type.
     */
    protected function getAlertSeverity(string $type): string
    {
        $criticalTypes = [
            'privilege_escalation',
            'unauthorized_role_change',
            'self_privilege_escalation',
        ];

        $warningTypes = [
            'role_change_violation',
            'excessive_permissions',
            'sensitive_permission_accumulation',
            'rapid_permission_changes',
            'cross_department_data_access',
        ];

        if (in_array($type, $criticalTypes)) {
            return 'critical';
        }

        if (in_array($type, $warningTypes)) {
            return 'warning';
        }

        return 'info';
    }

    /**
     * Generate recommendations based on audit findings.
     */
    protected function generateRecommendations(array $findings): array
    {
        $recommendations = [];

        // Check for MFA recommendations
        if (isset($findings['mfa_status'])) {
            if (!($findings['mfa_status']['compliant'] ?? true)) {
                $recommendations[] = 'Enable MFA for enhanced security';
            }
        }

        // Check for permission accumulation
        $anomalies = $findings['permission_anomalies'] ?? [];
        foreach ($anomalies as $anomaly) {
            if ($anomaly['type'] === 'excessive_permissions') {
                $recommendations[] = 'Review and reduce user permissions to follow principle of least privilege';
            }

            if ($anomaly['type'] === 'sensitive_permission_accumulation') {
                $recommendations[] = 'Review and limit access to high-risk permissions';
            }
        }

        // Check for cross-department access
        $crossAccess = $findings['cross_department_access'] ?? [];
        if (!empty($crossAccess)) {
            $recommendations[] = 'Investigate and remediate cross-department access violations';
        }

        return $recommendations;
    }

    /**
     * Log a privilege audit report.
     */
    protected function logPrivilegeAudit(array $report): void
    {
        AuditLog::create([
            'user_id' => $report['user_id'],
            'user_name' => $report['user_name'],
            'user_role' => $report['role'],
            'action' => 'Privilege Audit Completed',
            'target_type' => 'PrivilegeAudit',
            'target_id' => $report['user_id'],
            'target_name' => "Audit for {$report['user_name']}",
            'details' => json_encode($report),
            'severity' => $report['risk_score'] > 50 ? 'warning' : 'info',
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }
}
