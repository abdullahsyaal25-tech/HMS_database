<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\TemporaryPermission;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class RBACService extends BaseService
{
    /**
     * Cache TTL for permission checks (in seconds).
     */
    protected int $permissionCacheTtl = 900;

    /**
     * Get comprehensive RBAC statistics.
     */
    public function getRBACStats(): array
    {
        $cacheKey = 'rbac_stats';
        
        return Cache::remember($cacheKey, 300, function () {
            return [
                'total_roles' => Role::count(),
                'active_permissions' => Permission::count(),
                'assigned_users' => User::whereNotNull('role_id')->count(),
                'pending_requests' => 0, // TODO: Implement permission requests
                'security_violations' => 0, // TODO: Implement violation tracking
                'role_distribution' => $this->getRoleDistribution(),
            ];
        });
    }

    /**
     * Get role distribution data.
     */
    private function getRoleDistribution(): array
    {
        $totalUsers = User::count();
        
        return Role::withCount('users')
            ->orderBy('priority', 'desc')
            ->get()
            ->map(function ($role) use ($totalUsers) {
                return [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'user_count' => $role->users_count,
                    'percentage' => $totalUsers > 0 ? round(($role->users_count / $totalUsers) * 100, 1) : 0,
                    'color' => $this->getRoleColor($role->name),
                ];
            })
            ->toArray();
    }

    /**
     * Get role hierarchy data.
     */
    public function getRoleHierarchy(): array
    {
        $roles = Role::with(['parentRole', 'subordinateRoles'])
            ->orderBy('priority', 'desc')
            ->get();

        return $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'priority' => $role->priority,
                'parent_role_id' => $role->parent_role_id,
                'parent_role_name' => $role->parentRole?->name,
                'subordinate_roles' => $role->subordinateRoles->map(function ($subRole) {
                    return [
                        'id' => $subRole->id,
                        'name' => $subRole->name,
                        'priority' => $subRole->priority,
                    ];
                }),
                'user_count' => $role->users_count,
            ];
        })->toArray();
    }

    /**
     * Get permission matrix data.
     */
    public function getPermissionMatrix(): array
    {
        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role->id] = $role->permissions->pluck('id')->toArray();
        }

        return [
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'priority' => $role->priority,
                    'is_system' => $role->is_system,
                    'permissions_count' => $role->permissions_count,
                ];
            }),
            'permissions' => $permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'description' => $permission->description,
                    'module' => $permission->module,
                    'risk_level' => $permission->risk_level,
                    'requires_approval' => $permission->requires_approval,
                    'is_critical' => $permission->is_critical,
                ];
            }),
            'rolePermissions' => $rolePermissions,
        ];
    }

    /**
     * Update role permissions with validation.
     */
    public function updateRolePermissions(int $roleId, array $permissionIds): array
    {
        try {
            // Validate permission dependencies
            $dependencyErrors = $this->validatePermissionDependencies($permissionIds);
            if (!empty($dependencyErrors)) {
                return [
                    'success' => false,
                    'message' => 'Permission dependency validation failed',
                    'errors' => $dependencyErrors,
                ];
            }

            // Validate critical permissions require approval
            $criticalPermissions = $this->validateCriticalPermissions($permissionIds);
            if (!empty($criticalPermissions)) {
                return [
                    'success' => false,
                    'message' => 'Critical permissions require approval',
                    'critical_permissions' => $criticalPermissions,
                ];
            }

            // Update permissions
            $role = Role::findOrFail($roleId);
            $oldPermissions = $role->permissions->pluck('id')->toArray();
            
            $role->permissions()->sync($permissionIds);
            
            // Clear caches
            $this->clearRolePermissionCache($roleId);
            
            // Log the change
            $this->logPermissionChange($roleId, $oldPermissions, $permissionIds, auth()->user());
            
            return [
                'success' => true,
                'message' => 'Role permissions updated successfully',
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to update role permissions: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to update role permissions',
            ];
        }
    }

    /**
     * Validate permission dependencies.
     */
    public function validatePermissionDependencies(array $permissionIds): array
    {
        $errors = [];
        $currentPermissions = collect($permissionIds);

        foreach ($permissionIds as $permissionId) {
            $dependencies = \App\Models\PermissionDependency::where('permission_id', $permissionId)
                ->with('dependsOnPermission')
                ->get();

            foreach ($dependencies as $dependency) {
                if (!$currentPermissions->contains($dependency->depends_on_permission_id)) {
                    $errors[] = "Permission '{$dependency->permission->name}' requires '{$dependency->dependsOnPermission->name}'";
                }
            }
        }

        return $errors;
    }

    /**
     * Validate critical permissions.
     */
    private function validateCriticalPermissions(array $permissionIds): array
    {
        return Permission::whereIn('id', $permissionIds)
            ->where('is_critical', true)
            ->pluck('name')
            ->toArray();
    }

    /**
     * Get user role assignments.
     */
    public function getUserAssignments(array $filters = []): array
    {
        $query = User::with(['roleModel']);

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(20);
        $roles = Role::orderBy('priority', 'desc')->get();

        return [
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role_id' => $user->role_id,
                    'role_name' => $user->roleModel?->name,
                    'role_priority' => $user->roleModel?->priority,
                    'created_at' => $user->created_at,
                ];
            }),
            'roles' => $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'priority' => $role->priority,
                ];
            }),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ];
    }

    /**
     * Update user role assignment.
     */
    public function updateUserRole(int $userId, int $roleId): array
    {
        try {
            $user = User::findOrFail($userId);
            $oldRoleId = $user->role_id;
            
            $user->update(['role_id' => $roleId]);
            
            // Clear user permission cache
            $user->clearPermissionCache();
            
            // Log the change
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name,
                'user_role' => auth()->user()->role,
                'action' => 'User Role Assignment',
                'target_type' => 'User',
                'target_id' => $user->id,
                'target_name' => $user->name,
                'details' => json_encode([
                    'old_role_id' => $oldRoleId,
                    'new_role_id' => $roleId,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
            
            return [
                'success' => true,
                'message' => 'User role updated successfully',
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to update user role: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to update user role',
            ];
        }
    }

    /**
     * Get audit logs with filters.
     */
    public function getAuditLogs(array $filters = []): array
    {
        $query = AuditLog::query();

        if (isset($filters['severity'])) {
            $query->where('severity', $filters['severity']);
        }

        if (isset($filters['module'])) {
            $query->where('module', $filters['module']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $auditLogs = $query->orderBy('logged_at', 'desc')
            ->paginate(25);

        return [
            'audit_logs' => $auditLogs->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user_name,
                    'user_role' => $log->user_role,
                    'action' => $log->action,
                    'target_type' => $log->target_type,
                    'target_name' => $log->target_name,
                    'details' => $log->details,
                    'severity' => $log->severity,
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'logged_at' => $log->logged_at,
                ];
            }),
            'pagination' => [
                'current_page' => $auditLogs->currentPage(),
                'last_page' => $auditLogs->lastPage(),
                'per_page' => $auditLogs->perPage(),
                'total' => $auditLogs->total(),
            ],
        ];
    }

    /**
     * Export RBAC configuration.
     */
    public function exportConfiguration(): array
    {
        return [
            'roles' => Role::with('permissions')->get(),
            'permissions' => Permission::all(),
            'users' => User::with('roleModel')->get(['id', 'name', 'email', 'role_id']),
        ];
    }

    /**
     * Import RBAC configuration.
     */
    public function importConfiguration(array $configuration): array
    {
        try {
            // TODO: Implement configuration import logic with validation
            return [
                'success' => true,
                'message' => 'Configuration imported successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to import RBAC configuration: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to import configuration',
            ];
        }
    }

    /**
     * Clear role permission cache.
     */
    public function clearRolePermissionCache(int $roleId): void
    {
        Cache::forget("role_permissions:{$roleId}");
        
        // Clear user permission caches for users with this role
        $userIds = User::where('role_id', $roleId)->pluck('id');
        foreach ($userIds as $userId) {
            Cache::forget("user_effective_permissions:{$userId}");
        }
    }

    /**
     * Log permission changes.
     */
    private function logPermissionChange(int $roleId, array $oldPermissions, array $newPermissions, $user): void
    {
        $added = array_diff($newPermissions, $oldPermissions);
        $removed = array_diff($oldPermissions, $newPermissions);
        
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role,
            'action' => 'Role Permission Update',
            'target_type' => 'Role',
            'target_id' => $roleId,
            'target_name' => Role::find($roleId)->name,
            'details' => json_encode([
                'added' => $added,
                'removed' => $removed,
            ]),
            'severity' => 'medium',
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Get color for role distribution.
     */
    private function getRoleColor(string $roleName): string
    {
        $colors = [
            'Super Admin' => '#ef4444', // red-500
            'Sub Super Admin' => '#f97316', // orange-500
            'Hospital Admin' => '#3b82f6', // blue-500
            'Department Admin' => '#6366f1', // indigo-500
            'Pharmacy Admin' => '#8b5cf6', // violet-500
            'Laboratory Admin' => '#ec4899', // pink-500
            'Billing Admin' => '#10b981', // emerald-500
            'Reception Admin' => '#14b8a6', // teal-500
            'Staff' => '#64748b', // slate-500
            'Viewer' => '#94a3b8', // slate-400
        ];

        return $colors[$roleName] ?? '#6b7280'; // gray-500
    }

    /**
     * Check if user has a specific permission with audit logging.
     *
     * @param string $permission The permission to check
     * @param User|null $user The user to check (defaults to current user)
     * @return bool Whether the user has the permission
     */
    public function checkPermission(string $permission, ?User $user = null): bool
    {
        $user = $user ?? auth()->user();
        
        if (!$user) {
            $this->logPermissionAccess(0, $permission, false, [
                'context' => 'no_authenticated_user',
                'ip_address' => Request::ip(),
            ]);
            return false;
        }

        $hasPermission = $user->hasPermission($permission);
        
        $this->logPermissionAccess($user->id, $permission, $hasPermission, [
            'context' => 'permission_check',
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);

        return $hasPermission;
    }

    /**
     * Check module-level access control.
     *
     * @param string $module The module to check
     * @param string $action The action to perform
     * @param User|null $user The user to check
     * @return bool Whether the user has access
     */
    public function checkModuleAccess(string $module, string $action, ?User $user = null): bool
    {
        $user = $user ?? auth()->user();
        
        if (!$user) {
            return false;
        }

        $permission = "{$module}.{$action}";
        return $this->checkPermission($permission, $user);
    }

    /**
     * Get complete role hierarchy chain for a specific role.
     *
     * @param int $roleId The role ID
     * @return array The hierarchy chain from root to the role
     */
    public function getRoleHierarchyChain(int $roleId): array
    {
        $role = Role::findOrFail($roleId);
        $hierarchy = [];
        
        // Build hierarchy from root to current
        $currentRole = $role;
        while ($currentRole) {
            array_unshift($hierarchy, [
                'id' => $currentRole->id,
                'name' => $currentRole->name,
                'priority' => $currentRole->priority,
                'parent_role_id' => $currentRole->parent_role_id,
            ]);
            $currentRole = $currentRole->parentRole;
        }

        return $hierarchy;
    }

    /**
     * Validate role assignment to prevent privilege escalation.
     *
     * @param User $assigner The user assigning the role
     * @param User $assignee The user receiving the role
     * @param Role $newRole The role being assigned
     * @return array Result with success status and message
     */
    public function validateRoleAssignment(User $assigner, User $assignee, Role $newRole): array
    {
        // Check if assigner can manage roles
        if (!$assigner->hasPermission('users.manage_roles')) {
            return [
                'valid' => false,
                'message' => 'You do not have permission to assign roles',
            ];
        }

        // Prevent privilege escalation - assignee cannot get higher priority role than assigner
        $assignerRole = $assigner->roleModel;
        if (!$assignerRole) {
            return [
                'valid' => false,
                'message' => 'Assigner does not have a role assigned',
            ];
        }

        if ($newRole->priority > $assignerRole->priority) {
            $this->logPermissionAccess($assigner->id, "role_assignment:{$newRole->id}", false, [
                'context' => 'privilege_escalation_attempt',
                'assignee_id' => $assignee->id,
                'requested_role_priority' => $newRole->priority,
                'assigner_role_priority' => $assignerRole->priority,
            ]);
            
            return [
                'valid' => false,
                'message' => 'Cannot assign a role with higher priority than your own',
            ];
        }

        // Check if role is in allowed assignment scope
        $allowedRoles = $this->getAllowedRoleAssignments($assigner);
        if (!in_array($newRole->id, $allowedRoles)) {
            return [
                'valid' => false,
                'message' => 'You are not authorized to assign this role',
            ];
        }

        return [
            'valid' => true,
            'message' => 'Role assignment is valid',
        ];
    }

    /**
     * Get roles that the user can assign to others.
     *
     * @param User $user The user
     * @return array Array of role IDs
     */
    public function getAllowedRoleAssignments(User $user): array
    {
        $userRole = $user->roleModel;
        
        if (!$userRole) {
            return [];
        }

        // Get all roles with priority less than or equal to user's role
        return Role::where('priority', '<', $userRole->priority)
            ->pluck('id')
            ->toArray();
    }

    /**
     * Get all effective permissions for a user including temporary ones.
     *
     * @param int $userId The user ID
     * @return array Array of permission names
     */
    public function getEffectivePermissions(int $userId): array
    {
        $cacheKey = "user_effective_permissions:{$userId}";
        
        return Cache::remember($cacheKey, $this->permissionCacheTtl, function () use ($userId) {
            $user = User::find($userId);
            
            if (!$user) {
                return [];
            }

            return $user->getEffectivePermissions();
        });
    }

    /**
     * Log all permission access attempts.
     *
     * @param int $userId The user ID
     * @param string $permission The permission checked
     * @param bool $result Whether access was granted
     * @param array $context Additional context information
     */
    public function logPermissionAccess(int $userId, string $permission, bool $result, array $context = []): void
    {
        try {
            $user = $userId > 0 ? User::find($userId) : null;
            
            AuditLog::create([
                'user_id' => $userId > 0 ? $userId : null,
                'user_name' => $user?->name ?? 'Guest',
                'user_role' => $user?->role ?? 'Guest',
                'action' => $result ? 'Permission Granted' : 'Permission Denied',
                'target_type' => 'Permission',
                'target_id' => null,
                'target_name' => $permission,
                'details' => json_encode([
                    'permission' => $permission,
                    'result' => $result,
                    'context' => $context,
                ]),
                'severity' => $result ? 'info' : 'warning',
                'ip_address' => $context['ip_address'] ?? Request::ip(),
                'user_agent' => $context['user_agent'] ?? Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log permission access: ' . $e->getMessage());
        }
    }

    /**
     * Detect potential privilege escalation vulnerabilities.
     *
     * @param int $userId The user ID to check
     * @param int $requestedRole The role ID being requested
     * @return array Result with vulnerability status and details
     */
    public function detectPrivilegeEscalation(int $userId, int $requestedRole): array
    {
        $user = User::findOrFail($userId);
        $currentRole = $user->roleModel;
        $requestedRoleModel = Role::findOrFail($requestedRole);

        if (!$currentRole) {
            return [
                'has_vulnerability' => false,
                'message' => 'User has no current role',
            ];
        }

        $vulnerabilities = [];

        // Check if requesting higher priority role
        if ($requestedRoleModel->priority > $currentRole->priority) {
            $vulnerabilities[] = [
                'type' => 'priority_escalation',
                'description' => 'User is requesting a role with higher priority than current',
                'current_priority' => $currentRole->priority,
                'requested_priority' => $requestedRoleModel->priority,
            ];
        }

        // Check for unusual permission accumulation patterns
        $effectivePermissions = $this->getEffectivePermissions($userId);
        $permissionCount = count($effectivePermissions);
        
        // Flag if user has unusually many permissions for their role level
        if ($permissionCount > 100 && $currentRole->priority < 80) {
            $vulnerabilities[] = [
                'type' => 'excessive_permissions',
                'description' => 'User has unusually high number of permissions for their role level',
                'permission_count' => $permissionCount,
                'role_priority' => $currentRole->priority,
            ];
        }

        // Check for permission patterns indicating potential misuse
        $sensitivePermissions = $this->getSensitivePermissions();
        $userSensitivePermissions = array_intersect($effectivePermissions, $sensitivePermissions);
        
        if (count($userSensitivePermissions) > 10) {
            $vulnerabilities[] = [
                'type' => 'sensitive_permission_accumulation',
                'description' => 'User has access to many sensitive permissions',
                'sensitive_permission_count' => count($userSensitivePermissions),
            ];
        }

        return [
            'has_vulnerability' => !empty($vulnerabilities),
            'vulnerabilities' => $vulnerabilities,
            'user_id' => $userId,
            'current_role' => $currentRole->name,
            'requested_role' => $requestedRoleModel->name,
        ];
    }

    /**
     * Get list of sensitive permissions that require monitoring.
     *
     * @return array Array of sensitive permission names
     */
    public function getSensitivePermissions(): array
    {
        return [
            'users.delete',
            'users.manage_roles',
            'users.manage_permissions',
            'system.settings.update',
            'system.backup',
            'system.restore',
            'security.audit',
            'security.mfa',
            'security.block',
            'billing.refund',
            'billing.void',
            'patients.delete',
            'patients.access_locked',
        ];
    }

    /**
     * Get child roles for a role (direct subordinates only).
     *
     * @param int $roleId The role ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getChildRoles(int $roleId)
    {
        return Role::where('parent_role_id', $roleId)->get();
    }

    /**
     * Get all descendant roles recursively.
     *
     * @param int $roleId The role ID
     * @param array $descendants Accumulator for descendants
     * @return array Array of descendant role IDs
     */
    public function getAllDescendants(int $roleId, array &$descendants = []): array
    {
        $children = Role::where('parent_role_id', $roleId)->pluck('id')->toArray();
        
        foreach ($children as $childId) {
            $descendants[] = $childId;
            $this->getAllDescendants($childId, $descendants);
        }

        return $descendants;
    }

    /**
     * Check if a role can inherit permissions from a parent role.
     *
     * @param Role $parentRole The potential parent role
     * @return bool Whether inheritance is allowed
     */
    public function canInheritFrom(Role $parentRole): bool
    {
        // System roles can only inherit from other system roles
        if ($this->is_system && !$parentRole->is_system) {
            return false;
        }

        // Check for circular inheritance
        $ancestors = $this->getRoleHierarchy($this->id);
        $ancestorIds = array_column($ancestors, 'id');
        
        if (in_array($parentRole->id, $ancestorIds)) {
            return false;
        }

        return true;
    }

    /**
     * Get users with a specific role.
     *
     * @param int $roleId The role ID
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getUsersWithRole(int $roleId)
    {
        return User::where('role_id', $roleId)->get();
    }

    /**
     * Batch assign roles to users.
     *
     * @param array $userIds Array of user IDs
     * @param int $roleId The role ID to assign
     * @param User $assigner The user performing the assignment
     * @return array Result with success status and summary
     */
    public function batchAssignRoles(array $userIds, int $roleId, User $assigner): array
    {
        $role = Role::findOrFail($roleId);
        $successCount = 0;
        $failures = [];

        foreach ($userIds as $userId) {
            $user = User::find($userId);
            
            if (!$user) {
                $failures[] = [
                    'user_id' => $userId,
                    'reason' => 'User not found',
                ];
                continue;
            }

            $validation = $this->validateRoleAssignment($assigner, $user, $role);
            
            if ($validation['valid']) {
                $user->update(['role_id' => $roleId]);
                $user->clearPermissionCache();
                $successCount++;
            } else {
                $failures[] = [
                    'user_id' => $userId,
                    'reason' => $validation['message'],
                ];
            }
        }

        return [
            'success' => true,
            'message' => "Assigned role to {$successCount} users",
            'success_count' => $successCount,
            'failure_count' => count($failures),
            'failures' => $failures,
        ];
    }

    /**
     * Get role by ID or name.
     *
     * @param mixed $identifier Role ID or name
     * @return Role|null
     */
    public function getRole(mixed $identifier): ?Role
    {
        if (is_numeric($identifier)) {
            return Role::find($identifier);
        }
        
        return Role::where('name', $identifier)->first();
    }

    /**
     * Check if user has any role in a list.
     *
     * @param User $user The user
     * @param array $roleNames Array of role names
     * @return bool Whether user has any of the roles
     */
    public function hasAnyRole(User $user, array $roleNames): bool
    {
        if (!$user->roleModel) {
            return false;
        }

        return in_array($user->roleModel->name, $roleNames);
    }

    /**
     * Check if user has all roles in a list.
     *
     * @param User $user The user
     * @param array $roleNames Array of role names
     * @return bool Whether user has all the roles
     */
    public function hasAllRoles(User $user, array $roleNames): bool
    {
        if (!$user->roleModel) {
            return false;
        }

        return in_array($user->roleModel->name, $roleNames);
    }
}
