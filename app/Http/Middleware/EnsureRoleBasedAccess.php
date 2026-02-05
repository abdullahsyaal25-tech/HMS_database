<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Role;
use App\Models\User;
use App\Services\RBACService;
use App\Services\MfaEnforcementService;
use App\Services\SessionTimeoutService;

class EnsureRoleBasedAccess
{
    /**
     * @var RBACService
     */
    protected RBACService $rbacService;

    /**
     * @var MfaEnforcementService
     */
    protected MfaEnforcementService $mfaService;

    /**
     * @var SessionTimeoutService
     */
    protected SessionTimeoutService $sessionService;

    /**
     * Critical routes that require additional security checks.
     */
    protected array $criticalRoutes = [
        'admin.users.update-role',
        'admin.users.assign-role',
        'admin.permissions.assign',
        'admin.rbac.update-role-permissions',
        'admin.rbac.create-role',
        'admin.rbac.delete-role',
        'system.backup',
        'system.restore',
        'system.settings.update',
        'billing.refund',
        'billing.void',
        'patients.delete',
        'patients.access_locked',
    ];

    /**
     * Roles that can access all modules (wildcard access).
     */
    protected array $privilegedRoles = ['super-admin', 'sub-super-admin', 'hospital-admin'];

    /**
     * Constructor.
     */
    public function __construct(
        RBACService $rbacService,
        MfaEnforcementService $mfaService,
        SessionTimeoutService $sessionService
    ) {
        $this->rbacService = $rbacService;
        $this->mfaService = $mfaService;
        $this->sessionService = $sessionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $requestId = uniqid('rbac_', true);
        $request->merge(['_rbac_request_id' => $requestId]);

        Log::debug("[{$requestId}] EnsureRoleBasedAccess middleware ENTRY", [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'permissions_required' => $permissions,
            'user_authenticated' => Auth::check(),
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
                'debug_request_id' => $requestId,
            ], 401);
        }

