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
import { useState } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [focusedItem, setFocusedItem] = useState<string | null>(null);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="sr-only">Main Navigation</SidebarGroupLabel>
            <SidebarMenu role="navigation" aria-label="Main navigation">
                {items.map((item) => {
                    const isActive = page.url.startsWith(resolveUrl(item.href));
                    const itemId = `nav-${(item.title || '').toLowerCase().replace(/\s+/g, '-')}`;

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                data-testid={itemId}
                            >
                                <Link
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    aria-describedby={`${itemId}-description`}
                                    onFocus={() => setFocusedItem(item.title || null)}
                                    onBlur={() => setFocusedItem(null)}
                                    prefetch={true}
                                >
                                    {item.icon && (
                                        <item.icon
                                            aria-hidden="true"
                                            className={focusedItem === item.title ? 'text-blue-600' : ''}
                                        />
                                    )}
                                    <span>{item.title}</span>
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
