import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { ProfileNav } from '@/components/profile-nav';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Activity,
    Users,
    Pill,
    FlaskConical,
    Building2,
    FileText,
    Calendar,
    Wallet,
    Settings,
    Shield,
    HeartPulse,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Administration',
        icon: Settings,
        items: [
            {
                title: 'System Health',
                href: '/system-health',
                icon: HeartPulse,
                permission: 'view-system-health',
            },
            {
                title: 'User Management',
                href: '/admin/users',
                icon: Users,
                permission: 'view-users',
            },
            {
                title: 'Permissions',
                href: '/admin/permissions',
                icon: Shield,
                permission: 'view-rbac-dashboard',
            },
            {
                title: 'Security Center',
                href: '/admin/security',
                icon: Shield,
                permission: 'view-users',
            },
        ],
    },
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <ProfileNav />
            </SidebarFooter>
        </Sidebar>
    );
}
