import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StockBadge } from './StockBadge';
import { ExpiryBadge } from './ExpiryBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Medicine } from '@/types/pharmacy';
import {
    Pill,
    Package,
    Beaker,
    Clock,
    MoreHorizontal,
    Eye,
    Edit,
    Copy,
    Ban,
    ShoppingCart,
    type LucideIcon,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type MedicineCardAction = {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
};

export interface MedicineCardProps extends React.HTMLAttributes<HTMLDivElement> {
    medicine: Medicine;
    actions?: MedicineCardAction[];
    compact?: boolean;
    showStock?: boolean;
    showExpiry?: boolean;
    showPrice?: boolean;
    onView?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onDeactivate?: () => void;
    onAddToCart?: () => void;
}

const dosageFormIcons: Record<string, LucideIcon> = {
    tablet: Pill,
    capsule: Pill,
    syrup: Beaker,
    injection: Beaker,
    cream: Package,
    ointment: Package,
    drops: Beaker,
    inhaler: Package,
    powder: Package,
    default: Pill,
};

const MedicineCard = React.forwardRef<HTMLDivElement, MedicineCardProps>(
    (
        {
            className,
            medicine,
            actions,
            compact = false,
            showStock = true,
            showExpiry = true,
            showPrice = true,
            onView,
            onEdit,
            onDuplicate,
            onDeactivate,
            onAddToCart,
            ...props
        },
        ref
    ) => {
        // Determine stock status
        const getStockStatus = (): import('./StockBadge').StockStatus => {
            if (medicine.stock_quantity <= 0) return 'out-of-stock';
            if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
            if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
            return 'in-stock';
        };

        // Determine expiry status
        const getExpiryStatus = (): import('./ExpiryBadge').ExpiryStatus => {
            if (!medicine.expiry_date) return 'valid';
            const expiry = new Date(medicine.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) return 'expired';
            if (daysUntilExpiry <= 30) return 'expiring-soon';
            return 'valid';
        };

        // Calculate days until expiry
        const getDaysUntilExpiry = (): number | undefined => {
            if (!medicine.expiry_date) return undefined;
            const expiry = new Date(medicine.expiry_date);
            const today = new Date();
            return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        };

        const stockStatus = getStockStatus();
        const expiryStatus = getExpiryStatus();
        const daysUntilExpiry = getDaysUntilExpiry();

        // Get icon based on dosage form
        const DosageIcon = dosageFormIcons[medicine.dosage_form?.toLowerCase() || 'default'] || dosageFormIcons.default;

        // Get category color
        const getCategoryColor = () => {
            const colors = [
                'text-blue-600 bg-blue-500/10 border-blue-500/30',
                'text-purple-600 bg-purple-500/10 border-purple-500/30',
                'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
                'text-orange-600 bg-orange-500/10 border-orange-500/30',
                'text-pink-600 bg-pink-500/10 border-pink-500/30',
            ];
            // Use category_id to deterministically pick a color
            const index = (medicine.category_id || 0) % colors.length;
            return colors[index];
        };

        // Default actions
        const getDefaultActions = (): MedicineCardAction[] => {
            const defaultActions: MedicineCardAction[] = [
                { label: 'View', icon: Eye, onClick: onView || (() => {}) },
                { label: 'Edit', icon: Edit, onClick: onEdit || (() => {}) },
                { label: 'Duplicate', icon: Copy, onClick: onDuplicate || (() => {}) },
            ];

            if (onAddToCart && medicine.stock_quantity > 0) {
                defaultActions.unshift({
                    label: 'Add to Cart',
                    icon: ShoppingCart,
                    onClick: onAddToCart,
                });
            }

            defaultActions.push({
                label: 'Deactivate',
                icon: Ban,
                onClick: onDeactivate || (() => {}),
                variant: 'destructive',
            });

            return defaultActions;
        };

        const displayActions = actions || getDefaultActions();

        return (
            <Card
                ref={ref}
                className={cn(
                    'transition-all duration-200 hover:shadow-medium',
                    compact ? 'p-4' : 'p-6',
                    className
                )}
                {...props}
            >
                <CardHeader className={cn('flex flex-row items-start justify-between p-0', compact ? 'pb-3' : 'pb-4')}>
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                'flex items-center justify-center rounded-lg border',
                                getCategoryColor(),
                                compact ? 'size-10' : 'size-12'
                            )}
                        >
                            <DosageIcon className={compact ? 'size-5' : 'size-6'} />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <h3 className={cn('font-semibold leading-tight truncate', compact ? 'text-base' : 'text-lg')}>
                                {medicine.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                                {medicine.category && (
                                    <Badge variant="outline" className={cn('text-xs', getCategoryColor())}>
                                        {medicine.category.name}
                                    </Badge>
                                )}
                                {medicine.medicine_id && (
                                    <span className="text-xs">• {medicine.medicine_id}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        {showStock && <StockBadge status={stockStatus} size="sm" />}
                        {showExpiry && medicine.expiry_date && (
                            <ExpiryBadge
                                status={expiryStatus}
                                expiryDate={medicine.expiry_date}
                                daysUntilExpiry={daysUntilExpiry}
                                size="sm"
                            />
                        )}
                    </div>
                </CardHeader>

                <CardContent className={cn('p-0', compact ? 'pb-3' : 'pb-4')}>
                    {/* Medicine Details */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            {medicine.strength && (
                                <div className="flex items-center gap-1">
                                    <Beaker className="size-4" />
                                    <span>{medicine.strength}</span>
                                </div>
                            )}
                            {medicine.dosage_form && (
                                <div className="flex items-center gap-1">
                                    <Pill className="size-4" />
                                    <span className="capitalize">{medicine.dosage_form}</span>
                                </div>
                            )}
                            {medicine.manufacturer && (
                                <div className="flex items-center gap-1">
                                    <Package className="size-4" />
                                    <span className="truncate max-w-[150px]">{medicine.manufacturer}</span>
                                </div>
                            )}
                        </div>

                        {/* Stock & Price Row */}
                        <div className="flex items-center justify-between pt-2">
                            {showStock && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Package className="size-4 text-muted-foreground" />
                                    <span className={cn(
                                        'font-medium',
                                        stockStatus === 'out-of-stock' && 'text-destructive',
                                        stockStatus === 'low-stock' && 'text-amber-600',
                                        stockStatus === 'critical' && 'text-red-600',
                                    )}>
                                        {medicine.stock_quantity} in stock
                                    </span>
                                    {medicine.reorder_level > 0 && (
                                        <span className="text-muted-foreground text-xs">
                                            (Reorder: {medicine.reorder_level})
                                        </span>
                                    )}
                                </div>
                            )}
                            {showPrice && (
                                <PriceDisplay
                                    amount={medicine.sale_price}
                                    size={compact ? 'sm' : 'md'}
                                    variant="total"
                                />
                            )}
                        </div>

                        {/* Description */}
                        {!compact && medicine.description && (
                            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                                {medicine.description}
                            </p>
                        )}

                        {/* Expiry Date */}
                        {showExpiry && medicine.expiry_date && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="size-4" />
                                <span>
                                    Expires: {new Date(medicine.expiry_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className={cn('flex items-center justify-between p-0 pt-0', compact ? 'pt-3' : 'pt-4')}>
                    <div className="flex items-center gap-2">
                        {displayActions.slice(0, compact ? 2 : 3).map((action, index) => (
                            <Button
                                key={index}
                                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={action.onClick}
                                disabled={action.disabled}
                                className="gap-1.5"
                            >
                                <action.icon className="size-4" />
                                {!compact && action.label}
                            </Button>
                        ))}
                    </div>

                    {displayActions.length > (compact ? 2 : 3) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="size-8 p-0">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {displayActions.slice(compact ? 2 : 3).map((action, index) => (
                                    <DropdownMenuItem
                                        key={index}
                                        onClick={action.onClick}
                                        disabled={action.disabled}
                                        className={cn(
                                            'gap-2',
                                            action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                        )}
                                    >
                                        <action.icon className="size-4" />
                                        {action.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardFooter>
            </Card>
        );
    }
);

MedicineCard.displayName = 'MedicineCard';

export { MedicineCard };
