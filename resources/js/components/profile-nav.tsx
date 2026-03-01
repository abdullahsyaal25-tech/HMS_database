import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout, edit } from '@/routes';
import { type User } from '@/types';
import { usePage, Link } from '@inertiajs/react';
import { ChevronsUpDown, LogOut, UserCircle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileNavProps {
    className?: string;
}

export function ProfileNav({ className }: ProfileNavProps) {
    const page = usePage();
    const { auth } = page.props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const getInitials = useInitials();
    const cleanup = useMobileNavigation();

    // Safely access user with fallback for undefined auth state
    const user = auth?.user as User | undefined;

    // Handle logout with cleanup
    const handleLogout = () => {
        cleanup();
    };

    // Get user role display name
    const getUserRole = (): string | null => {
        if (!user) return null;
        // Check for roleModel first (preferred)
        if (user.roleModel?.name) {
            return user.roleModel.name;
        }
        // Fall back to role string
        if (user.role) {
            return user.role;
        }
        // Check for super admin
        if (user.is_super_admin) {
            return 'Super Admin';
        }
        return null;
    };

    // Get role badge color based on role
    const getRoleBadgeColor = (): string => {
        const role = getUserRole()?.toLowerCase() || '';
        if (role.includes('admin')) return 'bg-black-100 text-black-700 dark:bg-black-900/30 dark:text-black-300';
        if (role.includes('doctor')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        if (role.includes('nurse')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
        if (role.includes('receptionist')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
        if (role.includes('pharmacist')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    };

    // Show loading state while auth is being determined
    if (!user) {
        return (
            <SidebarMenu className={className}>
                <SidebarMenuItem>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    const userRole = getUserRole();
    const roleBadgeColor = getRoleBadgeColor();

    return (
        <SidebarMenu className={cn("mt-auto", className)}>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                "group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                                "hover:bg-sidebar-accent/50 transition-colors duration-200",
                                "border border-transparent hover:border-sidebar-border/50",
                                "rounded-xl px-3 py-3 h-auto"
                            )}
                            data-test="profile-nav-button"
                        >
                            {/* Avatar with online indicator */}
                            <div className="relative">
                                <Avatar className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-sidebar-border/50 group-hover:ring-sidebar-border transition-all">
                                    <AvatarImage 
                                        src={user.avatar} 
                                        alt={user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className={cn(
                                        "rounded-full text-sm font-semibold",
                                        "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
                                    )}>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {/* Online status indicator */}
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-sidebar-background" />
                            </div>

                            {/* User info */}
                            <div className="grid flex-1 text-left min-w-0">
                                <span className="truncate font-semibold text-sm leading-tight text-sidebar-foreground">
                                    {user.name}
                                </span>
                                {userRole && state === 'expanded' && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Shield className="h-3 w-3 text-muted-foreground" />
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider",
                                            roleBadgeColor
                                        )}>
                                            {userRole}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Expand icon */}
                            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-64 rounded-xl p-2"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                    ? 'left'
                                    : 'bottom'
                        }
                        sideOffset={8}
                    >
                        {/* User header section */}
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-2 py-2.5 text-left">
                                <Avatar className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-border">
                                    <AvatarImage 
                                        src={user.avatar} 
                                        alt={user.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="rounded-full text-base font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 min-w-0">
                                    <span className="truncate font-semibold text-sm">
                                        {user.name}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                    {userRole && (
                                        <span className={cn(
                                            "text-[10px] mt-1 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider w-fit",
                                            roleBadgeColor
                                        )}>
                                            {userRole}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuLabel>

                        {/* Logout section */}
                        <DropdownMenuItem 
                            asChild
                            className="rounded-lg cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                        >
                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                onClick={handleLogout}
                                data-test="logout-button"
                                className="flex items-center gap-3 px-3 py-2.5 w-full"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-destructive/10">
                                    <LogOut className="h-4 w-4 text-destructive" />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-sm font-medium text-destructive">Log out</span>
                                    <span className="text-xs text-muted-foreground">End your session</span>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

export default ProfileNav;
