import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { StockBadge } from './StockBadge';
import { PriceDisplay } from './PriceDisplay';
import type { Medicine } from '@/types/pharmacy';
import {
    Search,
    Pill,
    Package,
    Beaker,
    X,
    ChevronDown,
    Loader2,
    type LucideIcon,
} from 'lucide-react';

export interface MedicineSearchProps {
    medicines: Medicine[];
    value?: Medicine | null;
    onSelect: (medicine: Medicine) => void;
    onSearch?: (query: string) => void;
    placeholder?: string;
    disabled?: boolean;
    loading?: boolean;
    showStock?: boolean;
    showPrice?: boolean;
    filterByStock?: boolean;
    emptyMessage?: string;
    className?: string;
}

export interface MedicineSearchRef {
    focus: () => void;
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

const MedicineSearch = React.forwardRef<MedicineSearchRef, MedicineSearchProps>(
    (
        {
            className,
            medicines,
            value,
            onSelect,
            onSearch,
            placeholder = 'Search medicines...',
            disabled = false,
            loading = false,
            showStock = true,
            showPrice = true,
            filterByStock = true,
            emptyMessage = 'No medicines found.',
            ...props
        },
        ref
    ) => {
        const [open, setOpen] = React.useState(false);
        const [searchQuery, setSearchQuery] = React.useState('');
        const [selectedIndex, setSelectedIndex] = React.useState(-1);
        const inputRef = React.useRef<HTMLInputElement>(null);
        const containerRef = React.useRef<HTMLDivElement>(null);

        // Expose focus method to parent components
        React.useImperativeHandle(ref, () => ({
            focus: () => {
                inputRef.current?.focus();
            },
        }));

        // Filter medicines based on search query and stock availability
        const filteredMedicines = React.useMemo(() => {
            let filtered = medicines;

            if (filterByStock) {
                filtered = filtered.filter((m) => m.stock_quantity > 0);
            }

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(
                    (m) =>
                        m.name.toLowerCase().includes(query) ||
                        m.medicine_id.toLowerCase().includes(query) ||
                        m.manufacturer?.toLowerCase().includes(query) ||
                        m.category?.name.toLowerCase().includes(query)
                );
            }

            return filtered;
        }, [medicines, searchQuery, filterByStock]);

        // Handle input change
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const query = e.target.value;
            setSearchQuery(query);
            onSearch?.(query);
            if (!open && query.length > 0) {
                setOpen(true);
            }
        };

        // Handle medicine selection
        const handleSelect = (medicine: Medicine) => {
            onSelect(medicine);
            setSearchQuery('');
            setOpen(false);
        };

        // Clear selection
        const handleClear = () => {
            setSearchQuery('');
            inputRef.current?.focus();
        };

        // Handle keyboard navigation
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (!open || filteredMedicines.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < filteredMedicines.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredMedicines.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < filteredMedicines.length) {
                        handleSelect(filteredMedicines[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    setOpen(false);
                    inputRef.current?.focus();
                    break;
            }
        };

        // Reset selected index when search query changes
        React.useEffect(() => {
            setSelectedIndex(-1);
        }, [searchQuery]);

        // Get icon for dosage form
        const getDosageIcon = (dosageForm?: string | null) => {
            return dosageFormIcons[dosageForm?.toLowerCase() || 'default'] || dosageFormIcons.default;
        };

        // Get stock status
        const getStockStatus = (medicine: Medicine) => {
            if (medicine.stock_quantity <= 0) return 'out-of-stock';
            if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
            if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
            return 'in-stock';
        };

        return (
            <div ref={containerRef} className={cn('relative w-full', className)} {...props}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder={placeholder}
                                value={value ? value.name : searchQuery}
                                onChange={handleInputChange}
                                disabled={disabled}
                                className="pl-9 pr-10 w-full"
                                onClick={() => !disabled && setOpen(true)}
                                readOnly={!!value}
                            />
                            {value ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClear();
                                    }}
                                >
                                    <X className="size-4" />
                                </Button>
                            ) : (
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <div className="w-full">
                            <div className="flex items-center border-b px-3 py-2">
                                <Search className="mr-2 size-4 shrink-0 opacity-50" />
                                <input
                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Type to search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredMedicines.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        {emptyMessage}
                                    </div>
                                ) : (
                                    <div className="p-1">
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                            {filteredMedicines.length} medicines found
                                        </div>
                                        {filteredMedicines.map((medicine, index) => {
                                            const Icon = getDosageIcon(medicine.dosage_form);
                                            const stockStatus = getStockStatus(medicine);

                                            return (
                                                <div
                                                    key={medicine.id}
                                                    onClick={() => handleSelect(medicine)}
                                                    className={cn(
                                                        "flex items-center justify-between py-3 px-2 cursor-pointer rounded-sm",
                                                        index === selectedIndex
                                                            ? "bg-accent text-accent-foreground"
                                                            : "hover:bg-accent hover:text-accent-foreground"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="flex items-center justify-center size-8 rounded-md bg-muted">
                                                            <Icon className="size-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium truncate">
                                                                {medicine.name}
                                                            </span>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                {medicine.category && (
                                                                    <span>{medicine.category.name}</span>
                                                                )}
                                                                {medicine.strength && (
                                                                    <span>• {medicine.strength}</span>
                                                                )}
                                                                <span>• {medicine.medicine_id}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {showStock && (
                                                            <StockBadge
                                                                status={stockStatus}
                                                                quantity={medicine.stock_quantity}
                                                                size="sm"
                                                            />
                                                        )}
                                                        {showPrice && (
                                                            <PriceDisplay
                                                                amount={medicine.unit_price}
                                                                size="sm"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Selected Medicine Preview */}
                {value && (
                    <div className="mt-2 p-3 rounded-md bg-muted/50 border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const Icon = getDosageIcon(value.dosage_form);
                                    return <Icon className="size-4 text-muted-foreground" />;
                                })()}
                                <span className="font-medium">{value.name}</span>
                                {value.strength && (
                                    <Badge variant="secondary" className="text-xs">
                                        {value.strength}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {showStock && (
                                    <StockBadge
                                        status={getStockStatus(value)}
                                        quantity={value.stock_quantity}
                                        size="sm"
                                    />
                                )}
                                {showPrice && (
                                    <PriceDisplay amount={value.unit_price} size="sm" />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

MedicineSearch.displayName = 'MedicineSearch';

export { MedicineSearch };
