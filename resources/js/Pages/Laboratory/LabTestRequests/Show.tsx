import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Heading from '@/components/heading';
import { ArrowLeft, Edit, RotateCcw, ClipboardList, User, Stethoscope, Calendar, CheckCircle, Clock } from 'lucide-react';

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

interface LabTestResult {
    id: number;
    result_id: string;
    results: string;
    status: string;
    performed_at: string;
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
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    patient: Patient;
    doctor: Doctor;
    createdBy: User;
    results: LabTestResult[];
}

interface LabTestRequestShowProps {
    labTestRequest: LabTestRequest;
}

export default function LabTestRequestShow({ labTestRequest }: LabTestRequestShowProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
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

    const canEdit = labTestRequest.status !== 'completed' && labTestRequest.status !== 'cancelled';
    const canRestore = labTestRequest.status === 'cancelled';

    return (
        <>
            <Head title={`Lab Test Request - ${labTestRequest.request_id}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Heading title={`Request: ${labTestRequest.request_id}`} />
                        <Badge variant={getStatusBadgeVariant(labTestRequest.status)}>
                            {labTestRequest.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getTestTypeBadgeVariant(labTestRequest.test_type)}>
                            {labTestRequest.test_type}
                        </Badge>
                    </div>

                    <div className="flex gap-2">
                        {canEdit && (
                            <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Request
                                </Button>
                            </Link>
                        )}
                        {canRestore && (
                            <Link
                                href={`/laboratory/lab-test-requests/${labTestRequest.id}/restore`}
                                method="post"
                                as="button"
                            >
                                <Button variant="outline" className="bg-green-50 hover:bg-green-100">
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore Request
                                </Button>
                            </Link>
                        )}
                        <Link href="/laboratory/lab-test-requests">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Requests
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Request Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Request ID</Label>
                                    <Input
                                        value={labTestRequest.request_id}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Test Name</Label>
                                    <Input
                                        value={labTestRequest.test_name}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Test Type</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getTestTypeBadgeVariant(labTestRequest.test_type)}>
                                            {labTestRequest.test_type}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={getStatusBadgeVariant(labTestRequest.status)}>
                                            {labTestRequest.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Scheduled Date
                                    </Label>
                                    <Input
                                        value={formatDate(labTestRequest.scheduled_at)}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Completed Date
                                    </Label>
                                    <Input
                                        value={formatDate(labTestRequest.completed_at)}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Notes</Label>
                                    <textarea
                                        value={labTestRequest.notes || 'No notes available'}
                                        readOnly
                                        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Patient & Doctor Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Patient
                                    </Label>
                                    <Input
                                        value={`${labTestRequest.patient.first_name} ${labTestRequest.patient.father_name} (PID: ${labTestRequest.patient.patient_id})`}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4" />
                                        Requesting Doctor
                                    </Label>
                                    <Input
                                        value={`${labTestRequest.doctor.full_name} (DID: ${labTestRequest.doctor.doctor_id})`}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Created By
                                    </Label>
                                    <Input
                                        value={labTestRequest.createdBy.name}
                                        readOnly
                                        className="bg-muted/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Created At</Label>
                                        <Input
                                            value={formatDate(labTestRequest.created_at)}
                                            readOnly
                                            className="bg-muted/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Last Updated</Label>
                                        <Input
                                            value={formatDate(labTestRequest.updated_at)}
                                            readOnly
                                            className="bg-muted/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                {labTestRequest.results && labTestRequest.results.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Lab Test Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {labTestRequest.results.map((result) => (
                                    <div
                                        key={result.id}
                                        className="p-4 border rounded-lg bg-muted/30"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium">Result ID: {result.result_id}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Performed: {formatDate(result.performed_at)}
                                                </p>
                                            </div>
                                            <Badge variant={result.status === 'completed' ? 'outline' : 'secondary'}>
                                                {result.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm mt-2">{result.results}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
