import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import type { User } from '@/types';

/**
 * Extended Permission State Interface
 */
interface ExtendedPermissionState {
  permissions: string[];
  roles: string[];
  isLoading: boolean;
  error: string | null;
  sessionTimeRemaining: number | null;
  isMfaEnabled: boolean;
}

/**
 * Permission Check Result Interface
 */
interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Role Information Interface
 */
interface RoleInfo {
  id: number | null;
  name: string;
  slug: string;
  priority: number;
  isSystem: boolean;
  moduleAccess: string[];
  dataVisibilityScope: Record<string, unknown>;
}

/**
 * usePermission Composable
 * 
 * Enhanced permission checking composable with additional features:
 * - Single and multiple permission checks
 * - Role-based access control
 * - Module-level access checking
 * - MFA status checking
 * - Session timeout countdown
 */
export function usePermission() {
  const { auth } = usePage().props as { auth: { user: User } };
  
  const [state, setState] = useState<ExtendedPermissionState>({
    permissions: [],
    roles: [],
    isLoading: false,
    error: null,
    sessionTimeRemaining: null,
    isMfaEnabled: false,
  });

  // Initialize permissions from auth props
  useEffect(() => {
    if (auth?.user) {
      setState(prev => ({
        ...prev,
        permissions: auth.user.permissions || [],
        roles: auth.user.role ? [auth.user.role] : [],
        isMfaEnabled: auth.user.two_factor_confirmed_at !== null,
        isLoading: false,
      }));
    }
  }, [auth?.user]);

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.permissions || state.permissions.length === 0) {
      return false;
    }
    
    // Super Admin bypass - check role slug
    if (isSuperAdmin()) {
      return true;
    }
    
    return state.permissions.includes(permission);
  }, [state.permissions]);

  /**
   * Check if user has any of the specified permissions (OR logic)
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false;
    }
    
    if (isSuperAdmin()) {
      return true;
    }
    
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has all of the specified permissions (AND logic)
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return true;
    }
    
    if (isSuperAdmin()) {
      return true;
    }
    
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    const roleSlug = auth?.user?.roleModel?.slug;
    const roleName = auth?.user?.role;
    
    return role === roleName || role === roleSlug;
  }, [auth?.user?.role, auth?.user?.roleModel?.slug]);

  /**
   * Check if user has any of the specified roles (OR logic)
   */
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!roles || roles.length === 0) {
      return false;
    }
    
    const roleSlug = auth?.user?.roleModel?.slug;
    const roleName = auth?.user?.role;
    
    return roles.some(role => role === roleName || role === roleSlug);
  }, [auth?.user?.role, auth?.user?.roleModel?.slug]);

  /**
   * Check if user has all of the specified roles (AND logic)
   */
  const hasAllRoles = useCallback((roles: string[]): boolean => {
    if (!roles || roles.length === 0) {
      return true;
    }
    
    const roleSlug = auth?.user?.roleModel?.slug;
    const roleName = auth?.user?.role;
    
    return roles.every(role => role === roleName || role === roleSlug);
  }, [auth?.user?.role, auth?.user?.roleModel?.slug]);

  /**
   * Check module-level access
   */
  const canAccessModule = useCallback((module: string, action: 'view' | 'create' | 'update' | 'delete' | 'manage'): boolean => {
    if (isSuperAdmin()) {
      return true;
    }
    
    // Get user's module access from role
    const moduleAccess = auth?.user?.roleModel?.module_access || [];
    
    // Check for wildcard access
    if (moduleAccess.includes('*') || moduleAccess.includes('all')) {
      return true;
    }
    
    // Check if module is in allowed list
    if (!moduleAccess.includes(module)) {
      return false;
    }
    
    // For 'view' action, always allow if module is accessible
    if (action === 'view') {
      return true;
    }
    
    // Check for module-specific permission
    const modulePermission = `${module}.${action}`;
    return hasPermission(modulePermission) || hasPermission(`${module}.manage`);
  }, [auth?.user?.roleModel?.module_access, hasPermission]);

  /**
   * Get all user permissions
   */
  const getUserPermissions = useCallback((): string[] => {
    if (isSuperAdmin()) {
      // Return all permissions for super admin
      return state.permissions;
    }
    return state.permissions;
  }, [state.permissions]);

  /**
   * Check if MFA is enabled for the user
   */
  const isMfaEnabled = useCallback((): boolean => {
    if (auth?.user?.two_factor_confirmed_at) {
      return true;
    }
    return state.isMfaEnabled;
  }, [auth?.user?.two_factor_confirmed_at, state.isMfaEnabled]);

  /**
   * Get session time remaining in seconds
   */
  const getSessionTimeRemaining = useCallback((): number | null => {
    // This would typically come from the server or session data
    // For now, return null indicating no countdown is active
    return state.sessionTimeRemaining;
  }, [state.sessionTimeRemaining]);

  /**
   * Check if user is Super Admin
   */
  const isSuperAdmin = useCallback((): boolean => {
    const roleSlug = auth?.user?.roleModel?.slug;
    const roleName = auth?.user?.role;
    
    return roleSlug === 'super-admin' || roleName === 'Super Admin';
  }, [auth?.user?.role, auth?.user?.roleModel?.slug]);

  /**
   * Get user role information
   */
  const getUserRole = useCallback((): RoleInfo => {
    return {
      id: auth?.user?.role_id || null,
      name: auth?.user?.role || 'Unknown',
      slug: auth?.user?.roleModel?.slug || 'unknown',
      priority: auth?.user?.roleModel?.priority || 0,
      isSystem: auth?.user?.roleModel?.is_system || false,
      moduleAccess: auth?.user?.roleModel?.module_access || [],
      dataVisibilityScope: auth?.user?.roleModel?.data_visibility_scope || {},
    };
  }, [auth?.user]);

  /**
   * Check if user can manage another user based on role hierarchy
   */
  const canManageUser = useCallback((targetUserId: number): boolean => {
    if (isSuperAdmin()) {
      return true;
    }
    
    // For now, only super admin can manage users
    // Full implementation would check role hierarchy
    return false;
  }, [isSuperAdmin]);

  /**
   * Refresh permissions from the server
   */
  const refreshPermissions = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real implementation, this would make an API call
      // For now, we rely on auth props being updated
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh permissions',
      }));
    }
  }, []);

  /**
   * Update session time remaining
   */
  const updateSessionTimeRemaining = useCallback((seconds: number): void => {
    setState(prev => ({ ...prev, sessionTimeRemaining: seconds }));
  }, []);

  /**
   * Check permission with optional fallback
   */
  const checkPermissionWithFallback = useCallback((
    permission: string, 
    fallback: boolean = false
  ): boolean => {
    try {
      return hasPermission(permission);
    } catch {
      return fallback;
    }
  }, [hasPermission]);

  /**
   * Get allowed modules for the user
   */
  const getAllowedModules = useCallback((): string[] => {
    if (isSuperAdmin()) {
      return ['*'];
    }
    
    return auth?.user?.roleModel?.module_access || [];
  }, [auth?.user?.roleModel?.module_access, isSuperAdmin]);

  /**
   * Check if user can perform an action on a resource
   */
  const canPerformAction = useCallback((
    resource: string, 
    action: 'view' | 'create' | 'update' | 'delete'
  ): boolean => {
    const permission = `${resource}.${action}`;
    return hasPermission(permission);
  }, [hasPermission]);

  return {
    // State
    permissions: state.permissions,
    roles: state.roles,
    isLoading: state.isLoading,
    error: state.error,
    sessionTimeRemaining: state.sessionTimeRemaining,
    mfaEnabled: state.isMfaEnabled,
    
    // Permission checking methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Role checking methods
    hasRole,
    hasAnyRole,
    hasAllRoles,
    
    // Module-level access
    canAccessModule,
    getAllowedModules,
    
    // Resource-level access
    canPerformAction,
    
    // User info
    isSuperAdmin,
    isMfaEnabled,
    getUserRole,
    getUserPermissions,
    getSessionTimeRemaining,
    canManageUser,
    
    // Actions
    refreshPermissions,
    updateSessionTimeRemaining,
    checkPermissionWithFallback,
  };
}

