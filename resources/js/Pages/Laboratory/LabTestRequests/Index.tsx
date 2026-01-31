import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { ArrowLeft, Plus, Search, Filter, ClipboardList, RotateCcw } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
}

interface User {
    id: number;
    name: string;
}

interface LabTestRequest {
    id: number;
    request_id: string;
    patient_id: number;
    doctor_id: number;
    test_name: string;
    test_type: 'routine' | 'urgent' | 'stat';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_at: string;
    completed_at: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    patient: Patient;
    doctor: Doctor;
    createdBy: User;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

interface LabTestRequestIndexProps {
    labTestRequests: {
        data: LabTestRequest[];
        links: Record<string, unknown>;
        meta: PaginationMeta;
    };
    filters: {
        status?: string;
        patient_id?: string;
        doctor_id?: string;
        test_type?: string;
        date_from?: string;
        date_to?: string;
        query?: string;
    };
}

export default function LabTestRequestIndex({ labTestRequests, filters }: LabTestRequestIndexProps) {
    const { data, setData, get, processing } = useForm({
        query: filters.query || '',
        status: filters.status || '',
        patient_id: filters.patient_id || '',
        doctor_id: filters.doctor_id || '',
        test_type: filters.test_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        get('/laboratory/lab-test-requests', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFilterChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
        get('/laboratory/lab-test-requests', {
            preserveState: true,
            preserveScroll: true,
            data: { ...data, [name]: value },
        });
    };

    const handleClearFilters = () => {
        setData({
            query: '',
            status: '',
            patient_id: '',
            doctor_id: '',
            test_type: '',
            date_from: '',
            date_to: '',
        });
        get('/laboratory/lab-test-requests', {
            preserveState: true,
            preserveScroll: true,
            data: {},
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'secondary';
            case 'in_progress':
                return 'default';
            case 'completed':
                return 'outline';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getTestTypeBadgeVariant = (testType: string) => {
        switch (testType) {
            case 'routine':
                return 'outline';
            case 'urgent':
                return 'secondary';
            case 'stat':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <>
            <Head title="Lab Test Requests" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Lab Test Requests" />

                    <div className="flex gap-2">
                        <Link href="/laboratory/lab-test-requests/create">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Request
                            </Button>
                        </Link>
                        <Link href="/laboratory">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Lab
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Search and Filter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="query">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="query"
                                            value={data.query}
                                            onChange={(e) => setData('query', e.target.value)}
                                            placeholder="Search by request ID, test name..."
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="test_type">Test Type</Label>
                                    <Select
                                        value={data.test_type}
                                        onValueChange={(value) => handleFilterChange('test_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="routine">Routine</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="stat">STAT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date_from">Date From</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={data.date_from}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="date_to">Date To</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={data.date_to}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <Button type="submit" variant="outline" disabled={processing}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Search
                                </Button>
                                <Button type="button" variant="outline" onClick={handleClearFilters}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Lab Test Requests List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Request ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Scheduled</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {labTestRequests.data.length > 0 ? (
                                        labTestRequests.data.map((request) => (
                                            <TableRow key={request.id}>
                                                <TableCell className="font-medium">
                                                    {request.request_id}
                                                </TableCell>
                                                <TableCell>
                                                    {request.patient.first_name} {request.patient.father_name}
                                                </TableCell>
                                                <TableCell>{request.doctor.full_name}</TableCell>
                                                <TableCell>{request.test_name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getTestTypeBadgeVariant(request.test_type)}>
                                                        {request.test_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(request.status)}>
                                                        {request.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(request.scheduled_at)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/laboratory/lab-test-requests/${request.id}`}>
                                                            <Button size="sm" variant="outline">
                                                                View
                                                            </Button>
                                                        </Link>
                                                        {request.status !== 'completed' && request.status !== 'cancelled' && (
                                                            <Link href={`/laboratory/lab-test-requests/${request.id}/edit`}>
                                                                <Button size="sm" variant="outline">
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No lab test requests found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {labTestRequests.meta && labTestRequests.meta.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing <strong>{labTestRequests.meta.from || 0}</strong> to{' '}
                                    <strong>{labTestRequests.meta.to || 0}</strong> of{' '}
                                    <strong>{labTestRequests.meta.total || 0}</strong> requests
                                </div>

                                <div className="flex space-x-2">
                                    {labTestRequests.meta.links.map((link, index) =>
                                        link.url ? (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() =>
                                                    (window.location.href = link.url as string)
                                                }
                                                disabled={processing}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Button>
                                        ) : (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                size="sm"
                                                disabled
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
