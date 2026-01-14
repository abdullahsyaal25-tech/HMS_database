import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    Users,
    Calendar,
    FileText,
    Pill,
    FlaskConical,
    LayoutGrid,
    Settings,
    User,
    FileBarChart,
    Building,
} from 'lucide-react';
import {  usePage } from '@inertiajs/react';
import { type NavItem } from '@/types';
import {  ReactNode } from 'react';

interface HospitalLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

function usePermissionChecker() {
    console.log('usePermissionChecker called');
    try {
        const page = usePage();
        console.log('usePage successful:', page);
        const userPermissions = page.props.auth?.user?.permissions || [];

        const hasPermission = (permission: string): boolean => {
            return userPermissions.includes(permission);
        };

        return { hasPermission };
    } catch (error) {
        console.error('Error in usePage:', error);
        return { hasPermission: () => false };
    }
}

function useFilteredNavItems() {
    const { hasPermission } = usePermissionChecker();
    
    const allNavItems: (NavItem & { permission?: string })[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            permission: 'view-dashboard',
        },
        {
            title: 'Reports',
            href: '/reports',
            icon: FileBarChart,
            permission: 'view-reports',
        },
        {
            title: 'Patients',
            href: '/patients',
            icon: Users,
            permission: 'view-patients',
        },
        {
            title: 'Doctors',
            href: '/doctors',
            icon: User,
            permission: 'view-doctors',
        },
        {
            title: 'Appointments',
            href: '/appointments',
            icon: Calendar,
            permission: 'view-appointments',
        },
        {
            title: 'Billing',
            href: '/billing',
            icon: FileText,
            permission: 'view-billing',
        },
        {
            title: 'Pharmacy',
            href: '/pharmacy/medicines',
            icon: Pill,
            permission: 'view-pharmacy',
        },
        {
            title: 'Laboratory',
            href: '/laboratory/lab-tests',
            icon: FlaskConical,
            permission: 'view-laboratory',
        },
        {
            title: 'Departments',
            href: '/departments',
            icon: Building,
            permission: 'view-departments',
        },

        {
            title: 'User Management',
            href: '/admin',
            icon: Users,
            permission: 'view-users',
        },
        {
            title: 'Settings',
            href: '/settings',
            icon: Settings,
            permission: 'view-settings',
        },
    ];
    
    return allNavItems.filter(item => {
        if (!item.permission) {
            return true; // Always show items without specific permission requirement
        }
        return hasPermission(item.permission);
    });
}

const footerNavItems: NavItem[] = [

];

export default function HospitalLayout({ header, children }: HospitalLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="h-16">
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate text-xs">Hospital Management System</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="py-0">
                        <NavMain items={useFilteredNavItems()} />
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <main className="flex flex-1 flex-col">
                {header && (
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {header}
                        </h2>
                    </header>
                )}
                <div className="flex-1 overflow-auto p-4">
                    {children}
                </div>
            </main>
        </AppShell>
    );
}
