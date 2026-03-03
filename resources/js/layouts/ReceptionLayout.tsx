import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ProfileNav } from '@/components/profile-nav';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Users,
    Building2,
    User,
    Calendar,
} from 'lucide-react';
import { ReactNode, useMemo, useCallback } from 'react';
import { Link } from '@inertiajs/react';

interface ReceptionLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

function usePermissionChecker() {
    const page = usePage();
    const auth = page.props.auth;
    const user = auth?.user;
    const isAuthenticated = !!(user && user.id);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!isAuthenticated) {
            return false;
        }

        const userPermissions = user?.permissions || [];
        const userRole = user?.role;

        // Super Admin bypass - check for various formats
        if (userRole === 'Super Admin' ||
            userRole === 'super admin' ||
            userRole?.toLowerCase() === 'super admin' ||
            userRole === 'super-admin') {
            return true;
        }

        // Also check if user has isSuperAdmin flag (snake_case from PHP)
        if (user?.is_super_admin === true) {
            return true;
        }

        return userPermissions.includes(permission);
    }, [user, isAuthenticated]);

    return { hasPermission, isAuthenticated, user };
}

// Reception-specific navigation items - ONLY allowed pages for Reception admin
const getReceptionNavItems = (hasPermission: (p: string) => boolean): (NavItem & { permission?: string })[] => [
    {
        title: 'Patients',
        href: '/patients',
        icon: Users,
        permission: 'view-patients',
        items: [
            {
                title: 'All Patients',
                href: '/patients',
                icon: Users,
            },
            ...(hasPermission('create-patients') ? [
                {
                    title: 'Create Patient',
                    href: '/patients/create',
                    icon: Calendar,
                }
            ] : []),
        ],
    },
    {
        title: 'Departments',
        href: '/departments',
        icon: Building2,
        permission: 'view-departments',
        items: [
            {
                title: 'All Departments',
                href: '/departments',
                icon: Building2,
            },
            ...(hasPermission('create-departments') ? [
                {
                    title: 'Create Department',
                    href: '/departments/create',
                    icon: Calendar,
                }
            ] : []),
        ],
    },
    {
        title: 'Doctors',
        href: '/doctors',
        icon: User,
        permission: 'view-doctors',
        items: [
            {
                title: 'All Doctors',
                href: '/doctors',
                icon: User,
            },
            ...(hasPermission('create-doctors') ? [
                {
                    title: 'Create Doctor',
                    href: '/doctors/create',
                    icon: Calendar,
                }
            ] : []),
        ],
    },
];

const footerNavItems: NavItem[] = [];

export default function ReceptionLayout({
    header,
    children,
}: ReceptionLayoutProps) {
    const { hasPermission, isAuthenticated } = usePermissionChecker();

    const filteredNavItems = useMemo(() => {
        const receptionNavItems = getReceptionNavItems(hasPermission);

        if (!isAuthenticated) {
            return receptionNavItems;
        }

        return receptionNavItems.filter(item => {
            if (!item.permission) {
                return true;
            }
            return hasPermission(item.permission);
        });
    }, [hasPermission, isAuthenticated]);

    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <Link href="/patients" className="flex items-center gap-2 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">Reception</span>
                                        <span className="text-xs text-muted-foreground">Admin Module</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent className="px-2 flex-1 overflow-y-auto">
                    {filteredNavItems.length > 0 ? (
                        <NavMain items={filteredNavItems} />
                    ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No navigation items available
                        </div>
                    )}
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border/50 p-2">
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <ProfileNav />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="bg-background">
                {header && (
                    <header className="border-b bg-card px-6 py-4">
                        {header}
                    </header>
                )}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </AppShell>
    );
}
