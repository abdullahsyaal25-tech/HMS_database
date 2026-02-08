import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import type { User } from '@/types';

interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

interface PermissionState {
  permissions: string[];
  isLoading: boolean;
  error: string | null;
}

export function usePermissions() {
  const { auth } = usePage().props as { auth: { user: User } };
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    isLoading: false,
    error: null,
  });

  // Initialize permissions from auth props
  useEffect(() => {
    if (auth?.user?.permissions) {
      setState(prev => ({
        ...prev,
        permissions: auth.user.permissions ?? [],
        isLoading: false,
      }));
    } else if (auth?.user) {
      // If user exists but no permissions, initialize with empty array
      setState(prev => ({
        ...prev,
        permissions: [],
        isLoading: false,
      }));
    }
  }, [auth?.user?.permissions, auth?.user]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.permissions || state.permissions.length === 0) {
      return false;
    }
    return state.permissions.includes(permission);
  }, [state.permissions]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!permissions || permissions.length === 0) return true;
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Check if user is Super Admin
  const isSuperAdmin = useCallback((): boolean => {
    return auth?.user?.role === 'Super Admin' || 
           (auth?.user?.roleModel?.slug === 'super-admin');
  }, [auth?.user?.role, auth?.user?.roleModel?.slug]);

  // Check if user can manage another user (role hierarchy)
  const canManageUser = useCallback((targetUserId: number): boolean => {
    if (isSuperAdmin()) {
      return true;
    }
    
    // TODO: Implement role hierarchy checking
    // For now, only Super Admin can manage users
    return false;
  }, [isSuperAdmin]);

  // Get user's role information
  const getUserRole = useCallback(() => {
    return {
      id: auth?.user?.role_id,
      name: auth?.user?.role,
      slug: auth?.user?.roleModel?.slug,
      priority: auth?.user?.roleModel?.priority,
      isSystem: auth?.user?.roleModel?.is_system,
    };
  }, [auth?.user?.role_id, auth?.user?.role, auth?.user?.roleModel]);

  // Refresh permissions (for when they might have changed)
  const refreshPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // TODO: Implement API call to refresh permissions
      // For now, we rely on the auth props being updated
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh permissions' 
      }));
    }
  }, []);

  return {
    // State
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
    
    // Permission checking methods
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    canManageUser,
    getUserRole,
    
    // Actions
    refreshPermissions,
  };
}

// Hook for checking permissions with loading state
export function usePermissionCheck(permission: string): PermissionCheckResult {
  const { hasPermission, isLoading, error } = usePermissions();
  
  return {
    hasPermission: hasPermission(permission),
    isLoading,
    error,
  };
}

// Hook for checking multiple permissions
export function usePermissionChecks(permissions: string[]): PermissionCheckResult & {
  hasAny: boolean;
  hasAll: boolean;
} {
  const { hasAnyPermission, hasAllPermissions, isLoading, error } = usePermissions();
  
  return {
    hasPermission: hasAnyPermission(permissions),
    hasAny: hasAnyPermission(permissions),
    hasAll: hasAllPermissions(permissions),
    isLoading,
    error,
  };
}

// Utility function to check permissions without hooks (for non-React contexts)
export function checkPermissions(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  return user.permissions.includes(permission);
}

// Utility function to check if user has any of the permissions
export function checkAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  return permissions.some(permission => user.permissions?.includes(permission) ?? false);
}

// Utility function to check if user has all permissions
export function checkAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  if (!user.permissions) return false;
  return permissions.every(permission => user.permissions?.includes(permission) ?? false);
}

// Utility function to check if user is Super Admin
export function isUserSuperAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'Super Admin' || 
         (user.roleModel?.slug === 'super-admin');
}