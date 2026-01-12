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
import { FlaskConical, Calendar, User, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
}

interface LabTest {
    id: number;
    test_id: string;
    name: string;
}

interface LabTestResult {
    id: number;
    result_id: string;
    patient_id: number;
    lab_test_id: number;
    result: string;
    status: string;
    date_performed: string;
    date_reported: string;
    notes: string;
    patient: Patient;
    labTest: LabTest;
}

interface LabTestResultIndexProps {
    labTestResults: {
        data: LabTestResult[];
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

export default function LabTestResultIndex({ labTestResults }: LabTestResultIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLabTestResults = labTestResults.data.filter(result =>
        result.result_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.labTest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'review':
                return 'outline';
            case 'abnormal':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Lab Test Results" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Laboratory Test Results Management" />
                    
                    <Link href="/laboratory/lab-test-results/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Result
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Test Results List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search lab test results..."
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
                                        <TableHead className="w-[100px]">Result ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Test</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Performed Date</TableHead>
                                        <TableHead>Reported Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLabTestResults.length > 0 ? (
                                        filteredLabTestResults.map((result) => (
                                            <TableRow key={result.id}>
                                                <TableCell className="font-medium">
                                                    {result.result_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {result.patient.first_name} {result.patient.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <FlaskConical className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {result.labTest.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(result.status)}>
                                                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(result.date_performed)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(result.date_reported)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/laboratory/lab-test-results/${result.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/laboratory/lab-test-results/${result.id}`}>
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
                                                No lab test results found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {labTestResults.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{labTestResults.meta?.from || 0}</strong> to <strong>{labTestResults.meta?.to || 0}</strong> of{' '}
                                <strong>{labTestResults.meta?.total || 0}</strong> lab test results
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(labTestResults.meta?.current_page) || labTestResults.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/laboratory/lab-test-results?page=${(labTestResults.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(labTestResults.meta?.current_page) || labTestResults.meta?.current_page >= (labTestResults.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/laboratory/lab-test-results?page=${(labTestResults.meta?.current_page || 1) + 1}`}
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