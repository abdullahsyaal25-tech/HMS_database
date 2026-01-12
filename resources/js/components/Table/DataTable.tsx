import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ColumnConfig<T> {
    accessorKey: string;
    header: string;
    cell?: (row: T) => React.ReactNode;
    size?: string;
}

interface DataTableProps<T> {
    title: string;
    columns: ColumnConfig<T>[];
    data: T[];
    searchPlaceholder?: string;
    enableSearch?: boolean;
    enablePagination?: boolean;
    itemsPerPage?: number;
    actionButtons?: React.ReactNode;
    onAddNew?: () => void;
    addNewLabel?: string;
}

export default function DataTable<T>({
    title,
    columns,
    data,
    searchPlaceholder = 'Search...',
    enableSearch = true,
    enablePagination = true,
    itemsPerPage = 10,
    actionButtons,
    onAddNew,
    addNewLabel = 'Add New'
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data based on search term
    const filteredData = enableSearch
        ? data.filter((row: T) => {
            // Safely check if row is an object before getting values
            if (typeof row === 'object' && row !== null) {
                return Object.values(row as Record<string, unknown>).some(
                    (value) =>
                        value &&
                        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            return false;
        })
        : data;

    // Calculate pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = enablePagination
        ? filteredData.slice(startIndex, startIndex + itemsPerPage)
        : filteredData;

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{title}</CardTitle>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {enableSearch && (
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={searchPlaceholder}
                                className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page when searching
                                }}
                            />
                        </div>
                    )}
                    
                    <div className="flex gap-2">
                        {actionButtons}
                        {onAddNew && (
                            <Button onClick={onAddNew}>
                                {addNewLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableHead 
                                        key={column.accessorKey} 
                                        className={column.size || ''}
                                    >
                                        {column.header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((row: T, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {columns.map((column) => {
                                            const cellValue = column.cell ? column.cell(row) : (row as Record<string, unknown>)[column.accessorKey];
                                            return <TableCell key={`${rowIndex}-${column.accessorKey}`}>
                                                {cellValue ? String(cellValue) : ''}
                                            </TableCell>;
                                        })}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell 
                                        colSpan={columns.length} 
                                        className="h-24 text-center"
                                    >
                                        No data found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {enablePagination && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                        <div className="text-sm text-muted-foreground">
                            Showing <strong>{startIndex + 1}</strong> to <strong>
                                {Math.min(startIndex + itemsPerPage, filteredData.length)}
                            </strong> of <strong>{filteredData.length}</strong> entries
                        </div>
                        
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={handlePreviousPage}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages}
                                onClick={handleNextPage}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}