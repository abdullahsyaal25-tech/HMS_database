<?php

namespace App\Traits;

use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\TemporaryPermission;
use Illuminate\Support\Facades\Cache;

trait HasPermissions
{
    /**
     * Cache TTL for permission checks (in seconds).
     */
    protected int $permissionCacheTtl = 900; // 15 minutes

    /**
     * Check if user has a specific permission.
     * Uses hierarchical checking: User Override > Role > Temporary
     */
    public function hasPermission(string $permissionName): bool
    {
        // Super admin always has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        $cacheKey = $this->getPermissionCacheKey($permissionName);

        return Cache::remember($cacheKey, $this->permissionCacheTtl, function () use ($permissionName) {
            // 1. Check user-specific permission override
            $userPermission = $this->userPermissions()
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->first();

            if ($userPermission !== null) {
                return (bool) $userPermission->allowed;
            }

            // 2. Check role-based permissions (using new normalized table)
            if ($this->role_id && $this->roleModel) {
                $hasRolePermission = $this->roleModel->permissions()
                    ->where('name', $permissionName)
                    ->exists();

                if ($hasRolePermission) {
                    return true;
                }
            }

            // Fallback: Check legacy role_permissions table for backward compatibility
            $legacyRolePermission = RolePermission::where('role', $this->role)
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->exists();

            if ($legacyRolePermission) {
                return true;
            }

            // 3. Check active temporary permissions
            $hasTemporaryPermission = $this->temporaryPermissions()
                ->active()
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->exists();

            return $hasTemporaryPermission;
        });
    }

    /**
     * Check if user has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Authorize an action, throwing exception if unauthorized.
     */
    public function authorize(string $permission, ?string $message = null): void
    {
        if (!$this->hasPermission($permission)) {
            abort(403, $message ?? "Unauthorized: Missing permission '{$permission}'");
        }
    }

    /**
     * Authorize any of the given permissions.
     */
    public function authorizeAny(array $permissions, ?string $message = null): void
    {
        if (!$this->hasAnyPermission($permissions)) {
            abort(403, $message ?? 'Unauthorized: Missing required permissions');
        }
    }

    /**
     * Get all effective permissions for the user.
     */
    public function getEffectivePermissions(): array
    {
        $cacheKey = "user_effective_permissions:{$this->id}";

        return Cache::remember($cacheKey, $this->permissionCacheTtl, function () {
            // Super admin has all permissions
            if ($this->isSuperAdmin()) {
                return Permission::pluck('name')->toArray();
            }

            $permissions = collect();

            // Get role permissions
            if ($this->role_id && $this->roleModel) {
                $permissions = $permissions->merge(
                    $this->roleModel->permissions->pluck('name')
                );
            }

            // Get user-specific permissions (allowed only)
            $userPermissions = $this->userPermissions()
                ->where('allowed', true)
                ->with('permission')
                ->get()
                ->pluck('permission.name');

            $permissions = $permissions->merge($userPermissions);

            // Get denied permissions
            $deniedPermissions = $this->userPermissions()
                ->where('allowed', false)
                ->with('permission')
                ->get()
                ->pluck('permission.name');

            // Remove denied permissions
            $permissions = $permissions->diff($deniedPermissions);

            // Add temporary permissions
            $tempPermissions = $this->temporaryPermissions()
                ->active()
                ->with('permission')
                ->get()
                ->pluck('permission.name');

            return $permissions->merge($tempPermissions)->unique()->values()->toArray();
        });
    }

    /**
     * Clear permission cache for this user.
     */
    public function clearPermissionCache(): void
    {
        $pattern = "user_permission:{$this->id}:*";
        Cache::forget("user_effective_permissions:{$this->id}");
        
        // Clear individual permission cache keys
        $permissions = Permission::pluck('name');
        foreach ($permissions as $permission) {
            Cache::forget($this->getPermissionCacheKey($permission));
        }
    }

    /**
     * Get cache key for a specific permission.
     */
    protected function getPermissionCacheKey(string $permissionName): string
    {
        return "user_permission:{$this->id}:{$permissionName}";
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        // Use roleModel consistently
        if ($this->roleModel && $this->roleModel->slug === 'super-admin') {
            return true;
        }
        
        // Fallback for legacy data
        return $this->role === 'Super Admin';
    }

    /**
     * Check if user is an Admin.
     * Admin has full access to admin functions.
     */
    public function isAdmin(): bool
    {
        // Check roleModel first
        if ($this->roleModel) {
            $adminSlugs = ['super-admin', 'admin'];
            return in_array($this->roleModel->slug, $adminSlugs);
        }
        
        // Fallback for legacy role string
        $adminRoles = ['Super Admin', 'Admin'];
        return in_array($this->role, $adminRoles);
    }

    /**
     * Check if user is Staff (non-admin user).
     */
    public function isStaff(): bool
    {
        return !$this->isAdmin();
    }

    /**
     * Define module access for different roles.
     * Maps roles to their allowed modules.
     *
     * @return array Module names that the role can access
     */
    public function getAllowedModules(): array
    {
        // Super Admin and Admin have access to all modules
        if ($this->isSuperAdmin() || $this->isAdmin()) {
            return [
                'patients',
                'doctors',
                'departments',
                'appointments',
                'laboratory',
                'pharmacy',
                'reports',
                'settings',
                'users',
                'roles',
                'permissions',
            ];
        }

        // Get the role slug
        $roleSlug = null;
        if ($this->roleModel) {
            $roleSlug = $this->roleModel->slug;
        }

        // Legacy role string fallback
        if (!$roleSlug) {
            $roleSlug = $this->role;
        }

        // Department-specific admin roles
        return match ($roleSlug) {
            'laboratory-admin' => [
                'laboratory',
            ],
            'pharmacy-admin' => [
                'pharmacy',
            ],
            'reception-admin' => [
                'patients',
                'doctors',
                'departments',
                'appointments',
            ],
            default => [],
        };
    }

    /**
     * Check if the user can access a specific module.
     *
     * @param string $module The module name to check access for
     * @return bool True if the user can access the module
     */
    public function canAccessModule(string $module): bool
    {
        // Super Admin and Admin have access to all modules
        if ($this->isSuperAdmin() || $this->isAdmin()) {
            return true;
        }

        $allowedModules = $this->getAllowedModules();
        
        return in_array($module, $allowedModules);
    }

    /**
     * Check if the user is a department-specific admin.
     * Department admins include: Laboratory Admin, Pharmacy Admin, Reception Admin
     *
     * @return bool True if the user is a department admin
     */
    public function isDepartmentAdmin(): bool
    {
        // Get the role slug
        $roleSlug = null;
        if ($this->roleModel) {
            $roleSlug = $this->roleModel->slug;
        }

        // Legacy role string fallback
        if (!$roleSlug) {
            $roleSlug = $this->role;
        }

        $departmentAdminRoles = [
            'laboratory-admin',
            'Laboratory Admin',
            'pharmacy-admin',
            'Pharmacy Admin',
            'reception-admin',
            'Reception Admin',
        ];

        return in_array($roleSlug, $departmentAdminRoles);
    }

    /**
     * Relationship to the new Role model.
     */
    public function roleModel()
    {
        return $this->belongsTo(\App\Models\Role::class, 'role_id');
    }
}
