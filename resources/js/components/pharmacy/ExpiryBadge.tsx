import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    CalendarCheck,
    AlertTriangle,
    CalendarX,
    type LucideIcon,
} from 'lucide-react';

export type ExpiryStatus = 'valid' | 'expiring-soon' | 'expired';

export interface ExpiryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: ExpiryStatus;
    expiryDate?: string;
    daysUntilExpiry?: number;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
    ExpiryStatus,
    {
        label: string;
        icon: LucideIcon;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        className: string;
    }
> = {
    'valid': {
        label: 'Valid',
        icon: CalendarCheck,
        variant: 'default',
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
    },
    'expiring-soon': {
        label: 'Expiring Soon',
        icon: AlertTriangle,
        variant: 'secondary',
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
    },
    'expired': {
        label: 'Expired',
        icon: CalendarX,
        variant: 'destructive',
        className: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
    },
};

const sizeConfig = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
};

const iconSizeConfig = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5',
};

const ExpiryBadge = React.forwardRef<HTMLSpanElement, ExpiryBadgeProps>(
    ({ status, expiryDate, daysUntilExpiry, showIcon = true, size = 'md', className, ...props }, ref) => {
        const config = statusConfig[status];
        const Icon = config.icon;

        const getTooltipText = () => {
            if (expiryDate) {
                const date = new Date(expiryDate);
                const formatted = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
                if (daysUntilExpiry !== undefined) {
                    if (daysUntilExpiry < 0) {
                        return `Expired on ${formatted} (${Math.abs(daysUntilExpiry)} days ago)`;
                    } else if (daysUntilExpiry === 0) {
                        return `Expires today (${formatted})`;
                    } else {
                        return `Expires on ${formatted} (${daysUntilExpiry} days left)`;
                    }
                }
                return `Expires on ${formatted}`;
            }
            return undefined;
        };

        const tooltipText = getTooltipText();

        return (
            <Badge
                ref={ref}
                variant={config.variant}
                className={cn(
                    'inline-flex items-center whitespace-nowrap transition-colors',
                    sizeConfig[size],
                    config.className,
                    className
                )}
                title={tooltipText}
                {...props}
            >
                {showIcon && <Icon className={iconSizeConfig[size]} />}
                <span>{config.label}</span>
                {daysUntilExpiry !== undefined && status === 'expiring-soon' && (
                    <span className="ml-1 opacity-75">({daysUntilExpiry}d)</span>
                )}
            </Badge>
        );
    }
);

ExpiryBadge.displayName = 'ExpiryBadge';

export { ExpiryBadge };
