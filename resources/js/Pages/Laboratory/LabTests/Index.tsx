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
import { FlaskConical, DollarSign, Calendar, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface LabTest {
    id: number;
    test_id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    duration: string;
    created_at: string;
}

interface LabTestIndexProps {
    labTests: {
        data: LabTest[];
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

export default function LabTestIndex({ labTests }: LabTestIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLabTests = labTests.data.filter(test =>
        test.test_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
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

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Laboratory Tests" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Laboratory Tests Management" />
                    
                    <Link href="/laboratory/lab-tests/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Test
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Tests List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search lab tests..."
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
                                        <TableHead className="w-[100px]">Test ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLabTests.length > 0 ? (
                                        filteredLabTests.map((test) => (
                                            <TableRow key={test.id}>
                                                <TableCell className="font-medium">
                                                    {test.test_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <FlaskConical className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {test.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {test.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatCurrency(test.price)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-muted-foreground">
                                                        {test.duration}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(test.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/laboratory/lab-tests/${test.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/laboratory/lab-tests/${test.id}`}>
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
                                                No lab tests found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {labTests.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{labTests.meta?.from || 0}</strong> to <strong>{labTests.meta?.to || 0}</strong> of{' '}
                                <strong>{labTests.meta?.total || 0}</strong> lab tests
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(labTests.meta?.current_page) || labTests.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/laboratory/lab-tests?page=${(labTests.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(labTests.meta?.current_page) || labTests.meta?.current_page >= (labTests.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/laboratory/lab-tests?page=${(labTests.meta?.current_page || 1) + 1}`}
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