<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
        'priority',
        'parent_role_id',
        'reporting_structure',
        'module_access',
        'data_visibility_scope',
        'user_management_capabilities',
        'system_configuration_access',
        'reporting_permissions',
        'role_specific_limitations',
        'mfa_required',
        'mfa_grace_period_days',
        'session_timeout_minutes',
        'concurrent_session_limit',
        'is_super_admin',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_super_admin' => 'boolean',
        'priority' => 'integer',
        'mfa_required' => 'boolean',
        'mfa_grace_period_days' => 'integer',
        'session_timeout_minutes' => 'integer',
        'concurrent_session_limit' => 'integer',
        'module_access' => 'array',
        'data_visibility_scope' => 'array',
        'user_management_capabilities' => 'array',
        'system_configuration_access' => 'array',
        'reporting_permissions' => 'array',
        'role_specific_limitations' => 'array',
    ];

    /**
     * Get users with this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get parent role (supervisor).
     */
    public function parentRole(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_role_id');
    }

    /**
     * Get subordinate roles (children).
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_role_id');
    }

    /**
     * Get all subordinate roles recursively.
     */
    public function childrenRecursive(): HasMany
    {
        return $this->children()->with('childrenRecursive');
    }

    /**
     * Get reporting relationships where this role is supervisor.
     */
    public function supervisorRelationships(): HasMany
    {
        return $this->hasMany(RoleReportingRelationship::class, 'supervisor_role_id');
    }

    /**
     * Get reporting relationships where this role is subordinate.
     */
    public function subordinateRelationships(): HasMany
    {
        return $this->hasMany(RoleReportingRelationship::class, 'subordinate_role_id');
    }

    /**
     * Get permissions for this role through the normalized mapping table.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission_mappings')
                    ->withTimestamps();
    }

    /**
     * Check if this role has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()->where('name', $permissionName)->exists();
    }

    /**
     * Get all permissions for this role including inherited permissions.
     * Recursive permission collection from parent roles.
     */
    public function getAllPermissionsAttribute(): array
    {
        $permissions = $this->permissions->pluck('name')->toArray();
        
        // Include parent role permissions if exists
        if ($this->parentRole) {
            $parentPermissions = $this->parentRole->getAllPermissionsAttribute;
            $permissions = array_unique(array_merge($permissions, $parentPermissions));
        }
        
        return $permissions;
    }

    /**
     * Get all permissions recursively.
     */
    public function getAllPermissions(): array
    {
        return $this->getAllPermissionsAttribute;
    }

    /**
     * Get the is_super_admin attribute.
     */
    public function getIsSuperAdminAttribute(): bool
    {
        // Check explicit flag first
        if (isset($this->attributes['is_super_admin'])) {
            return (bool) $this->attributes['is_super_admin'];
        }

        // Fallback to slug check
        return $this->slug === 'super-admin';
    }

    /**
     * Check if this role can manage users.
     */
    public function canManageUsers(): bool
    {
        return $this->user_management_capabilities && 
               in_array('manage_users', $this->user_management_capabilities);
    }

    /**
     * Check if this role has system configuration access.
     */
    public function hasSystemConfigurationAccess(): bool
    {
        return $this->system_configuration_access && 
               count($this->system_configuration_access) > 0;
    }

    /**
     * Get role hierarchy level.
     */
    public function getHierarchyLevel(): int
    {
        if ($this->parentRole) {
            return $this->parentRole->getHierarchyLevel() + 1;
        }
        return 1;
    }

    /**
     * Check if this role is in the same segregation group as another role.
     */
    public function isInSameSegregationGroup(self $otherRole): bool
    {
        // Implementation depends on business rules
        return $this->priority === $otherRole->priority;
    }

    /**
     * Check if this is a system role that cannot be deleted.
     */
    public function isSystemRole(): bool
    {
        return $this->is_system;
    }

    /**
     * Scope to get only system roles.
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get non-system roles.
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to get roles by priority level (descending).
     */
    public function scopeByPriorityDescending($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    /**
     * Scope to get roles with higher priority than given value.
     */
    public function scopeWithHigherPriority($query, int $priority)
    {
        return $query->where('priority', '>', $priority);
    }

    /**
     * Scope to get roles with lower or equal priority.
     */
    public function scopeWithLowerOrEqualPriority($query, int $priority)
    {
        return $query->where('priority', '<=', $priority);
    }

    /**
     * Get role by slug.
     */
    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }

    /**
     * Scope to get roles by priority level.
     */
    public function scopeByPriority($query, int $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope to get roles with parent relationships.
     */
    public function scopeWithHierarchy($query)
    {
        return $query->with(['parentRole', 'children']);
    }

    /**
     * Get all subordinate roles recursively.
     */
    public function getAllSubordinates(): array
    {
        $subordinates = [];
        
        foreach ($this->children as $child) {
            $subordinates[] = $child;
            $subordinates = array_merge($subordinates, $child->getAllSubordinates());
        }
        
        return $subordinates;
    }

    /**
     * Get all descendant role IDs recursively.
     */
    public function getAllDescendantIds(): array
    {
        $descendants = [];
        
        foreach ($this->children as $child) {
            $descendants[] = $child->id;
            $descendants = array_merge($descendants, $child->getAllDescendantIds());
        }
        
        return $descendants;
    }

    /**
     * Check if this role can inherit from a parent role.
     *
     * @param Role $parentRole The potential parent role
     * @return bool Whether inheritance is allowed
     */
    public function canInheritFrom(self $parentRole): bool
    {
        // System roles can only inherit from other system roles
        if ($this->is_system && !$parentRole->is_system) {
            return false;
        }

        // Check for circular inheritance
        $ancestors = $this->getAncestors();
        $ancestorIds = array_column($ancestors, 'id');
        
        if (in_array($parentRole->id, $ancestorIds)) {
            return false;
        }

        // Parent must have higher priority
        if ($parentRole->priority <= $this->priority) {
            return false;
        }

        return true;
    }

    /**
     * Get all ancestor roles recursively.
     *
     * @return array Array of ancestor roles
     */
    public function getAncestors(): array
    {
        $ancestors = [];
        $current = $this->parentRole;
        
        while ($current) {
            $ancestors[] = $current;
            $current = $current->parentRole;
        }
        
        return $ancestors;
    }

    /**
     * Get all ancestor IDs recursively.
     *
     * @return array Array of ancestor IDs
     */
    public function getAncestorIds(): array
    {
        return array_column($this->getAncestors(), 'id');
    }

    /**
     * Check if this role is an ancestor of another role.
     *
     * @param Role $role The role to check
     * @return bool Whether this role is an ancestor
     */
    public function isAncestorOf(self $role): bool
    {
        return in_array($this->id, $role->getAncestorIds());
    }

    /**
     * Check if this role is a descendant of another role.
     *
     * @param Role $role The potential ancestor
     * @return bool Whether this role is a descendant
     */
    public function isDescendantOf(self $role): bool
    {
        return in_array($role->id, $this->getAncestorIds());
    }

    /**
     * Check if this role can access a specific module.
     *
     * @param string $module The module name
     * @return bool Whether the role has module access
     */
    public function canAccessModule(string $module): bool
    {
        if (!$this->module_access) {
            return false;
        }

        // Check for wildcard access
        if (in_array('*', $this->module_access)) {
            return true;
        }

        return in_array($module, $this->module_access);
    }

    /**
     * Check if MFA is required for this role.
     *
     * @return bool Whether MFA is required
     */
    public function isMfaRequired(): bool
    {
        return (bool) $this->mfa_required;
    }

    /**
     * Get MFA grace period in days.
     *
     * @return int|null Days or null if not applicable
     */
    public function getMfaGracePeriodDays(): ?int
    {
        return $this->mfa_grace_period_days;
    }

    /**
     * Get session timeout in minutes.
     *
     * @return int Session timeout
     */
    public function getSessionTimeoutMinutes(): int
    {
        return $this->session_timeout_minutes ?? 120;
    }

    /**
     * Get concurrent session limit.
     *
     * @return int|null Limit or null for unlimited
     */
    public function getConcurrentSessionLimit(): ?int
    {
        return $this->concurrent_session_limit;
    }

    /**
     * Check if role has a specific limitation.
     *
     * @param string $limitation The limitation to check
     * @return bool Whether the limitation exists
     */
    public function hasLimitation(string $limitation): bool
    {
        if (!$this->role_specific_limitations) {
            return false;
        }

        return in_array($limitation, $this->role_specific_limitations);
    }

    /**
     * Get users count with this role.
     */
    public function getUsersCountAttribute(): int
    {
        return $this->users()->count();
    }

    /**
     * Get permissions count.
     */
    public function getPermissionsCountAttribute(): int
    {
        return $this->permissions()->count();
    }

    /**
     * Boot method for model events.
     */
    protected static function booted(): void
    {
        // Prevent modification of Super Admin role
        static::updating(function (Role $role) {
            if ($role->is_super_admin && $role->isDirty('slug')) {
                if ($role->getOriginal('slug') !== 'super-admin') {
                    throw new \Exception('Cannot modify Super Admin role slug');
                }
            }
        });

        // Prevent deletion of system roles
        static::deleting(function (Role $role) {
            if ($role->is_system) {
                throw new \Exception('Cannot delete system roles');
            }
        });
    }
}
