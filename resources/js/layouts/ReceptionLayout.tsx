import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
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
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    Users,
    Calendar,
    User,
    LayoutGrid,
    Building,
    Building2,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { ReactNode, useMemo, useCallback, useState } from 'react';

// Import authorization components
import { UnauthorizedAccessModal, type RiskLevel } from '@/components/UnauthorizedAccessModal';
import { FlashMessageHandler } from '@/components/FlashMessageHandler';

interface ReceptionLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

interface ModalConfig {
    title?: string;
    message?: string;
    riskLevel?: RiskLevel;
    requiredPermission?: string;
    showRequestAccess?: boolean;
    redirectUrl?: string;
}

function usePermissionChecker() {
    const page = usePage();
    
    // Get auth directly from Inertia props - available during SSR
    const auth = page.props.auth;
    const user = auth?.user;
    
    // More robust authentication check
    const isAuthenticated = !!(user && user.id);
    
    // Check if user is a reception-admin (restricted user)
    const isRestrictedUser = useCallback((): boolean => {
        if (!user) {
            return true; // Not authenticated = restricted
        }

        // If user has is_super_admin flag set to true, they are NOT restricted
        if (user.is_super_admin === true) {
            return false;
        }

        // Check if user is a reception admin - ONLY this role should be restricted
        const userRole = user.role;
        const userRoleSlug = user.roleModel?.slug;

        // Restrict only reception admin role (case-insensitive check)
        const isReceptionAdmin = userRoleSlug === 'reception-admin' ||
            userRole?.toLowerCase() === 'reception admin' ||
            userRole?.toLowerCase() === 'reception-admin';

        if (isReceptionAdmin) {
            return true;
        }

        // All other users (super admin, sub super admin, etc.) are NOT restricted
        return false;
    }, [user]);

    const hasPermission = useCallback((permission: string): boolean => {
        // If user is not authenticated, deny all permission checks
        if (!isAuthenticated) {
            return false;
        }
        
        const userPermissions = user?.permissions || [];
        
        // Super Admin bypass
        if (user?.is_super_admin === true) {
            return true;
        }
        
        return userPermissions.includes(permission);
    }, [user, isAuthenticated]);

    return { hasPermission, isAuthenticated, isRestrictedUser, user };
}

const footerNavItems: NavItem[] = [];

export default function ReceptionLayout({ header, children }: ReceptionLayoutProps): ReactNode {
    const { hasPermission, isAuthenticated, isRestrictedUser, user } = usePermissionChecker();
    const page = usePage();

    // State for unauthorized access modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        riskLevel: 'medium',
    });

    // Navigation items for Reception Admin - only Doctor, Patient, Department, and Reception
    const filteredNavItems = useMemo(() => {
        const items: NavItem[] = [];

        // Home - only for Super Admin
        const isSuperAdmin = user?.is_super_admin === true;
        if (isSuperAdmin) {
            items.push({
                title: 'Home',
                href: '/dashboard',
                icon: Building2,
            });
        }

        // Doctors - visible to all with permission
        if (hasPermission('view-doctors')) {
            items.push({
                title: 'Doctors',
                href: '/doctors',
                icon: User,
            });
        }

        // Departments - visible to all with permission
        if (hasPermission('view-departments')) {
            items.push({
                title: 'Departments',
                href: '/departments',
                icon: Building,
            });
        }

        // Reception (Appointments) - visible to all with permission
        if (hasPermission('view-appointments')) {
            items.push({
                title: 'Reception',
                href: '/appointments',
                icon: Calendar,
                items: [
                    {
                        title: 'Appointments',
                        href: '/appointments',
                        icon: Calendar,
                    },
                    {
                        title: 'Patients',
                        href: '/patients',
                        icon: Users,
                    },
                ],
            });
        }

        return items;
    }, [hasPermission, isRestrictedUser]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // Check if user is admin for security alerts
    const isAdmin = useMemo(() => {
        return user?.role === 'Super Admin' || user?.is_super_admin === true;
    }, [user]);
    
    return (
        <AppShell variant="sidebar">
            {/* Flash Message Handler - Displays toast notifications */}
            <FlashMessageHandler position="top-right" defaultDuration={5000} />
            
            {/* Unauthorized Access Modal */}
            <UnauthorizedAccessModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={modalConfig.title}
                message={modalConfig.message}
                requiredPermission={modalConfig.requiredPermission}
                riskLevel={modalConfig.riskLevel}
                showRequestAccess={modalConfig.showRequestAccess}
                redirectUrl={modalConfig.redirectUrl}
            />
            
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">HMS</span>
                                        <span className="text-xs text-muted-foreground">Reception</span>
                                    </div>
                                </div>
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
                <header className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        {header}
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </AppShell>
    );
}