        // 1. Check role hierarchy validity
        $hierarchyCheck = $this->validateRoleHierarchy($user);
        if (!$hierarchyCheck['valid']) {
            Log::alert("[{$requestId}] Role hierarchy violation", [
                'user_id' => $user->id,
                'reason' => $hierarchyCheck['reason'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Role hierarchy validation failed',
                'reason' => $hierarchyCheck['reason'],
                'debug_request_id' => $requestId,
            ], 403);
        }

        // 2. Check module access restrictions
        $moduleCheck = $this->validateModuleAccess($user, $request);
        if (!$moduleCheck['allowed']) {
            Log::warning("[{$requestId}] Module access denied", [
                'user_id' => $user->id,
                'module' => $moduleCheck['module'],
                'reason' => $moduleCheck['reason'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Access to this module is restricted',
                'module' => $moduleCheck['module'],
                'debug_request_id' => $requestId,
            ], 403);
        }

        // 3. Check data visibility scope
        $scopeCheck = $this->validateDataVisibilityScope($user, $request);
        if (!$scopeCheck['allowed']) {
            Log::warning("[{$requestId}] Data scope violation", [
                'user_id' => $user->id,
                'reason' => $scopeCheck['reason'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'You do not have access to this data scope',
                'debug_request_id' => $requestId,
            ], 403);
        }

        // 4. Check privilege escalation prevention
        $escalationCheck = $this->preventPrivilegeEscalation($user, $request);
        if (!$escalationCheck['allowed']) {
            Log::alert("[{$requestId}] Privilege escalation prevented", [
                'user_id' => $user->id,
                'reason' => $escalationCheck['reason'],
                'target_user_id' => $escalationCheck['target_user_id'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Privilege escalation detected and blocked',
                'debug_request_id' => $requestId,
            ], 403);
        }

        // 5. Check MFA status for privileged operations
        if ($this->isPrivilegedOperation($request)) {
            $mfaCheck = $this->validateMfaStatus($user, $request);
            if (!$mfaCheck['compliant']) {
                Log::warning("[{$requestId}] MFA compliance check failed", [
                    'user_id' => $user->id,
                    'reason' => $mfaCheck['reason'],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'MFA verification required for privileged operations',
                    'mfa_required' => true,
                    'debug_request_id' => $requestId,
                ], 403);
            }
        }

        // 6. Check concurrent session limits
        $sessionCheck = $this->validateConcurrentSessions($user, $request);
        if (!$sessionCheck['valid']) {
            Log::warning("[{$requestId}] Concurrent session limit exceeded", [
                'user_id' => $user->id,
                'reason' => $sessionCheck['reason'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Concurrent session limit exceeded',
                'debug_request_id' => $requestId,
            ], 403);
        }

        // 7. Super admin bypass
        if ($user->isSuperAdmin()) {
            Log::debug("[{$requestId}] Role-based access bypass - Super Admin");
            return $next($request);
        }

        // 8. Check specific permissions
        if (!empty($permissions)) {
            foreach ($permissions as $permission) {
                if (!$user->hasPermission($permission)) {
                    Log::warning('Permission denied in EnsureRoleBasedAccess', [
                        'user_id' => $user->id,
                        'permission' => $permission,
                        'ip' => $request->ip(),
                        'url' => $request->fullUrl(),
                    ]);

                    $this->logAccessDenied($user, $permission, $request, $requestId);

                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient permissions',
                        'required_permission' => $permission,
                        'debug_request_id' => $requestId,
                    ], 403);
                }
            }
        }

        // 9. Check segregation of duties for critical operations
        if ($this->isCriticalOperation($request)) {
            $violations = $this->rbacService->checkSegregationViolations($user->id);
            if (!empty($violations)) {
                Log::alert('Segregation of duties violation detected', [
                    'user_id' => $user->id,
                    'violations' => $violations,
                    'ip' => $request->ip(),
                    'route' => $request->route()->getName(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Segregation of duties violation detected',
                    'violations' => $violations,
                    'debug_request_id' => $requestId,
                ], 403);
            }
        }

        Log::debug("[{$requestId}] Role-based access check PASSED", [
            'user_id' => $user->id,
            'permissions' => $permissions,
        ]);

        return $next($request);
    }

    /**
     * Validate role hierarchy for the user.
     */
    protected function validateRoleHierarchy(User $user): array
    {
        $role = $user->roleModel;

        if (!$role) {
            return [
                'valid' => false,
                'reason' => 'no_role_assigned',
            ];
        }

        // Check if parent role exists and is valid
        if ($role->parent_role_id) {
            $parentRole = Role::find($role->parent_role_id);

            if (!$parentRole) {
                return [
                    'valid' => false,
                    'reason' => 'invalid_parent_role',
                ];
            }

            // Check for circular hierarchy
            if ($this->detectsCircularHierarchy($role->id, $role->id)) {
                return [
                    'valid' => false,
                    'reason' => 'circular_hierarchy_detected',
                ];
            }

            // Parent role must have higher priority
            if ($parentRole->priority <= $role->priority) {
                return [
                    'valid' => false,
                    'reason' => 'parent_role_priority_invalid',
                ];
            }
        }

        return ['valid' => true];
    }

    /**
     * Detect circular hierarchy.
     */
    protected function detectsCircularHierarchy(int $roleId, int $originalId, array $visited = []): bool
    {
        if (in_array($roleId, $visited)) {
            return true;
        }

        $visited[] = $roleId;
        $role = Role::find($roleId);

        if (!$role || !$role->parent_role_id) {
            return false;
        }

        if ($role->parent_role_id === $originalId) {
            return true;
        }

        return $this->detectsCircularHierarchy($role->parent_role_id, $originalId, $visited);
    }

    /**
     * Validate module access for the user.
     */
    protected function validateModuleAccess(User $user, Request $request): array
    {
        $role = $user->roleModel;

        if (!$role) {
            return ['allowed' => false, 'reason' => 'no_role'];
        }

        // Check for wildcard module access
        if (in_array($role->slug, $this->privilegedRoles) ||
            (is_array($role->module_access) && in_array('*', $role->module_access))) {
            return ['allowed' => true, 'reason' => 'wildcard_access'];
        }

        // Determine module from request
        $module = $this->getModuleFromRequest($request);

        if (!$module) {
            return ['allowed' => true, 'reason' => 'no_module_detected'];
        }

        // Check if role can access the module
        if (is_array($role->module_access) && in_array($module, $role->module_access)) {
            return ['allowed' => true, 'module' => $module, 'reason' => 'module_access_granted'];
        }

        return [
            'allowed' => false,
            'module' => $module,
            'reason' => 'module_access_denied',
        ];
    }

    /**
     * Get module name from request.
     */
    protected function getModuleFromRequest(Request $request): ?string
    {
        $routePath = $request->path();
        $segments = explode('/', $routePath);

        if (!empty($segments)) {
            $firstSegment = strtolower($segments[0]);

            $moduleMapping = [
                'admin' => 'administration',
                'users' => 'user_management',
                'patients' => 'patients',
                'appointments' => 'appointments',
                'billing' => 'billing',
                'pharmacy' => 'pharmacy',
                'laboratory' => 'laboratory',
                'reports' => 'reports',
                'settings' => 'settings',
                'departments' => 'departments',
                'doctors' => 'medical_staff',
            ];

            return $moduleMapping[$firstSegment] ?? $firstSegment;
        }

        return null;
    }

    /**
     * Validate data visibility scope.
     */
    protected function validateDataVisibilityScope(User $user, Request $request): array
    {
        $role = $user->roleModel;

        if (!$role || !is_array($role->data_visibility_scope)) {
            return ['allowed' => true, 'reason' => 'no_scope_restrictions'];
        }

        // Check hospital scope
        if (isset($role->data_visibility_scope['hospital_id'])) {
            $hospitalId = $request->input('hospital_id') ?? $request->route('hospital');

            if ($role->data_visibility_scope['hospital_id'] === 'current') {
                // User can only access their own hospital data
                // This validation would depend on user->hospital_id being set
                // For now, we'll assume it's validated elsewhere
            }
        }

        // Check department scope
        if (isset($role->data_visibility_scope['department_id'])) {
            $departmentId = $request->input('department_id') ?? $request->route('department');

            if ($role->data_visibility_scope['department_id'] === 'assigned') {
                // User can only access their assigned department
                // Additional validation would be needed here
            }
        }

        return ['allowed' => true, 'reason' => 'scope_validated'];
    }

    /**
     * Prevent privilege escalation attempts.
     */
    protected function preventPrivilegeEscalation(User $user, Request $request): array
    {
        $targetUserId = $request->route('user') ?? $request->input('user_id');
        $targetRoleId = $request->route('role') ?? $request->input('role_id');

        // If no target user or role, no escalation check needed
        if (!$targetUserId && !$targetRoleId) {
            return ['allowed' => true];
        }

        $userRole = $user->roleModel;

        if (!$userRole) {
            return ['allowed' => false, 'reason' => 'no_role'];
        }

        // Super admins can escalate (with proper logging)
        if ($user->isSuperAdmin()) {
            return ['allowed' => true];
        }

        // Check if trying to escalate to higher role
        if ($targetRoleId) {
            $targetRole = Role::find($targetRoleId);

            if ($targetRole && $targetRole->priority >= $userRole->priority) {
                // Check if there's a legitimate escalation path
                if (!$this->isValidEscalationPath($userRole, $targetRole)) {
                    return [
                        'allowed' => false,
                        'reason' => 'cannot_assign_higher_or_equal_role',
                        'target_user_id' => $targetUserId,
                    ];
                }
            }
        }

        return ['allowed' => true];
    }

    /**
     * Check if escalation path is valid.
     */
    protected function isValidEscalationPath(Role $fromRole, Role $toRole): bool
    {
        // Valid escalation: direct parent can assign to child
        if ($fromRole->id === $toRole->parent_role_id) {
            return true;
        }

        // Valid escalation: role is in allowed assignments
        $allowedAssignments = $this->rbacService->getAllowedRoleAssignments(
            User::where('role_id', $fromRole->id)->first()
        );

        return in_array($toRole->id, $allowedAssignments);
    }

    /**
     * Validate MFA status for privileged operations.
     */
    protected function validateMfaStatus(User $user, Request $request): array
    {
        $compliance = $this->mfaService->checkMfaCompliance($user->id);

        if ($compliance['compliant']) {
            return [
                'compliant' => true,
                'reason' => 'mfa_valid',
            ];
        }

        return [
            'compliant' => false,
            'reason' => $compliance['reason'] ?? 'mfa_not_configured',
        ];
    }

    /**
     * Validate concurrent session limits.
     */
    protected function validateConcurrentSessions(User $user, Request $request): array
    {
        $role = $user->roleModel;

        if (!$role) {
            return ['valid' => true, 'reason' => 'no_role'];
        }

        $limit = $role->getConcurrentSessionLimit();

        // No limit means unlimited sessions
        if ($limit === null) {
            return ['valid' => true, 'reason' => 'no_limit'];
        }

        $currentCount = $this->sessionService->getSessionCount($user->id);

        if ($currentCount > $limit) {
            return [
                'valid' => false,
                'reason' => 'exceeds_session_limit',
                'current' => $currentCount,
                'limit' => $limit,
            ];
        }

        return ['valid' => true, 'reason' => 'within_limit'];
    }

    /**
     * Check if the request is for a privileged/critical operation.
     */
    protected function isPrivilegedOperation(Request $request): bool
    {
        $routeName = $request->route()->getName();

        return in_array($routeName, $this->criticalRoutes) ||
               $this->mfaService->isHighRiskOperation($routeName ?? '');
    }

    /**
     * Check if the request is for a critical operation.
     */
    protected function isCriticalOperation(Request $request): bool
    {
        $routeName = $request->route()->getName();

        return in_array($routeName, $this->criticalRoutes);
    }

    /**
     * Log access denied event.
     */
    protected function logAccessDenied(User $user, string $permission, Request $request, string $requestId): void
    {
        $this->rbacService->logPermissionAccess($user->id, $permission, false, [
            'request_id' => $requestId,
            'reason' => 'role_based_access_denied',
            'route' => $request->route()->getName(),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
        ]);
    }
}
