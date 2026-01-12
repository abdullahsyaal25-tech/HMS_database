export interface User {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
    role?: string;
    permissions?: string[];
}

export interface BreadcrumbItem {
    label?: string;
    href?: string;
    title?: string;
}

export interface NavItem {
    label?: string;
    title?: string;
    href: string | any; // RouteDefinition type
    icon?: any; // Icon component type
}

export interface SharedData {
    auth: {
        user: User;
    };
    [key: string]: any;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};