/**
 * Hook for single permission check with loading state
 */
export function usePermissionCheck(permission: string): PermissionCheckResult {
  const { hasPermission, isLoading, error } = usePermission();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading,
    error,
  };
}

/**
 * Hook for multiple permission checks
 */
export function usePermissionChecks(permissions: string[]): PermissionCheckResult & {
  hasAny: boolean;
  hasAll: boolean;
} {
  const { hasAnyPermission, hasAllPermissions, isLoading, error } = usePermission();
  
  return {
    hasPermission: hasAnyPermission(permissions),
    hasAny: hasAnyPermission(permissions),
    hasAll: hasAllPermissions(permissions),
    isLoading,
    error,
  };
}

/**
 * Hook for role checking with loading state
 */
export function useRoleCheck(role: string): PermissionCheckResult & {
  hasRole: boolean;
} {
  const { hasRole, isLoading, error } = usePermission();
  
  return {
    hasPermission: hasRole(role),
    hasRole: hasRole(role),
    isLoading,
    error,
  };
}

/**
 * Hook for module access checking
 */
export function useModuleAccess(
  module: string, 
  action: 'view' | 'create' | 'update' | 'delete' | 'manage'
): PermissionCheckResult & {
  canAccess: boolean;
} {
  const { canAccessModule, isLoading, error } = usePermission();
  
  return {
    hasPermission: canAccessModule(module, action),
    canAccess: canAccessModule(module, action),
    isLoading,
    error,
  };
}

/**
 * Utility function to check permissions outside of React components
 */
export function checkPermissions(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  if (user.roleModel?.slug === 'super-admin' || user.role === 'Super Admin') {
    return true;
  }
  return user.permissions.includes(permission);
}

/**
 * Utility function to check any permission outside of React components
 */
export function checkAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  if (user.roleModel?.slug === 'super-admin' || user.role === 'Super Admin') {
    return true;
  }
  return permissions.some(permission => user.permissions?.includes(permission));
}

/**
 * Utility function to check all permissions outside of React components
 */
export function checkAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  if (user.roleModel?.slug === 'super-admin' || user.role === 'Super Admin') {
    return true;
  }
  return permissions.every(permission => user.permissions?.includes(permission));
}

/**
 * Utility function to check roles outside of React components
 */
export function checkRoles(user: User | null, roles: string[]): boolean {
  if (!user) return false;
  const userRole = user.role;
  const userRoleSlug = user.roleModel?.slug;
  return roles.some(role => role === userRole || role === userRoleSlug);
}

/**
 * Utility function to check module access outside of React components
 */
export function checkModuleAccess(
  user: User | null, 
  module: string, 
  action: 'view' | 'create' | 'update' | 'delete' | 'manage'
): boolean {
  if (!user) return false;
  if (user.roleModel?.slug === 'super-admin' || user.role === 'Super Admin') {
    return true;
  }
  
  const moduleAccess = user.roleModel?.module_access || [];
  if (moduleAccess.includes('*') || moduleAccess.includes('all')) {
    return true;
  }
  
  if (!moduleAccess.includes(module)) {
    return false;
  }
  
  const permission = `${module}.${action}`;
  return user.permissions?.includes(permission) || user.permissions?.includes(`${module}.manage`);
}

export default usePermission;
