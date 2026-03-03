import { useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import type { User } from '@/types';

interface UseAuthorizationReturn {
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
}

export function useAuthorization(): UseAuthorizationReturn {
  const { auth } = usePage().props as { auth: { user: User } };
  const user = auth?.user;

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) {
      return false;
    }

    // Super admin has all permissions
    if (
      user.role === 'Super Admin' ||
      user.role === 'super admin' ||
      user.role?.toLowerCase() === 'super admin' ||
      user.role === 'super-admin' ||
      user.is_super_admin === true
    ) {
      return true;
    }

    const userPermissions = user.permissions || [];
    return userPermissions.includes(permission);
  }, [user]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions || permissions.length === 0) return false;
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  // Check if user has all of the given permissions
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!permissions || permissions.length === 0) return true;
      return permissions.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  // Check if user is Super Admin
  const isSuperAdmin = useCallback((): boolean => {
    if (!user) return false;
    return (
      user.role === 'Super Admin' ||
      user.role === 'super admin' ||
      user.role?.toLowerCase() === 'super admin' ||
      user.role === 'super-admin' ||
      user.is_super_admin === true
    );
  }, [user]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };
}
