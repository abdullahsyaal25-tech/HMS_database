import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown } from 'lucide-react';

export function NavUser() {
    const page = usePage();
    console.log('NavUser: page.props =', page.props);
    const { auth } = page.props;
    console.log('NavUser: auth =', auth);
    const { state } = useSidebar();
    console.log('NavUser: sidebar state =', state);
    const isMobile = useIsMobile();
    console.log('NavUser: isMobile =', isMobile);
    
    // Safely access user with fallback for undefined auth state
    const user = auth?.user;

    // Show loading state while auth is being determined
    if (!user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-4 py-2">
                        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    console.log('NavUser: user =', user);
    console.log('NavUser: rendering user menu');

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent"
                            data-test="sidebar-menu-button"
                        >
                            <UserInfo user={user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <UserMenuContent user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
