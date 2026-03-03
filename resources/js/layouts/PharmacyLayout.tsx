import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { ProfileNav } from '@/components/profile-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    AlertTriangle,
    ArrowRight,
    BarChart3,
    Building2,
    LayoutGrid,
    Package,
    Pill,
    Plus,
    ShoppingCart,
    TrendingDown,
    AlertCircle,
} from 'lucide-react';
import { ReactNode, useMemo, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface PharmacyLayoutProps {
    header?: ReactNode;
    children: ReactNode;
    showQuickActions?: boolean;
    alerts?: {
        lowStock?: number;
        expiringSoon?: number;
        expired?: number;
        critical?: number;
    };
}

export default function PharmacyLayout({
    header,
    children,
    showQuickActions = true,
    alerts = {},
}: PharmacyLayoutProps) {
    const page = usePage();
    const auth = page.props.auth;
    const user = auth?.user;
    const isAuthenticated = !!user;
    const totalAlerts = (alerts.lowStock || 0) + (alerts.expiringSoon || 0) + (alerts.expired || 0);

    // Check if user is a pharmacy admin
    const isPharmacyAdminUser = useCallback((): boolean => {
        if (!user) return false;
        
        const userRole = user.role;
        const userRoleSlug = user.roleModel?.slug;
        
        // Check for pharmacy admin role - be more flexible with matching
        const isPharmacyRole = 
            userRole?.toLowerCase().includes('pharmacy') ||
            userRoleSlug?.toLowerCase().includes('pharmacy');
        
        return !!isPharmacyRole;
    }, [user]);

    // Check if user has a specific permission
    const hasPermission = useCallback((permission: string): boolean => {
        if (!user) return false;
        return user.permissions?.includes(permission) ?? false;
    }, [user]);

    const filteredNavItems = useMemo(() => {
        // Build navigation items
        const items: NavItem[] = [];
        
        // Home - only for users who are NOT pharmacy admins (i.e., super admins)
        if (!isPharmacyAdminUser()) {
            items.push({
                title: 'Home',
                href: '/dashboard',
                icon: Building2,
            });
        }
        
        // Dashboard - visible to everyone with permission
        if (hasPermission('view-dashboard')) {
            items.push({
                title: 'Dashboard',
                href: '/pharmacy',
                icon: LayoutGrid,
            });
        }
        
        // Sale Dashboard - only for users who are NOT pharmacy admins (i.e., super admins)
        if (!isPharmacyAdminUser()) {
            items.push({
                title: 'Sale Dashboard',
                href: '/pharmacy/sales/dashboard',
                icon: BarChart3,
            });
        }
        
        // Sale section - visible to all authenticated users
        items.push({
            title: 'Sale',
            href: '/pharmacy/sales',
            icon: BarChart3,
            items: [
                {
                    title: 'New Sale',
                    href: '/pharmacy/sales/create',
                    icon: Plus,
                },
                {
                    title: 'Sales List',
                    href: '/pharmacy/sales',
                    icon: ShoppingCart,
                },
            ],
        });

        // Medicines section
        items.push({
            title: 'Medicines',
            href: '/pharmacy/medicines',
            icon: Pill,
            items: [
                {
                    title: 'Add Medicine',
                    href: '/pharmacy/medicines/create',
                    icon: Plus,
                },
                {
                    title: 'All Medicines',
                    href: '/pharmacy/medicines',
                    icon: Pill,
                },
                {
                    title: 'Categories',
                    href: '/pharmacy/categories',
                    icon: Package,
                },
            ],
        });

        // Stock section
        items.push({
            title: 'Stock',
            href: '/pharmacy/stock',
            icon: Package,
            items: [
                {
                    title: 'Stock Overview',
                    href: '/pharmacy/stock',
                    icon: Package,
                },
                {
                    title: 'Movements',
                    href: '/pharmacy/stock/movements',
                    icon: TrendingDown,
                },
                {
                    title: 'Adjustments',
                    href: '/pharmacy/stock/adjustments',
                    icon: AlertCircle,
                },
            ],
        });

        // Purchases section
        items.push({
            title: 'Purchases',
            href: '/pharmacy/purchases',
            icon: ShoppingCart,
            items: [
                {
                    title: 'All Purchases',
                    href: '/pharmacy/purchases',
                    icon: BarChart3,
                },
                {
                    title: 'New Purchase',
                    href: '/pharmacy/purchases/create',
                    icon: Plus,
                },
            ],
        });

        // Alerts section - check permission
        if (hasPermission('pharmacy.alerts.view')) {
            items.push({
                title: 'Alerts',
                href: '/pharmacy/alerts',
                icon: AlertTriangle,
            });
        }

        // Reports section - visible to all
        items.push({
            title: 'Reports',
            href: '/pharmacy/reports',
            icon: BarChart3,
            items: [
                {
                    title: 'Overview',
                    href: '/pharmacy/reports',
                    icon: BarChart3,
                },
                {
                    title: 'Sales Report',
                    href: '/pharmacy/reports/sales',
                    icon: ShoppingCart,
                },
                {
                    title: 'Stock Report',
                    href: '/pharmacy/reports/stock',
                    icon: Package,
                },
                {
                    title: 'Expiry Report',
                    href: '/pharmacy/reports/expiry',
                    icon: AlertCircle,
                },
            ],
        });

        return items;
    }, [isPharmacyAdminUser, hasPermission]);

    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <Link href="/pharmacy" className="flex items-center gap-2 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                                        <Pill className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">Pharmacy</span>
                                        <span className="text-xs text-muted-foreground">Management Module</span>
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
                    {/* Alerts Summary in Sidebar */}
                    {totalAlerts > 0 && (
                        <div className="mb-3 px-2">
                            <Link href="/pharmacy/alerts">
                                <div className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                                    "bg-red-50 hover:bg-red-100 border border-red-200"
                                )}>
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <span className="flex-1 text-red-700 font-medium">
                                        {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-red-600" />
                                </div>
                            </Link>
                        </div>
                    )}
                   
                    <NavFooter items={[]} className="mt-auto" />
                    <ProfileNav />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="bg-background">
                {/* Header */}
                <header className="flex flex-col border-b">

                    {/* Alerts Banner */}
                    {(alerts.lowStock || alerts.expiringSoon || alerts.expired) && (
                        <div className="px-6 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {(alerts.expired ?? 0) > 0 && (
                                    <Link href="/pharmacy/alerts?type=expired">
                                        <Badge variant="destructive" className="cursor-pointer hover:opacity-90">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            {alerts.expired} Expired
                                        </Badge>
                                    </Link>
                                )}
                                {(alerts.expiringSoon ?? 0) > 0 && (
                                    <Link href="/pharmacy/alerts?type=expiring">
                                        <Badge className="bg-orange-500 hover:bg-orange-600 cursor-pointer">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            {alerts.expiringSoon} Expiring Soon
                                        </Badge>
                                    </Link>
                                )}
                                {(alerts.lowStock ?? 0) > 0 && (
                                    <Link href="/pharmacy/alerts?type=low-stock">
                                        <Badge className="bg-amber-500 hover:bg-amber-600 cursor-pointer">
                                            <TrendingDown className="h-3 w-3 mr-1" />
                                            {alerts.lowStock} Low Stock
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </AppShell>
    );
}
