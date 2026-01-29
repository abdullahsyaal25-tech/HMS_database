import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { ArrowLeft, Save, Calendar as CalendarIcon, User, Stethoscope, Percent, DollarSign, Users, Building2 } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name: string;
}

interface Doctor {
    id: number;
    full_name: string;
    specialization: string;
    fees: string;
}

interface Department {
    id: number;
    name: string;
}

interface AppointmentCreateProps {
    patients: Patient[];
    doctors: Doctor[];
    departments: Department[];
}

export default function AppointmentCreate({ patients, doctors, departments }: AppointmentCreateProps) {
    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        appointment_date: currentDate + 'T' + currentTime,
        reason: '',
        notes: '',
        fee: '',
        discount: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/appointments');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleComboboxChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
        
        // Auto-populate fee when doctor is selected
        if (name === 'doctor_id' && value) {
            const selectedDoctor = doctors.find(d => d.id.toString() === value);
            if (selectedDoctor && selectedDoctor.fees) {
                setData('fee', selectedDoctor.fees);
            }
        }
    };

    const calculateFinalFee = () => {
        const fee = parseFloat(data.fee) || 0;
        const discount = parseFloat(data.discount) || 0;
        
        // Validate discount is between 0-100
        if (discount < 0 || discount > 100) {
            return '0.00';
        }
        
        const discountAmount = (fee * discount) / 100;
        const finalFee = fee - discountAmount;
        
        // Ensure final fee is not negative
        return finalFee >= 0 ? finalFee.toFixed(2) : '0.00';
    };

    // Transform patients into combobox options
    const patientOptions: ComboboxOption[] = patients.map(patient => ({
        value: patient.id.toString(),
        label: `${patient.first_name} ${patient.father_name}`,
        subtitle: `ID: ${patient.patient_id}`,
        icon: <User className="h-4 w-4 text-blue-600" />
    }));

    // Transform doctors into combobox options
    const doctorOptions: ComboboxOption[] = doctors.map(doctor => ({
        value: doctor.id.toString(),
        label: doctor.full_name,
        subtitle: doctor.specialization,
        icon: <Stethoscope className="h-4 w-4 text-green-600" />
    }));

    // Transform departments into combobox options
    const departmentOptions: ComboboxOption[] = departments.map(dept => ({
        value: dept.id.toString(),
        label: dept.name,
        icon: <Building2 className="h-4 w-4 text-purple-600" />
    }));

    return (
        <HospitalLayout>
            <Head title="Schedule New Appointment" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Schedule New Appointment" />
                            <p className="text-sm text-muted-foreground mt-1">Create a new appointment for a patient with their preferred doctor</p>
                        </div>
                        
                        <Link href="/appointments">
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Appointments
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient & Doctor Information */}
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="h-6 w-6 text-blue-600" />
                                    Patient & Doctor Selection
                                </CardTitle>
                                <CardDescription className="text-base">Search and select the patient and attending doctor</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Patient Selection with Search */}
                                    <div className="space-y-2">
                                        <Label htmlFor="patient_id" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            Patient *
                                        </Label>
                                        <Combobox
                                            options={patientOptions}
                                            value={data.patient_id}
                                            onValueChange={(value) => handleComboboxChange('patient_id', value)}
                                            placeholder="Search for a patient..."
                                            searchPlaceholder="Type to search patients..."
                                            emptyText="No patients found"
                                            className="h-auto py-3"
                                        />
                                        {errors.patient_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.patient_id}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Search by patient name or ID</p>
                                    </div>
                                    
                                    {/* Doctor Selection with Search */}
                                    <div className="space-y-2">
                                        <Label htmlFor="doctor_id" className="text-base font-semibold flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                            Doctor *
                                        </Label>
                                        <Combobox
                                            options={doctorOptions}
                                            value={data.doctor_id}
                                            onValueChange={(value) => handleComboboxChange('doctor_id', value)}
                                            placeholder="Search for a doctor..."
                                            searchPlaceholder="Type to search doctors..."
                                            emptyText="No doctors found"
                                            className="h-auto py-3"
                                        />
                                        {errors.doctor_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.doctor_id}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Doctor's fee will be automatically populated</p>
                                    </div>

                                    {/* Department Selection with Search */}
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="department_id" className="text-base font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-purple-600" />
                                            Department *
                                        </Label>
                                        <Combobox
                                            options={departmentOptions}
                                            value={data.department_id}
                                            onValueChange={(value) => handleComboboxChange('department_id', value)}
                                            placeholder="Select department..."
                                            searchPlaceholder="Search departments..."
                                            emptyText="No departments found"
                                            className="h-auto py-3"
                                        />
                                        {errors.department_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.department_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointment Details */}
                        <Card className="shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <CalendarIcon className="h-6 w-6 text-green-600" />
                                    Appointment Details
                                </CardTitle>
                                <CardDescription className="text-base">Schedule date, time and reason for the appointment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Date and Time */}
                                    <div className="space-y-2">
                                        <Label htmlFor="appointment_date" className="text-base font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-green-600" />
                                            Appointment Date & Time *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="appointment_date"
                                                name="appointment_date"
                                                type="datetime-local"
                                                value={data.appointment_date}
                                                onChange={handleChange}
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        {errors.appointment_date && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.appointment_date}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Reason */}
                                    <div className="space-y-2">
                                        <Label htmlFor="reason" className="text-base font-semibold">Reason for Appointment</Label>
                                        <Textarea
                                            id="reason"
                                            name="reason"
                                            value={data.reason}
                                            onChange={handleChange}
                                            placeholder="Describe the reason for the appointment (e.g., routine checkup, follow-up, consultation)"
                                            rows={3}
                                            className="resize-none text-base"
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.reason}
                                            </p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-base font-semibold">Additional Notes</Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            value={data.notes}
                                            onChange={handleChange}
                                            placeholder="Any additional notes, special requirements, or instructions"
                                            rows={2}
                                            className="resize-none text-base"
                                        />
                                        {errors.notes && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fee & Discount */}
                        <Card className="shadow-lg border-t-4 border-t-amber-500">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <DollarSign className="h-6 w-6 text-amber-600" />
                                    Fee & Discount
                                </CardTitle>
                                <CardDescription className="text-base">Consultation fee and applicable discount</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Fee */}
                                    <div className="space-y-2">
                                        <Label htmlFor="fee" className="text-base font-semibold">Consultation Fee *</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="fee"
                                                name="fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.fee}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="pl-11 h-12 text-base bg-muted/50"
                                                readOnly
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">📌 Auto-filled from selected doctor</p>
                                        {errors.fee && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.fee}
                                            </p>
                                        )}
                                    </div>

                                    {/* Discount */}
                                    <div className="space-y-2">
                                        <Label htmlFor="discount" className="text-base font-semibold">Discount (%)</Label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="discount"
                                                name="discount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={data.discount}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        {errors.discount && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.discount}
                                            </p>
                                        )}
                                    </div>

                                    {/* Final Fee */}
                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Final Amount *</Label>
                                        <div className="flex items-center h-12 px-4 py-3 border-2 border-amber-500 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
                                            <DollarSign className="h-6 w-6 mr-2 text-amber-600" />
                                            <span className="font-bold text-2xl text-amber-700">{calculateFinalFee()}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">💰 Amount after discount</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                                
                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/appointments">
                                <Button type="button" variant="outline" size="lg" className="shadow-md">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
}
