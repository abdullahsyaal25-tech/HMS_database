import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Heading from '@/components/heading';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

interface LabTestResultFormData {
    lab_test_id: string;
    patient_id: string;
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
}

export default function LabTestResultCreate() {
    const { data, setData, post, processing, errors } = useForm({
        lab_test_id: '',
        patient_id: '',
        performed_at: new Date().toISOString().split('T')[0],
        results: '',
        status: 'pending',
        notes: '',
        abnormal_flags: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/laboratory/lab-test-results');
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
            <Head title="Add New Lab Test Result" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Add New Lab Test Result" />
                    
                    <Link href="/laboratory/lab-test-results">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Results
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lab Test Result Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="lab_test_id">Lab Test *</Label>
                                    <Select 
                                        value={data.lab_test_id} 
                                        onValueChange={(value) => handleSelectChange('lab_test_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select lab test" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Complete Blood Count (CBC)</SelectItem>
                                            <SelectItem value="2">Basic Metabolic Panel (BMP)</SelectItem>
                                            <SelectItem value="3">Lipid Panel</SelectItem>
                                            <SelectItem value="4">Liver Function Tests (LFT)</SelectItem>
                                            <SelectItem value="5">Thyroid Function Tests</SelectItem>
                                            <SelectItem value="6">Urinalysis</SelectItem>
                                            <SelectItem value="7">Blood Glucose Test</SelectItem>
                                            <SelectItem value="8">Hemoglobin A1c</SelectItem>
                                            <SelectItem value="9">Vitamin D Test</SelectItem>
                                            <SelectItem value="10">Iron Studies</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.lab_test_id && (
                                        <p className="text-sm text-red-600">{errors.lab_test_id}</p>
                                    )}
                                </div>
                                
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
                                            <SelectItem value="1">John Doe (PID: 1001)</SelectItem>
                                            <SelectItem value="2">Jane Smith (PID: 1002)</SelectItem>
                                            <SelectItem value="3">Michael Brown (PID: 1003)</SelectItem>
                                            <SelectItem value="4">Sarah Johnson (PID: 1004)</SelectItem>
                                            <SelectItem value="5">David Wilson (PID: 1005)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.patient_id && (
                                        <p className="text-sm text-red-600">{errors.patient_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="performed_at">Performed Date *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="performed_at"
                                            name="performed_at"
                                            type="date"
                                            value={data.performed_at}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.performed_at && (
                                        <p className="text-sm text-red-600">{errors.performed_at}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select 
                                        value={data.status} 
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="verified">Verified</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="results">Results *</Label>
                                    <Textarea
                                        id="results"
                                        name="results"
                                        value={data.results}
                                        onChange={handleChange}
                                        placeholder="Enter test results"
                                        rows={4}
                                    />
                                    {errors.results && (
                                        <p className="text-sm text-red-600">{errors.results}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="abnormal_flags">Abnormal Flags</Label>
                                    <Textarea
                                        id="abnormal_flags"
                                        name="abnormal_flags"
                                        value={data.abnormal_flags}
                                        onChange={handleChange}
                                        placeholder="Enter abnormal flags (if any)"
                                        rows={2}
                                    />
                                    {errors.abnormal_flags && (
                                        <p className="text-sm text-red-600">{errors.abnormal_flags}</p>
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
                                        rows={2}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/laboratory/lab-test-results">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Lab Test Result'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}