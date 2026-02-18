import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { ArrowLeft, Save, AlertCircle, User, Phone, MapPin, Stethoscope, Building2, FileText } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Department {
    id: number;
    name: string;
}

interface DoctorCreateProps {
    departments?: Department[];
}

const SPECIALIZATIONS = [
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'pediatrics', label: 'Pediatrics' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'general-medicine', label: 'General Medicine' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'emergency-medicine', label: 'Emergency Medicine' },
];

export default function DoctorCreate({ departments = [] }: DoctorCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        father_name: '',
        age: '',
        specialization: '',
        phone_number: '',
        address: '',
        bio: '',
        fees: '',
        fee_percentage: '',
        salary: '',
        bonus: '',
        department_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/doctors', {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <HospitalLayout>
            <Head title="Add New Doctor" />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Add New Doctor" />
                            <p className="text-sm text-muted-foreground mt-1">
                                Register a new doctor in the system
                            </p>
                        </div>
                        <Link href="/doctors">
                            <Button variant="outline" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Doctors
                            </Button>
                        </Link>
                    </div>

                    {/* Error Alert */}
                    {Object.keys(errors).length > 0 && (
                        <Alert className="bg-red-50 border-red-200 shadow-sm">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                Please fix the errors below before submitting.
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <Card className="shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-green-600" />
                                    </div>
                                    Personal Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Enter the doctor's personal details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-green-600" />
                                            Full Name *
                                        </Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            value={data.full_name}
                                            onChange={handleChange}
                                            placeholder="Enter doctor's full name"
                                            className="h-11"
                                        />
                                        {errors.full_name && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.full_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="father_name" className="text-base font-semibold">
                                            Father's Name
                                        </Label>
                                        <Input
                                            id="father_name"
                                            name="father_name"
                                            value={data.father_name}
                                            onChange={handleChange}
                                            placeholder="Enter father's name"
                                            className="h-11"
                                        />
                                        {errors.father_name && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.father_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="age" className="text-base font-semibold">
                                            Age
                                        </Label>
                                        <Input
                                            id="age"
                                            name="age"
                                            type="number"
                                            value={data.age}
                                            onChange={handleChange}
                                            placeholder="Enter age"
                                            className="h-11"
                                        />
                                        {errors.age && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.age}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone_number" className="text-base font-semibold flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-blue-600" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            id="phone_number"
                                            name="phone_number"
                                            value={data.phone_number}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                            className="h-11"
                                        />
                                        {errors.phone_number && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.phone_number}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-orange-600" />
                                        Address
                                    </Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        value={data.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        rows={3}
                                        className="resize-none"
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.address}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-base font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                        Biography
                                    </Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        value={data.bio}
                                        onChange={handleChange}
                                        placeholder="Enter doctor's biography"
                                        rows={4}
                                        className="resize-none"
                                    />
                                    {errors.bio && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.bio}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Professional Information */}
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Stethoscope className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Professional Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Select specialization and department assignment
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="specialization" className="text-base font-semibold flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-blue-600" />
                                            Specialization *
                                        </Label>
                                        <Select
                                            value={data.specialization}
                                            onValueChange={(value) => handleSelectChange('specialization', value)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select specialization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SPECIALIZATIONS.map(s => (
                                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.specialization && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.specialization}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department_id" className="text-base font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-indigo-600" />
                                            Department
                                        </Label>
                                        {departments && departments.length > 0 ? (
                                            <Select
                                                value={data.department_id}
                                                onValueChange={(value) => handleSelectChange('department_id', value)}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map((department) => (
                                                        <SelectItem key={department.id} value={department.id.toString()}>
                                                            {department.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 h-11">
                                                <AlertCircle className="h-4 w-4" />
                                                <span>No departments available. Please create a department first.</span>
                                            </div>
                                        )}
                                        {errors.department_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.department_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card className="shadow-lg border-t-4 border-t-amber-500">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                        <span className="text-lg font-bold text-amber-600">؋</span>
                                    </div>
                                    Financial Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Set consultation fees, salary, and bonus
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fees" className="text-base font-semibold">
                                            Consultation Fees (؋)
                                        </Label>
                                        <Input
                                            id="fees"
                                            name="fees"
                                            type="number"
                                            step="1"
                                            value={data.fees}
                                            onChange={handleChange}
                                            placeholder="Enter consultation fees"
                                            className="h-11"
                                        />
                                        {errors.fees && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.fees}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="fee_percentage" className="text-base font-semibold">
                                            Fee Percentage (%)
                                        </Label>
                                        <Input
                                            id="fee_percentage"
                                            name="fee_percentage"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={data.fee_percentage}
                                            onChange={handleChange}
                                            placeholder="e.g., 20 for 20%"
                                            className="h-11"
                                        />
                                        {errors.fee_percentage && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.fee_percentage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="salary" className="text-base font-semibold">
                                            Salary (؋)
                                        </Label>
                                        <Input
                                            id="salary"
                                            name="salary"
                                            type="number"
                                            step="1"
                                            value={data.salary}
                                            onChange={handleChange}
                                            placeholder="Enter salary"
                                            className="h-11"
                                        />
                                        {errors.salary && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.salary}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bonus" className="text-base font-semibold">
                                            Bonus (؋)
                                        </Label>
                                        <Input
                                            id="bonus"
                                            name="bonus"
                                            type="number"
                                            step="1"
                                            value={data.bonus}
                                            onChange={handleChange}
                                            placeholder="Enter bonus"
                                            className="h-11"
                                        />
                                        {errors.bonus && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.bonus}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/doctors">
                                <Button type="button" variant="outline" size="lg" className="shadow-md">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg text-white"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing ? 'Saving...' : 'Save Doctor'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
}
