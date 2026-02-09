import type React from 'react';

export interface User {
    id: number;
    name: string;
    email?: string;
    username?: string;
    avatar?: string;
    role?: string;
    role_id?: number;
    permissions?: string[];
    two_factor_confirmed_at?: string | null;
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
}
export interface NavItem {
    label?: string;
    title?: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    items?: NavItem[]; // Submenu items
    permission?: string; // Required permission to view this item
}

export interface BreadcrumbItem {
    label?: string;
    title?: string;
    href?: string;
    active?: boolean;
}

export interface SharedData {
    auth: {
        user: User;
    };
    [key: string]: unknown;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    flash?: {
        success?: string;
        error?: string;
    };
};
