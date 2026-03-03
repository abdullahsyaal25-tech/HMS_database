/**
 * Authorization Types
 * 
 * TypeScript type definitions for authorization-related components and hooks
 */

import type { ReactNode } from 'react';

// ============================================
// Risk Levels
// ============================================
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

// ============================================
// Flash Messages
// ============================================
export type FlashMessageType = 'success' | 'error' | 'warning' | 'info';

export interface FlashMessage {
    id: string;
    type: FlashMessageType;
    message: string;
    title?: string;
    duration?: number;
}

export interface FlashMessageHandlerProps {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    defaultDuration?: number;
    maxMessages?: number;
}

// ============================================
// Unauthorized Access Modal
// ============================================
export interface UnauthorizedAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    requiredPermission?: string;
    riskLevel?: RiskLevel;
    showRequestAccess?: boolean;
    redirectUrl?: string;
    onRequestAccess?: () => void;
    onContactAdmin?: () => void;
}

export interface UnauthorizedOptions {
    title?: string;
    message?: string;
    requiredPermission?: string;
    riskLevel?: RiskLevel;
    showRequestAccess?: boolean;
    redirectUrl?: string;
}

// ============================================
// Security Alerts
// ============================================
export type SecurityAlertType = 
    | 'unauthorized_access' 
    | 'privilege_escalation' 
    | 'anomaly_detected' 
    | 'permission_change' 
    | 'session_alert';

export type SecurityAlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityAlert {
    id: string;
    type: SecurityAlertType;
    severity: SecurityAlertSeverity;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    read: boolean;
}

export interface SecurityAlertListenerProps {
    userId?: number;
    isAdmin?: boolean;
    maxAlerts?: number;
    position?: 'top-right' | 'bottom-right';
}

// ============================================
// Authorization Hook
// ============================================
export interface UseAuthorizationReturn {
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    showUnauthorizedModal: (options: UnauthorizedOptions) => void;
    hideUnauthorizedModal: () => void;
    userPermissions: string[];
    isLoading: boolean;
    isSuperAdmin: boolean;
    modalState: {
        isOpen: boolean;
        options: UnauthorizedOptions;
    };
}

export interface PermissionGuardOptions {
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    unauthorizedOptions?: UnauthorizedOptions;
}

export interface PermissionComponentProps {
    children: ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
    fallback?: ReactNode;
}

// ============================================
// Inertia Auth Types
// ============================================
export interface AuthProps {
    user: {
        id: number;
        name: string;
        email?: string;
        username?: string;
        role?: string;
        role_id?: number;
        permissions?: string[];
        is_super_admin?: boolean;
        roleModel?: {
            id: number;
            name: string;
            slug: string;
            priority: number;
            is_system: boolean;
            module_access?: string[];
            data_visibility_scope?: Record<string, unknown>;
        };
    };
    showUnauthorizedModal?: boolean;
    modalConfig?: {
        title?: string;
        message?: string;
        riskLevel?: RiskLevel;
        requiredPermission?: string;
        showRequestAccess?: boolean;
        redirectUrl?: string;
    };
}

// ============================================
// Page Props with Auth
// ============================================
export interface PagePropsWithAuth {
    auth: AuthProps;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}
