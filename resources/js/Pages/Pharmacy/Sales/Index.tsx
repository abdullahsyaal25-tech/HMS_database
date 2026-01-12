import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { DollarSign, Calendar, User, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
}

interface Sale {
    id: number;
    sale_id: string;
    patient_id: number;
    total_amount: number;
    discount: number;
    tax: number;
    net_amount: number;
    status: string;
    created_at: string;
    patient: Patient;
}

interface SaleIndexProps {
    sales: {
        data: Sale[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
}

export default function SaleIndex({ sales }: SaleIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSales = sales.data.filter(sale =>
        sale.sale_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Pharmacy Sales" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Pharmacy Sales Management" />
                    
                    <Link href="/pharmacy/sales/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Sale
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sales List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search sales..."
                                    className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Sale ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Net Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.length > 0 ? (
                                        filteredSales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium">
                                                    {sale.sale_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {sale.patient.first_name} {sale.patient.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatCurrency(sale.total_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">
                                                        {formatCurrency(sale.net_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(sale.status)}>
                                                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(sale.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/pharmacy/sales/${sale.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No sales found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {sales.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{sales.meta?.from || 0}</strong> to <strong>{sales.meta?.to || 0}</strong> of{' '}
                                <strong>{sales.meta?.total || 0}</strong> sales
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(sales.meta?.current_page) || sales.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/pharmacy/sales?page=${(sales.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(sales.meta?.current_page) || sales.meta?.current_page >= (sales.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/pharmacy/sales?page=${(sales.meta?.current_page || 1) + 1}`}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}