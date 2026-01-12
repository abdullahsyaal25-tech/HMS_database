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
import { Pill, DollarSign, Calendar, Package, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface MedicineCategory {
    id: number;
    name: string;
}

interface Medicine {
    id: number;
    medicine_id: string;
    name: string;
    category_id: number;
    category: MedicineCategory;
    manufacturer: string;
    batch_number: string;
    expiry_date: string;
    price: number;
    stock_quantity: number;
    created_at: string;
}

interface MedicineIndexProps {
    medicines: {
        data: Medicine[];
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

export default function MedicineIndex({ medicines }: MedicineIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMedicines = medicines.data.filter(medicine =>
        medicine.medicine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
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

    const getStockStatus = (quantity: number) => {
        if (quantity <= 0) return { text: 'Out of Stock', variant: 'destructive' as const };
        if (quantity <= 10) return { text: 'Low Stock', variant: 'secondary' as const };
        return { text: 'In Stock', variant: 'default' as const };
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Medicines" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Medicine Management" />
                    
                    <Link href="/pharmacy/medicines/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Medicine
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Medicines List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search medicines..."
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
                                        <TableHead className="w-[100px]">Medicine ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Manufacturer</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMedicines.length > 0 ? (
                                        filteredMedicines.map((medicine) => {
                                            const stockStatus = getStockStatus(medicine.stock_quantity);
                                            return (
                                                <TableRow key={medicine.id}>
                                                    <TableCell className="font-medium">
                                                        {medicine.medicine_id}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Pill className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {medicine.name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {medicine.category.name}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {medicine.manufacturer}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {formatCurrency(medicine.price)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <Badge variant={stockStatus.variant}>
                                                                {medicine.stock_quantity} - {stockStatus.text}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {formatDate(medicine.expiry_date)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end space-x-2">
                                                            <Link href={`/pharmacy/medicines/${medicine.id}/edit`}>
                                                                <Button variant="outline" size="sm">
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/pharmacy/medicines/${medicine.id}`}>
                                                                <Button variant="outline" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No medicines found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {medicines.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{medicines.meta?.from || 0}</strong> to <strong>{medicines.meta?.to || 0}</strong> of{' '}
                                <strong>{medicines.meta?.total || 0}</strong> medicines
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(medicines.meta?.current_page) || medicines.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/pharmacy/medicines?page=${(medicines.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(medicines.meta?.current_page) || medicines.meta?.current_page >= (medicines.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/pharmacy/medicines?page=${(medicines.meta?.current_page || 1) + 1}`}
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