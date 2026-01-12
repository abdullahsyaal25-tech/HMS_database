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
import { DollarSign, Calendar, Package, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Supplier {
    id: number;
    supplier_id: string;
    name: string;
    contact_person: string;
    phone: string;
}

interface PurchaseOrder {
    id: number;
    po_id: string;
    supplier_id: number;
    total_amount: number;
    status: string;
    created_at: string;
    supplier: Supplier;
}

interface PurchaseOrderIndexProps {
    purchaseOrders: {
        data: PurchaseOrder[];
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

export default function PurchaseOrderIndex({ purchaseOrders }: PurchaseOrderIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPurchaseOrders = purchaseOrders.data.filter(po =>
        po.po_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.status.toLowerCase().includes(searchTerm.toLowerCase())
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
            case 'pending':
                return 'secondary';
            case 'approved':
                return 'default';
            case 'rejected':
                return 'destructive';
            case 'delivered':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Purchase Orders" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Purchase Order Management" />
                    
                    <Link href="/pharmacy/purchase-orders/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create New Order
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Purchase Orders List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
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
                                        <TableHead className="w-[100px]">PO ID</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Total Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPurchaseOrders.length > 0 ? (
                                        filteredPurchaseOrders.map((po) => (
                                            <TableRow key={po.id}>
                                                <TableCell className="font-medium">
                                                    {po.po_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {po.supplier.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatCurrency(po.total_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(po.status)}>
                                                        {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(po.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/pharmacy/purchase-orders/${po.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/pharmacy/purchase-orders/${po.id}`}>
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
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No purchase orders found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {purchaseOrders.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{purchaseOrders.meta?.from || 0}</strong> to <strong>{purchaseOrders.meta?.to || 0}</strong> of{' '}
                                <strong>{purchaseOrders.meta?.total || 0}</strong> purchase orders
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(purchaseOrders.meta?.current_page) || purchaseOrders.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/pharmacy/purchase-orders?page=${(purchaseOrders.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(purchaseOrders.meta?.current_page) || purchaseOrders.meta?.current_page >= (purchaseOrders.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/pharmacy/purchase-orders?page=${(purchaseOrders.meta?.current_page || 1) + 1}`}
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