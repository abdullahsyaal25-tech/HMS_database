import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tag, Search, X, ChevronDown } from 'lucide-react';
import type { MedicineCategory } from '@/types/medicine';

export interface CategorySearchProps {
    categories: MedicineCategory[];
    value?: MedicineCategory | null;
    onSelect: (category: MedicineCategory) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export interface CategorySearchRef {
    focus: () => void;
}

const CategorySearch = React.forwardRef<CategorySearchRef, CategorySearchProps>(
    (
        { categories, value, onSelect, placeholder = 'Search categories...', disabled = false, className },
        ref
    ) => {
        const [open, setOpen] = React.useState(false);
        const [query, setQuery] = React.useState('');
        const inputRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

        const filtered = React.useMemo(() => {
            if (!query.trim()) return categories;
            const q = query.toLowerCase();
            return categories.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
        }, [categories, query]);

        const handleSelect = (c: MedicineCategory) => {
            onSelect(c);
            setQuery('');
            setOpen(false);
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            setQuery('');
            inputRef.current?.focus();
        };

        return (
            <div className={cn('relative w-full', className)}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder={placeholder}
                                value={value ? value.name : query}
                                onChange={(e) => setQuery(e.target.value)}
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
                                    onClick={(e) => handleClear(e)}
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
                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                    placeholder="Type to search categories..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <div className="max-h-[240px] overflow-y-auto">
                                {filtered.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">No categories found.</div>
                                ) : (
                                    <div className="p-1">
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                            {filtered.length} categories
                                        </div>
                                        {filtered.map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelect(c)}
                                                className="flex items-center justify-between py-3 px-2 cursor-pointer rounded-sm hover:bg-accent hover:text-accent-foreground"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center size-8 rounded-md bg-muted">
                                                        <Tag className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium truncate">{c.name}</span>
                                                        {c.description && <span className="text-xs text-muted-foreground">{c.description}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {value && (
                    <div className="mt-2 p-3 rounded-md bg-muted/50 border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tag className="size-4 text-muted-foreground" />
                                <span className="font-medium">{value.name}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

CategorySearch.displayName = 'CategorySearch';

export { CategorySearch };
