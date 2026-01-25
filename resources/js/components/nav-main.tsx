import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="sr-only">Main Navigation</SidebarGroupLabel>
            <SidebarMenu role="navigation" aria-label="Main navigation">
                {items.map((item) => {
                    const isActive = page.url.startsWith(resolveUrl(item.href));
                    const itemId = `nav-${(item.title || '').toLowerCase().replace(/\s+/g, '-')}`;

                    return (
                        <SidebarMenuItem key={item.title} className="relative">
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                data-testid={itemId}
                                className="group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!px-2 group-data-[collapsible=icon]:!py-2.5"
                            >
                                <Link
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    aria-describedby={`${itemId}-description`}
                                    prefetch={true}
                                    className="flex items-center gap-2 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12"
                                >
                                    {item.icon && (
                                        <item.icon
                                            aria-hidden="true"
                                            className="size-4 shrink-0 transition-colors group-data-[collapsible=icon]:size-5"
                                        />
                                    )}
                                    <span className="truncate group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:absolute">{item.title}</span>
                                    <span
                                        id={`${itemId}-description`}
                                        className="sr-only"
                                    >
                                        Navigate to {item.title} page
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
