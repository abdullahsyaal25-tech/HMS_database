import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
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
import { ReactNode } from 'react';

interface HospitalLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

function usePermissionChecker() {
    console.log('usePermissionChecker called');
    try {
        const page = usePage();
        console.log('usePage successful:', page);
        const user = page.props.auth?.user;
        const userPermissions = user?.permissions || [];
        const userRole = user?.role;

        const hasPermission = (permission: string): boolean => {
            // Super Admin bypass
            if (userRole === 'Super Admin') return true;
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
    const filteredNavItems = useFilteredNavItems();
    
    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={filteredNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
                    <SidebarTrigger className="-ml-1" />
                    {header && (
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {header}
                        </h2>
                    )}
                </header>
                <div className="flex-1 overflow-auto p-4">
                    {children}
                </div>
            </SidebarInset>
        </AppShell>
    );
}
