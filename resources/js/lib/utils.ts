import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: InertiaLinkProps['href'],
    url2: InertiaLinkProps['href'],
): boolean {
    if (!url1 || !url2) return false;
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: InertiaLinkProps['href']): string {
    if (!url) return '';
    return typeof url === 'string' ? url : url.url;
}
