import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Heading from '@/components/heading';
import { ArrowLeft, Edit } from 'lucide-react';

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
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
    created_at: string;
    updated_at: string;
    patient: Patient;
    labTest: LabTest;
}

interface LabTestResultShowProps {
    labTestResult: LabTestResult;
}

export default function LabTestResultShow({ labTestResult }: LabTestResultShowProps) {
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
            case 'verified':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <>
            <Head title={`Lab Test Result - ${labTestResult.result_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Lab Test Result Details: ${labTestResult.result_id}`} />
                    
                    <div className="flex gap-2">
                        <Link href={`/laboratory/lab-test-results/${labTestResult.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Result
                            </Button>
                        </Link>
                        <Link href="/laboratory/lab-test-results">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Results
                            </Button>
                        </Link>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Test Result Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="result_id">Result ID</Label>
                                <Input
                                    id="result_id"
                                    value={labTestResult.result_id}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="patient">Patient</Label>
                                <Input
                                    id="patient"
                                    value={`${labTestResult.patient.first_name} ${labTestResult.patient.last_name} (PID: ${labTestResult.patient.patient_id})`}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="lab_test">Lab Test</Label>
                                <Input
                                    id="lab_test"
                                    value={`${labTestResult.labTest.name} (Test ID: ${labTestResult.labTest.test_id})`}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Badge variant={getStatusBadgeVariant(labTestResult.status)}>
                                    {labTestResult.status.charAt(0).toUpperCase() + labTestResult.status.slice(1)}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="performed_at">Performed Date</Label>
                                <Input
                                    id="performed_at"
                                    value={formatDate(labTestResult.performed_at)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
<div className="space-y-2 md:col-span-2">
    <Label htmlFor="results">Results</Label>
    <textarea
        id="results"
        value={labTestResult.results}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={4}
    />
</div>

<div className="space-y-2 md:col-span-2">
    <Label htmlFor="abnormal_flags">Abnormal Flags</Label>
    <textarea
        id="abnormal_flags"
        value={labTestResult.abnormal_flags || 'N/A'}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={2}
    />
</div>

<div className="space-y-2 md:col-span-2">
    <Label htmlFor="notes">Notes</Label>
    <textarea
        id="notes"
        value={labTestResult.notes || 'N/A'}
        readOnly
        className="bg-muted/50 w-full px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        rows={2}
    />
</div>
                            
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="created_at">Date Created</Label>
                                <Input
                                    id="created_at"
                                    value={formatDate(labTestResult.created_at)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="updated_at">Last Updated</Label>
                                <Input
                                    id="updated_at"
                                    value={formatDate(labTestResult.updated_at)}
                                    readOnly
                                    className="bg-muted/50"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}