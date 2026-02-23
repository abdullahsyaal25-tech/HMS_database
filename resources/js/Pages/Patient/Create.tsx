import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, User, Phone, MapPin, Droplet, Users } from 'lucide-react';
import { Link } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { PatientFormData } from '@/types/patient';

interface PatientCreateProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PatientCreate({ flash }: PatientCreateProps) {
    const { data, setData, post, processing, errors } = useForm<PatientFormData>({
        first_name: '',
        father_name: '',
        gender: '',
        phone: '',
        address: '',
        age: '',
        blood_group: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/patients', {
            preserveScroll: true,
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
            <Head title="Add New Patient" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Add New Patient" />
                            <p className="text-sm text-muted-foreground mt-1">
                                Register a new patient in the system
                            </p>
                        </div>
                        <Link href="/patients">
                            <Button variant="outline" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Patients
                            </Button>
                        </Link>
                    </div>

                    {/* Success Alert */}
                    {flash?.success && (
                        <Alert className="bg-green-50 border-green-200 shadow-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {flash.success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Alert */}
                    {flash?.error && (
                        <Alert className="bg-red-50 border-red-200 shadow-sm">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {flash.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Validation Errors */}
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
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Personal Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    All fields are optional. Fill in the available information about the patient.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            Full Name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            value={data.first_name}
                                            onChange={handleChange}
                                            placeholder="Enter patient name"
                                            className="h-11"
                                        />
                                        {errors.first_name && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="father_name" className="text-base font-semibold flex items-center gap-2">
                                            <Users className="h-4 w-4 text-purple-600" />
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
                                        <Label htmlFor="gender" className="text-base font-semibold">
                                            Gender
                                        </Label>
                                        <Select
                                            value={data.gender}
                                            onValueChange={(value) => handleSelectChange('gender', value)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                        Male
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="female">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                                                        Female
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="other">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                                                        Other
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.gender}
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
                                            min="0"
                                            max="150"
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
                                        <Label htmlFor="blood_group" className="text-base font-semibold flex items-center gap-2">
                                            <Droplet className="h-4 w-4 text-red-600" />
                                            Blood Group
                                        </Label>
                                        <Select
                                            value={data.blood_group}
                                            onValueChange={(value) => handleSelectChange('blood_group', value)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select blood group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.blood_group && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.blood_group}
                                            </p>
                                        )}
                                    </div>
                         
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-base font-semibold flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-green-600" />
                                        Phone Number
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                        className="h-11"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.phone}
                                        </p>
                                    )}
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
                                        rows={1}
                                        className="resize-none"
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.address}
                                        </p>
                                    )}
                                </div>
                                

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/patients">
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
                                {processing ? 'Saving...' : 'Save Patient'}
                            </Button>
                        </div>
                            </div>     
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
}
