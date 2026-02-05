<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\AuditLog;
use App\Models\PermissionChangeRequest;
use App\Models\TemporaryPermission;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PermissionEscalationService
{
    /**
     * Emergency access duration in hours.
     */
    protected int $emergencyAccessDuration = 4;

    /**
     * Maximum escalation duration in hours.
     */
    protected int $maxEscalationDuration = 720; // 30 days

    /**
     * Default escalation duration in hours.
     */
    protected int $defaultEscalationDuration = 24;

    /**
     * Escalation levels with their approval requirements.
     */
    protected array $escalationLevels = [
        1 => [
            'name' => 'Temporary Access',
            'duration_hours' => 24,
            'approvers' => ['department_admin'],
            'auto_approve' => false,
        ],
        2 => [
            'name' => 'Extended Access',
            'duration_hours' => 168, // 7 days
            'approvers' => ['hospital_admin', 'department_admin'],
            'auto_approve' => false,
        ],
        3 => [
            'name' => 'Privileged Access',
            'duration_hours' => 720, // 30 days
            'approvers' => ['sub-super-admin', 'hospital_admin'],
            'auto_approve' => false,
        ],
        4 => [
            'name' => 'Emergency Access',
            'duration_hours' => 4,
            'approvers' => ['super-admin', 'sub-super-admin'],
            'auto_approve' => false,
            'requires_justification' => true,
        ],
    ];

    /**
     * Create a permission escalation request.
     *
     * @param int $requesterId The user requesting escalation
     * @param array $requestedPermissions Array of permission names
     * @param string $justification Business justification
     * @param int $duration Duration in hours (optional)
     * @param int|null $escalationLevel Escalation level (1-4)
     * @return array Result with success status and message
     */
    public function createEscalationRequest(
        int $requesterId,
        array $requestedPermissions,
        string $justification,
        ?int $duration = null,
        ?int $escalationLevel = 1
    ): array {
        try {
            $requester = User::findOrFail($requesterId);

            // Validate escalation level
            if (!isset($this->escalationLevels[$escalationLevel])) {
                return [
                    'success' => false,
                    'message' => 'Invalid escalation level',
                ];
            }

            $levelConfig = $this->escalationLevels[$escalationLevel];

            // Validate requested permissions exist
            $validPermissions = Permission::whereIn('name', $requestedPermissions)->pluck('name')->toArray();
            $invalidPermissions = array_diff($requestedPermissions, $validPermissions);

            if (!empty($invalidPermissions)) {
                return [
                    'success' => false,
                    'message' => 'Invalid permissions requested',
                    'invalid_permissions' => $invalidPermissions,
                ];
            }

            // Determine duration
            $escalationDuration = $duration ?? $levelConfig['duration_hours'];

            // Validate duration doesn't exceed maximum
            if ($escalationDuration > $this->maxEscalationDuration) {
                $escalationDuration = $this->maxEscalationDuration;
            }

            // Create the escalation request
            $escalationRequest = PermissionChangeRequest::create([
                'requester_id' => $requesterId,
                'requested_permissions' => $validPermissions,
                'justification' => $justification,
                'duration_hours' => $escalationDuration,
                'escalation_level' => $escalationLevel,
                'status' => 'pending',
                'requested_at' => now(),
                'expires_at' => now()->addHours($escalationDuration),
            ]);

            // Get approval chain
            $approvalChain = $this->getApprovalChain($requesterId, $escalationLevel);

            // Log the request
            $this->auditEscalationEvent('escalation_requested', $escalationRequest->id, $requesterId, [
                'permissions' => $validPermissions,
                'duration_hours' => $escalationDuration,
                'escalation_level' => $escalationLevel,
                'approval_chain' => $approvalChain,
            ]);

            // Notify potential approvers
            $this->notifyApprovers($escalationRequest, $approvalChain);

            return [
                'success' => true,
                'message' => 'Escalation request submitted successfully',
                'request_id' => $escalationRequest->id,
                'approval_chain' => $approvalChain,
                'expires_at' => $escalationRequest->expires_at,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to create escalation request: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to create escalation request',
            ];
        }
    }

    /**
     * Get the approval chain for an escalation request.
     *
     * @param int $requesterId The user requesting escalation
     * @param int $escalationLevel The escalation level
     * @return array Array of approvers with their details
     */
    public function getApprovalChain(int $requesterId, int $escalationLevel): array
    {
        $requester = User::findOrFail($requesterId);
        $levelConfig = $this->escalationLevels[$escalationLevel];
        $approverRoles = $levelConfig['approvers'];

        $approvalChain = [];

        foreach ($approverRoles as $roleSlug) {
            $approvers = User::whereHas('roleModel', function ($query) use ($roleSlug) {
                $query->where('slug', $roleSlug);
            })->get();

            foreach ($approvers as $approver) {
                // Don't include the requester as their own approver
                if ($approver->id !== $requesterId) {
                    $approvalChain[] = [
                        'user_id' => $approver->id,
                        'name' => $approver->name,
                        'role' => $approver->roleModel->name ?? $approver->role,
                        'role_slug' => $approver->roleModel->slug ?? $roleSlug,
                        'order' => array_search($roleSlug, $approverRoles) + 1,
                    ];
                }
            }
        }

        return $approvalChain;
    }

    /**
     * Approve an escalation request.
     *
     * @param int $approverId The user approving the request
     * @param int $requestId The escalation request ID
     * @return array Result with success status and message
     */
    public function approveEscalation(int $approverId, int $requestId): array
    {
        try {
            $approver = User::findOrFail($approverId);
            $escalationRequest = PermissionChangeRequest::findOrFail($requestId);

            // Validate approver can approve this request
            $approvalChain = $this->getApprovalChain($escalationRequest->requester_id, $escalationRequest->escalation_level);
            $canApprove = collect($approvalChain)->contains('user_id', $approverId);

            if (!$canApprove) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to approve this request',
                ];
            }

            // Check if already approved by this approver
            $approvals = $escalationRequest->approvals ?? [];
            if (collect($approvals)->contains('approver_id', $approverId)) {
                return [
                    'success' => false,
                    'message' => 'You have already approved this request',
                ];
            }

            // Add approval
            $approvals[] = [
                'approver_id' => $approverId,
                'approver_name' => $approver->name,
                'approved_at' => now()->toIso8601String(),
            ];

            // Check if all required approvers have approved
            $requiredApprovers = count($approvalChain);
            $currentApprovals = count($approvals);

            $escalationRequest->update([
                'approvals' => $approvals,
                'approver_id' => $approverId,
                'approved_at' => $currentApprovals >= $requiredApprovers ? now() : null,
                'status' => $currentApprovals >= $requiredApprovers ? 'approved' : 'pending',
            ]);

            $this->auditEscalationEvent('escalation_approved', $requestId, $approverId, [
                'approvals' => $approvals,
                'fully_approved' => $currentApprovals >= $requiredApprovers,
            ]);

            if ($currentApprovals >= $requiredApprovers) {
                // Auto-activate if fully approved
                return $this->activateEscalation($requestId);
            }

            return [
                'success' => true,
                'message' => 'Escalation request approved',
                'approvals_received' => $currentApprovals,
                'approvals_required' => $requiredApprovers,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to approve escalation request: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to approve escalation request',
            ];
        }
    }

    /**
     * Deny an escalation request.
     *
     * @param int $approverId The user denying the request
     * @param int $requestId The escalation request ID
     * @param string $reason Reason for denial
     * @return array Result with success status and message
     */
    public function denyEscalation(int $approverId, int $requestId, string $reason): array
    {
        try {
            $approver = User::findOrFail($approverId);
            $escalationRequest = PermissionChangeRequest::findOrFail($requestId);

            // Validate approver can deny this request
            $approvalChain = $this->getApprovalChain($escalationRequest->requester_id, $escalationRequest->escalation_level);
            $canDeny = collect($approvalChain)->contains('user_id', $approverId);

            if (!$canDeny) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to deny this request',
                ];
            }

            $escalationRequest->update([
                'status' => 'denied',
                'approver_id' => $approverId,
                'denied_at' => now(),
                'denial_reason' => $reason,
            ]);

            $this->auditEscalationEvent('escalation_denied', $requestId, $approverId, [
                'reason' => $reason,
            ]);

            return [
                'success' => true,
                'message' => 'Escalation request denied',
            ];

        } catch (\Exception $e) {
            Log::error('Failed to deny escalation request: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to deny escalation request',
            ];
        }
    }

    /**
     * Activate an approved escalation request.
     *
     * @param int $requestId The escalation request ID
     * @return array Result with success status and message
     */
    public function activateEscalation(int $requestId): array
    {
        try {
            $escalationRequest = PermissionChangeRequest::findOrFail($requestId);

            if ($escalationRequest->status !== 'approved') {
                return [
                    'success' => false,
                    'message' => 'Escalation request must be approved before activation',
                ];
            }

            $requester = User::findOrFail($escalationRequest->requester_id);

            // Create temporary permissions for the requester
            $permissions = $escalationRequest->requested_permissions;
            $expiresAt = $escalationRequest->expires_at;

            foreach ($permissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();

                if ($permission) {
                    TemporaryPermission::create([
                        'user_id' => $requester->id,
                        'permission_id' => $permission->id,
                        'granted_by' => $escalationRequest->approver_id,
                        'granted_at' => now(),
                        'expires_at' => $expiresAt,
                        'reason' => $escalationRequest->justification,
                        'is_active' => true,
                    ]);

                    // Clear user permission cache
                    $requester->clearPermissionCache();
                }
            }

            $escalationRequest->update([
                'status' => 'active',
                'activated_at' => now(),
            ]);

            $this->auditEscalationEvent('escalation_activated', $requestId, $escalationRequest->approver_id, [
                'permissions' => $permissions,
                'expires_at' => $expiresAt,
            ]);

            return [
                'success' => true,
                'message' => 'Escalation activated successfully',
                'permissions' => $permissions,
                'expires_at' => $expiresAt,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to activate escalation: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to activate escalation',
            ];
        }
    }

    /**
     * Expire an escalation request when duration ends.
     *
     * @param int $requestId The escalation request ID
     * @return array Result with success status and message
     */
    public function expireEscalation(int $requestId): array
    {
        try {
            $escalationRequest = PermissionChangeRequest::findOrFail($requestId);

            if ($escalationRequest->status !== 'active') {
                return [
                    'success' => false,
                    'message' => 'Escalation is not active',
                ];
            }

            $requester = User::findOrFail($escalationRequest->requester_id);

            // Deactivate temporary permissions
            TemporaryPermission::where('user_id', $requester->id)
                ->where('reason', 'like', '%' . $escalationRequest->id . '%')
                ->orWhere('expires_at', $escalationRequest->expires_at)
                ->update(['is_active' => false]);

            $escalationRequest->update([
                'status' => 'expired',
                'expired_at' => now(),
            ]);

            // Clear user permission cache
            $requester->clearPermissionCache();

            $this->auditEscalationEvent('escalation_expired', $requestId, $requester->id, []);

            return [
                'success' => true,
                'message' => 'Escalation expired successfully',
            ];

        } catch (\Exception $e) {
            Log::error('Failed to expire escalation: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to expire escalation',
            ];
        }
    }

    /**
     * Get pending approvals for an approver.
     *
     * @param int $approverId The approver user ID
     * @return array Array of pending escalation requests
     */
    public function getPendingApprovals(int $approverId): array
    {
        $approver = User::findOrFail($approverId);
        $approverRoleSlug = $approver->roleModel->slug ?? '';

        $pendingRequests = PermissionChangeRequest::where('status', 'pending')
            ->where('requester_id', '!=', $approverId)
            ->get();

        $filteredRequests = [];

        foreach ($pendingRequests as $request) {
            $approvalChain = $this->getApprovalChain($request->requester_id, $request->escalation_level);

            foreach ($approvalChain as $approverInfo) {
                if ($approverInfo['user_id'] === $approverId) {
                    // Check if already approved
                    $approvals = $request->approvals ?? [];
                    $alreadyApproved = collect($approvals)->contains('approver_id', $approverId);

                    if (!$alreadyApproved) {
                        $filteredRequests[] = [
                            'request_id' => $request->id,
                            'requester_id' => $request->requester_id,
                            'requester_name' => User::find($request->requester_id)?->name,
                            'permissions' => $request->requested_permissions,
                            'justification' => $request->justification,
                            'duration_hours' => $request->duration_hours,
                            'escalation_level' => $request->escalation_level,
                            'escalation_level_name' => $this->escalationLevels[$request->escalation_level]['name'],
                            'requested_at' => $request->requested_at,
                            'expires_at' => $request->expires_at,
                            'order' => $approverInfo['order'],
                        ];
                    }
                }
            }
        }

        // Sort by order and then by requested_at
        usort($filteredRequests, function ($a, $b) {
            if ($a['order'] !== $b['order']) {
                return $a['order'] <=> $b['order'];
            }
            return $a['requested_at'] <=> $b['requested_at'];
        });

        return $filteredRequests;
    }

    /**
     * Grant emergency access with 4-hour limit.
     *
     * @param int $userId The user to grant emergency access
     * @param string $reason Reason for emergency access
     * @param int|null $approverId The user granting the access
     * @return array Result with success status and message
     */
    public function emergencyAccess(int $userId, string $reason, ?int $approverId = null): array
    {
        try {
            $user = User::findOrFail($userId);
            $approver = $approverId ? User::find($approverId) : null;

            // Get emergency permissions (subset of critical permissions)
            $emergencyPermissions = Permission::where('risk_level', '>=', 3)
                ->orWhere('is_critical', true)
                ->pluck('name')
                ->toArray();

            $expiresAt = now()->addHours($this->emergencyAccessDuration);

            // Create temporary permissions
            foreach ($emergencyPermissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)->first();

                if ($permission) {
                    TemporaryPermission::create([
                        'user_id' => $user->id,
                        'permission_id' => $permission->id,
                        'granted_by' => $approverId,
                        'granted_at' => now(),
                        'expires_at' => $expiresAt,
                        'reason' => "Emergency access: {$reason}",
                        'is_active' => true,
                        'is_emergency' => true,
                    ]);
                }
            }

            // Clear user permission cache
            $user->clearPermissionCache();

            $this->auditEscalationEvent('emergency_access_granted', 0, $userId, [
                'permissions' => $emergencyPermissions,
                'expires_at' => $expiresAt,
                'reason' => $reason,
                'granted_by' => $approver?->name,
            ]);

            return [
                'success' => true,
                'message' => 'Emergency access granted for 4 hours',
                'permissions' => $emergencyPermissions,
                'expires_at' => $expiresAt,
                'emergency_duration_hours' => $this->emergencyAccessDuration,
            ];

        } catch (\Exception $e) {
            Log::error('Failed to grant emergency access: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Failed to grant emergency access',
            ];
        }
    }

    /**
     * Audit an escalation event.
     *
     * @param string $event Event type
     * @param int $requestId Escalation request ID
     * @param int $userId User involved
     * @param array $details Additional details
     */
    public function auditEscalationEvent(string $event, int $requestId, int $userId, array $details = []): void
    {
        try {
            $user = User::find($userId);
            $request = $requestId > 0 ? PermissionChangeRequest::find($requestId) : null;

            AuditLog::create([
                'user_id' => $userId,
                'user_name' => $user?->name ?? 'System',
                'user_role' => $user?->role ?? 'System',
                'action' => "Escalation: {$event}",
                'target_type' => 'PermissionEscalation',
                'target_id' => $requestId,
                'target_name' => $request ? "Escalation #{$requestId}" : 'N/A',
                'details' => json_encode([
                    'event' => $event,
                    'request_id' => $requestId,
                    'details' => $details,
                ]),
                'severity' => $this->getEventSeverity($event),
                'ip_address' => Request::ip(),
                'user_agent' => Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to audit escalation event: ' . $e->getMessage());
        }
    }

    /**
     * Get severity level for an escalation event.
     */
    protected function getEventSeverity(string $event): string
    {
        $highSeverityEvents = [
            'escalation_denied',
            'escalation_expired',
            'emergency_access_granted',
        ];

        $warningSeverityEvents = [
            'escalation_requested',
            'escalation_approved',
            'escalation_activated',
        ];

        if (in_array($event, $highSeverityEvents)) {
            return 'high';
        }

        if (in_array($event, $warningSeverityEvents)) {
            return 'warning';
        }

        return 'info';
    }

    /**
     * Notify approvers of pending requests.
     */
    protected function notifyApprovers(PermissionChangeRequest $request, array $approvalChain): void
    {
        foreach ($approvalChain as $approver) {
            // TODO: Implement notification system
            Log::info('Escalation approval notification', [
                'request_id' => $request->id,
                'approver_id' => $approver['user_id'],
                'requester_id' => $request->requester_id,
            ]);
        }
    }

    /**
     * Get escalation levels configuration.
     */
    public function getEscalationLevels(): array
    {
        return $this->escalationLevels;
    }

    /**
     * Get active escalations for a user.
     */
    public function getActiveEscalations(int $userId): array
    {
        return PermissionChangeRequest::where('requester_id', $userId)
            ->where('status', 'active')
            ->get()
            ->map(function ($request) {
                return [
                    'request_id' => $request->id,
                    'permissions' => $request->requested_permissions,
                    'expires_at' => $request->expires_at,
                    'remaining_hours' => now()->diffInHours($request->expires_at),
                ];
            })
            ->toArray();
    }
}
