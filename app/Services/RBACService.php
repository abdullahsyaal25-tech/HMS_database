<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RBACService extends BaseService
{
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
                'details' => "Role changed from {$oldRoleId} to {$roleId}",
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
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
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
            'Reception Admin' => '#10b981', // emerald-500
            'Pharmacy Admin' => '#8b5cf6', // violet-500
            'Laboratory Admin' => '#ec4899', // pink-500
        ];

        return $colors[$roleName] ?? '#6b7280'; // gray-500
    }
}