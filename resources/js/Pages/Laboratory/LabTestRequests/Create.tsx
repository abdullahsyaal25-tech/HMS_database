import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';
import { ArrowLeft, Save, ClipboardList, Calendar } from 'lucide-react';

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

interface LabTestRequestCreateProps {
    patients: Patient[];
    doctors: Doctor[];
}

export default function LabTestRequestCreate({ patients, doctors }: LabTestRequestCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        doctor_id: '',
        test_name: '',
        test_type: 'routine',
        scheduled_at: new Date().toISOString().split('T')[0] + 'T09:00',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/laboratory/lab-test-requests');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <>
            <Head title="Create Lab Test Request" />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Create Lab Test Request" />

                    <Link href="/laboratory/lab-test-requests">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Requests
                        </Button>
                    </Link>
                </div>

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
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/laboratory/lab-test-requests">
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
                                    {processing ? 'Creating...' : 'Create Request'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
