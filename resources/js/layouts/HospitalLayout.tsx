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
    FileText,
    Pill,
    FlaskConical,
    LayoutGrid,
    Settings,
    User,
    FileBarChart,
    Building,
    Package,
    AlertTriangle,
    Shield,
    Lock,
    CreditCard,
    Activity,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { ReactNode, useMemo, useCallback, useState, useEffect } from 'react';

// Import new authorization components
import { UnauthorizedAccessModal, type RiskLevel } from '@/components/UnauthorizedAccessModal';
import { FlashMessageHandler } from '@/components/FlashMessageHandler';
import { SecurityAlertListener } from '@/components/SecurityAlertListener';

interface HospitalLayoutProps {
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
    
    const hasPermission = useCallback((permission: string): boolean => {
        // If user is not authenticated, deny all permission checks
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

const footerNavItems: NavItem[] = [

];

export default function HospitalLayout({ header, children }: HospitalLayoutProps): ReactNode {
    const { hasPermission, isAuthenticated, user } = usePermissionChecker();
    const page = usePage();
    
    // State for unauthorized access modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<ModalConfig>({
        title: 'Access Denied',
        message: 'You do not have permission to access this resource.',
        riskLevel: 'medium',
    });

    // Listen for modal trigger data from Inertia props
    useEffect(() => {
        const auth = page.props.auth as {
            showUnauthorizedModal?: boolean;
            modalConfig?: ModalConfig;
        } | undefined;

        if (auth?.showUnauthorizedModal) {
            setModalConfig({
                title: auth.modalConfig?.title || 'Access Denied',
                message: auth.modalConfig?.message || 'You do not have permission to access this resource.',
                riskLevel: auth.modalConfig?.riskLevel || 'medium',
                requiredPermission: auth.modalConfig?.requiredPermission,
                showRequestAccess: auth.modalConfig?.showRequestAccess ?? false,
                redirectUrl: auth.modalConfig?.redirectUrl || '/dashboard',
            });
            setIsModalOpen(true);
        }
    }, [page.props.auth]);

    // Check if user is admin for security alerts
    const isAdmin = useMemo(() => {
        return user?.role === 'Super Admin' || user?.is_super_admin === true;
    }, [user]);
    
    const filteredNavItems = useMemo(() => {
        const allNavItems: (NavItem & { permission?: string })[] = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
                permission: 'view-dashboard',
            },
           
            {
                title: 'Doctors',
                href: '/doctors',
                icon: User,
                permission: 'view-doctors',
            },
            {
                title: 'Reception',
                href: '/appointments/dashboard',
                icon: Calendar,
                permission: 'view-appointments',
                items: [
                   {
                title: 'Patients',
                href: '/patients',
                icon: Users,
                   },
                    {
                        title: 'Reception',
                        href: '/appointments',
                        icon: Calendar,
                    },
                    {
                        title: 'Reception Dashboard',
                        href: '/departments/services',
                        icon: Package,
                    },
                ],
            },
            {
                title: 'Departments',
                href: '/departments',
                icon: Building,
                permission: 'view-departments',
            },
            {
                title: 'Wallet',
                href: '/wallet',
                icon: CreditCard,
                permission: 'view-wallet',
            },
            {
                title: 'Pharmacy',
                href: '/pharmacy',
                icon: Pill,
                permission: 'view-pharmacy',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/pharmacy',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Medicines',
                        href: '/pharmacy/medicines',
                        icon: Pill,
                    },
                    {
                        title: 'Sales',
                        href: '/pharmacy/sales',
                        icon: FileText,
                    },
                    {
                        title: 'Stock',
                        href: '/pharmacy/stock',
                        icon: Package,
                    },
                    {
                        title: 'Alerts',
                        href: '/pharmacy/alerts',
                        icon: AlertTriangle,
                    },
                    {
                        title: 'Reports',
                        href: '/pharmacy/reports',
                        icon: FileBarChart,
                    },
                ],
            },
            {
                title: 'Laboratory',
                href: '/laboratory',
                icon: FlaskConical,
                permission: 'view-laboratory',
                items: [
                    {
                        title: 'Dashboard',
                        href: '/laboratory',
                        icon: FlaskConical,
                    },
                    {
                        title: 'Lab Tests',
                        href: '/laboratory/lab-tests',
                        icon: FlaskConical,
                    },
                    {
                        title: 'Test Requests',
                        href: '/laboratory/lab-test-requests',
                        icon: FlaskConical,
                    },
                    {
                        title: 'Results',
                        href: '/laboratory/lab-test-results',
                        icon: FlaskConical,
                    },
                ],
            },
            

            
            {
                title: 'RBAC',
                href: '/admin/rbac',
                icon: Shield,
                permission: 'admin.access',
                items: [
                    {
                        title: 'User Management',
                        href: '/admin',
                        icon: Users,
                    },
                  
                    {
                        title: 'Permissions',
                        href: '/admin/permissions',
                        icon: Lock,
                    },
                ],
            },
        ];
        
        // If user is not authenticated, show all navigation items
        // If user is authenticated, filter by permissions
        if (!isAuthenticated) {
            return allNavItems;
        }
        
        return allNavItems.filter(item => {
            if (!item.permission) {
                return true; // Always show items without specific permission requirement
            }
            return hasPermission(item.permission);
        });
    }, [hasPermission, isAuthenticated]);

    // Handle modal close
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);
    
    return (
        <AppShell variant="sidebar">
            {/* Flash Message Handler - Displays toast notifications */}
            <FlashMessageHandler position="top-right" defaultDuration={5000} />
            
            {/* Security Alert Listener - Real-time alerts for admins */}
            {isAdmin && (
                <SecurityAlertListener 
                    userId={user?.id} 
                    isAdmin={isAdmin} 
                    position="top-right"
                />
            )}
            
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
                                        <span className="text-xs text-muted-foreground">Hospital Management</span>
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
