import React, { ReactNode, useMemo } from 'react';
import { usePermission } from '@/composables/usePermission';

interface PermissionGateProps {
  /**
   * Single permission to check
   */
  permission?: string;
  
  /**
   * Array of permissions to check (AND logic - user must have ALL permissions)
   */
  permissions?: string[];
  
  /**
   * Array of permissions to check (OR logic - user must have AT LEAST ONE permission)
   */
  anyPermission?: string[];
  
  /**
   * Single role to check
   */
  role?: string;
  
  /**
   * Array of roles to check (user must have AT LEAST ONE role)
   */
  roles?: string[];
  
  /**
   * Module name to check access for
   */
  module?: string;
  
  /**
   * Action to check within the module
   */
  action?: 'view' | 'create' | 'update' | 'delete' | 'manage';
  
  /**
   * Children to render if permission/role check passes
   */
  children: ReactNode;
  
  /**
   * Fallback content to render if permission/role check fails
   */
  fallback?: ReactNode;
  
  /**
   * Whether to hide the element completely (removes from DOM)
   */
  hideOnUnauthorized?: boolean;
  
  /**
   * Show a message when access is denied
   */
  showDeniedMessage?: boolean;
  
  /**
   * Custom denied message
   */
  deniedMessage?: string;
}

/**
 * PermissionGate Component
 * 
 * Controls visibility of content based on user permissions and roles.
 * Supports multiple permission checking strategies:
 * - Single permission check
 * - Multiple permissions with AND logic (all required)
 * - Multiple permissions with OR logic (any required)
 * - Single role check
 * - Multiple roles check
 * - Module-action based access
 */
export function PermissionGate({
  permission,
  permissions,
  anyPermission,
  role,
  roles,
  module,
  action,
  children,
  fallback = null,
  hideOnUnauthorized = false,
  showDeniedMessage = false,
  deniedMessage,
}: PermissionGateProps) {
  const { 
    hasPermission: checkPermission, 
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyRole: checkAnyRole,
    isSuperAdmin,
    canAccessModule: checkModuleAccess,
    isLoading,
  } = usePermission();

  // Determine if access is granted
  const hasAccess = useMemo(() => {
    // Super admin always has access
    if (isSuperAdmin()) {
      return true;
    }

    // Check single permission
    if (permission) {
      return checkPermission(permission);
    }

    // Check multiple permissions with AND logic
    if (permissions && permissions.length > 0) {
      return checkAllPermissions(permissions);
    }

    // Check multiple permissions with OR logic
    if (anyPermission && anyPermission.length > 0) {
      return checkAnyPermission(anyPermission);
    }

    // Check single role
    if (role) {
      return checkAnyRole([role]);
    }

    // Check multiple roles
    if (roles && roles.length > 0) {
      return checkAnyRole(roles);
    }

    // Check module-action access
    if (module && action) {
      return checkModuleAccess(module, action);
    }

    // No restriction defined - allow access
    return true;
  }, [
    permission,
    permissions,
    anyPermission,
    role,
    roles,
    module,
    action,
    checkPermission,
    checkAllPermissions,
    checkAnyPermission,
    checkAnyRole,
    isSuperAdmin,
    checkModuleAccess,
  ]);

  // Loading state - show fallback while loading
  if (isLoading) {
    if (hideOnUnauthorized) {
      return null;
    }
    return <>{fallback}</>;
  }

  // Access denied - show fallback
  if (!hasAccess) {
    if (showDeniedMessage) {
      return (
        <div className="permission-denied-message">
          {deniedMessage || 'You do not have permission to access this content.'}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  // Access granted - render children
  return <>{children}</>;
}

/**
 * RoleGate Component
 * 
 * A simpler component for role-based access control.
 * Checks if the user has any of the specified roles.
 */
interface RoleGateProps {
  /**
   * Single role to check
   */
  role: string;
  
  /**
   * Array of roles to check (user must have AT LEAST ONE)
   */
  roles?: string[];
  
  /**
   * Children to render if role check passes
   */
  children: ReactNode;
  
  /**
   * Fallback content to render if role check fails
   */
  fallback?: ReactNode;
}

export function RoleGate({
  role,
  roles,
  children,
  fallback = null,
}: RoleGateProps) {
  const { hasAnyRole: checkAnyRole, isSuperAdmin } = usePermission();

  const roleList = useMemo(() => {
    if (roles && roles.length > 0) {
      return roles;
    }
    return [role];
  }, [role, roles]);

  const hasAccess = useMemo(() => {
    if (isSuperAdmin()) {
      return true;
    }
    return checkAnyRole(roleList);
  }, [roleList, checkAnyRole, isSuperAdmin]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * ModuleGate Component
 * 
 * Checks access to a specific module with a specific action.
 */
interface ModuleGateProps {
  /**
   * Module name to check
   */
  module: string;
  
  /**
   * Action to check
   */
  action: 'view' | 'create' | 'update' | 'delete' | 'manage';
  
  /**
   * Children to render if access is granted
   */
  children: ReactNode;
  
  /**
   * Fallback content to render if access is denied
   */
  fallback?: ReactNode;
}

export function ModuleGate({
  module,
  action,
  children,
  fallback = null,
}: ModuleGateProps) {
  const { canAccessModule: checkModuleAccess, isSuperAdmin } = usePermission();

  const hasAccess = useMemo(() => {
    if (isSuperAdmin()) {
      return true;
    }
    return checkModuleAccess(module, action);
  }, [module, action, checkModuleAccess, isSuperAdmin]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * PermissionAndRoleGate Component
 * 
 * Requires BOTH a specific permission AND a specific role.
 */
interface PermissionAndRoleGateProps {
  /**
   * Permission required
   */
  permission: string;
  
  /**
   * Role required
   */
  role: string;
  
  /**
   * Children to render if both checks pass
   */
  children: ReactNode;
  
  /**
   * Fallback content if either check fails
   */
  fallback?: ReactNode;
}

export function PermissionAndRoleGate({
  permission,
  role,
  children,
  fallback = null,
}: PermissionAndRoleGateProps) {
  const { hasPermission: checkPermission, hasAnyRole: checkAnyRole, isSuperAdmin } = usePermission();

  const hasAccess = useMemo(() => {
    if (isSuperAdmin()) {
      return true;
    }
    return checkPermission(permission) && checkAnyRole([role]);
  }, [permission, role, checkPermission, checkAnyRole, isSuperAdmin]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * PermissionOrRoleGate Component
 * 
 * Requires EITHER a specific permission OR a specific role.
 */
interface PermissionOrRoleGateProps {
  /**
   * Permission required
   */
  permission: string;
  
  /**
   * Role required
   */
  role: string;
  
  /**
   * Children to render if either check passes
   */
  children: ReactNode;
  
  /**
   * Fallback content if both checks fail
   */
  fallback?: ReactNode;
}

export function PermissionOrRoleGate({
  permission,
  role,
  children,
  fallback = null,
}: PermissionOrRoleGateProps) {
  const { hasPermission: checkPermission, hasAnyRole: checkAnyRole, isSuperAdmin } = usePermission();

  const hasAccess = useMemo(() => {
    if (isSuperAdmin()) {
      return true;
    }
    return checkPermission(permission) || checkAnyRole([role]);
  }, [permission, role, checkPermission, checkAnyRole, isSuperAdmin]);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
