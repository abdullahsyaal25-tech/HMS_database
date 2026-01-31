import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { ArrowLeft, Save, ClipboardList, Calendar, Play, CheckCircle, XCircle } from 'lucide-react';

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
}

interface LabTestRequestEditProps {
    labTestRequest: LabTestRequest;
    patients: Patient[];
    doctors: Doctor[];
}

export default function LabTestRequestEdit({ labTestRequest, patients, doctors }: LabTestRequestEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        patient_id: labTestRequest.patient_id.toString(),
        doctor_id: labTestRequest.doctor_id.toString(),
        test_name: labTestRequest.test_name,
        test_type: labTestRequest.test_type,
        status: labTestRequest.status,
        scheduled_at: labTestRequest.scheduled_at.slice(0, 16),
        notes: labTestRequest.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/laboratory/lab-test-requests/${labTestRequest.id}`);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    const handleStatusTransition = (newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
        setData('status', newStatus);
        // Small delay to ensure state is updated before submit
        setTimeout(() => {
            put(`/laboratory/lab-test-requests/${labTestRequest.id}`);
        }, 100);
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

    const canEdit = labTestRequest.status !== 'completed' && labTestRequest.status !== 'cancelled';

    return (
        <>
            <Head title={`Edit Lab Test Request - ${labTestRequest.request_id}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Heading title={`Edit Request: ${labTestRequest.request_id}`} />
                        <Badge variant={getStatusBadgeVariant(labTestRequest.status)}>
                            {labTestRequest.status.replace('_', ' ')}
                        </Badge>
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}`}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Details
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Status Workflow Controls */}
                {canEdit && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Status Workflow</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {labTestRequest.status === 'pending' && (
                                    <Button
                                        onClick={() => handleStatusTransition('in_progress')}
                                        disabled={processing}
                                        variant="outline"
                                        className="bg-blue-50 hover:bg-blue-100"
                                    >
                                        <Play className="mr-2 h-4 w-4" />
                                        Start Processing
                                    </Button>
                                )}
                                {labTestRequest.status === 'in_progress' && (
                                    <Button
                                        onClick={() => handleStatusTransition('completed')}
                                        disabled={processing}
                                        variant="outline"
                                        className="bg-green-50 hover:bg-green-100"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark Completed
                                    </Button>
                                )}
                                {(labTestRequest.status === 'pending' || labTestRequest.status === 'in_progress') && (
                                    <Button
                                        onClick={() => handleStatusTransition('cancelled')}
                                        disabled={processing}
                                        variant="outline"
                                        className="bg-red-50 hover:bg-red-100"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Request
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="h-5 w-5" />
                            Lab Test Request Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="patient_id">Patient *</Label>
                                    <Select
                                        value={data.patient_id}
                                        onValueChange={(value) => handleSelectChange('patient_id', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map((patient) => (
                                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                                    {patient.first_name} {patient.father_name} (PID: {patient.patient_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.patient_id && (
                                        <p className="text-sm text-red-600">{errors.patient_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="doctor_id">Doctor *</Label>
                                    <Select
                                        value={data.doctor_id}
                                        onValueChange={(value) => handleSelectChange('doctor_id', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map((doctor) => (
                                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                    {doctor.full_name} (DID: {doctor.doctor_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.doctor_id && (
                                        <p className="text-sm text-red-600">{errors.doctor_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="test_name">Test Name *</Label>
                                    <Input
                                        id="test_name"
                                        name="test_name"
                                        value={data.test_name}
                                        onChange={handleChange}
                                        placeholder="Enter test name"
                                        disabled={!canEdit}
                                    />
                                    {errors.test_name && (
                                        <p className="text-sm text-red-600">{errors.test_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="test_type">Test Type *</Label>
                                    <Select
                                        value={data.test_type}
                                        onValueChange={(value) => handleSelectChange('test_type', value)}
                                        disabled={!canEdit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select test type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="routine">Routine</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                            <SelectItem value="stat">STAT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.test_type && (
                                        <p className="text-sm text-red-600">{errors.test_type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_at">Scheduled Date & Time *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="scheduled_at"
                                            name="scheduled_at"
                                            type="datetime-local"
                                            value={data.scheduled_at}
                                            onChange={handleChange}
                                            className="pl-8"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    {errors.scheduled_at && (
                                        <p className="text-sm text-red-600">{errors.scheduled_at}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={handleChange}
                                        placeholder="Enter any additional notes"
                                        rows={3}
                                        disabled={!canEdit}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>

                            {canEdit && (
                                <div className="flex justify-end space-x-4 pt-4">
                                    <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}`}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Saving...' : 'Update Request'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
