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

interface Bill {
    id: number;
    bill_id: string;
    patient_id: number;
    total_amount: number;
    discount: number;
    tax: number;
    net_amount: number;
    status: string;
    due_date: string;
    created_at: string;
    patient: Patient;
}

interface BillIndexProps {
    bills: {
        data: Bill[];
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

export default function BillIndex({ bills }: BillIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBills = bills.data.filter(bill =>
        bill.bill_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.status.toLowerCase().includes(searchTerm.toLowerCase())
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
            case 'paid':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'overdue':
                return 'destructive';
            case 'cancelled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Billing" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Billing Management" />
                    
                    <Link href="/billing/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Bill
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bills List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search bills..."
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
                                        <TableHead className="w-[100px]">Bill ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Net Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBills.length > 0 ? (
                                        filteredBills.map((bill) => (
                                            <TableRow key={bill.id}>
                                                <TableCell className="font-medium">
                                                    {bill.bill_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {bill.patient.first_name} {bill.patient.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatCurrency(bill.total_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">
                                                        {formatCurrency(bill.net_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(bill.status)}>
                                                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(bill.due_date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/billing/${bill.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/billing/${bill.id}`}>
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
                                                No bills found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {bills.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{bills.meta?.from || 0}</strong> to <strong>{bills.meta?.to || 0}</strong> of{' '}
                                <strong>{bills.meta?.total || 0}</strong> bills
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(bills.meta?.current_page) || bills.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/billing?page=${(bills.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(bills.meta?.current_page) || bills.meta?.current_page >= (bills.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/billing?page=${(bills.meta?.current_page || 1) + 1}`}
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