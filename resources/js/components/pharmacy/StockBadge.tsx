import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    Package,
    AlertTriangle,
    AlertCircle,
    XCircle,
    type LucideIcon,
} from 'lucide-react';

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'critical';

export interface StockBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status: StockStatus;
    quantity?: number;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
    StockStatus,
    {
        label: string;
        icon: LucideIcon;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        className: string;
    }
> = {
    'in-stock': {
        label: 'In Stock',
        icon: Package,
        variant: 'default',
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
    },
    'low-stock': {
        label: 'Low Stock',
        icon: AlertTriangle,
        variant: 'secondary',
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
    },
    'out-of-stock': {
        label: 'Out of Stock',
        icon: XCircle,
        variant: 'destructive',
        className: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
    },
    'critical': {
        label: 'Critical',
        icon: AlertCircle,
        variant: 'destructive',
        className: 'bg-red-600/10 text-red-700 border-red-600/30 hover:bg-red-600/20 font-semibold',
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

const StockBadge = React.forwardRef<HTMLSpanElement, StockBadgeProps>(
    ({ status, quantity, showIcon = true, size = 'md', className, ...props }, ref) => {
        const config = statusConfig[status];
        const Icon = config.icon;

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
                {...props}
            >
                {showIcon && <Icon className={iconSizeConfig[size]} />}
                <span>{config.label}</span>
                {quantity !== undefined && (
                    <span className="ml-1 opacity-75">({quantity})</span>
                )}
            </Badge>
        );
    }
);

StockBadge.displayName = 'StockBadge';

export { StockBadge };
