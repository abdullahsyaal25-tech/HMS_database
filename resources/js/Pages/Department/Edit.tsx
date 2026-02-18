import { Head, useForm, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { ArrowLeft, Save, AlertCircle, Building, Phone, MapPin, Users } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Doctor {
    id: number;
    doctor_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
}

interface Department {
    id: number;
    department_id: string;
    name: string;
    description?: string | null;
    head_doctor_id?: number | null;
    head_doctor_name?: string | null;
    phone?: string | null;
    address?: string | null;
    created_at: string;
    updated_at: string;
}

interface DepartmentEditProps {
    department: Department;
    doctors?: Doctor[];
}

export default function DepartmentEdit({ department, doctors = [] }: DepartmentEditProps) {
    const { data, setData, processing, errors } = useForm({
        name: department.name,
        description: department.description || '',
        head_doctor_id: department.head_doctor_id?.toString() || '',
        phone: department.phone || '',
        address: department.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!department?.id) {
            console.error('Department ID is missing:', department);
            alert('Error: Department ID is missing. Please refresh the page.');
            return;
        }

        const updateUrl = `/departments/${department.id}`;

        router.visit(updateUrl, {
            method: 'post',
            data: {
                ...data,
                _method: 'PUT',
            },
            preserveScroll: true,
            onSuccess: () => {
                console.log('Update successful');
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
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
            <Head title={`Edit Department - ${department.department_id}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={`Edit Department`} />
                            <p className="text-sm text-muted-foreground mt-1">
                                Editing: <span className="font-mono font-semibold text-blue-600">{department.department_id}</span>
                            </p>
                        </div>
                        <Link href={`/departments/${department.id}`}>
                            <Button variant="outline" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Details
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
                        {/* Basic Information */}
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Building className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Basic Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Update the department's name and assigned head doctor
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-base font-semibold flex items-center gap-2">
                                            <Building className="h-4 w-4 text-blue-600" />
                                            Department Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            onChange={handleChange}
                                            placeholder="Enter department name"
                                            className="h-11"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="head_doctor_id" className="text-base font-semibold flex items-center gap-2">
                                            <Users className="h-4 w-4 text-green-600" />
                                            Head Doctor
                                        </Label>
                                        <Select
                                            value={data.head_doctor_id}
                                            onValueChange={(value) => handleSelectChange('head_doctor_id', value)}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select head doctor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors && doctors.length > 0 ? (
                                                    doctors.map(doctor => (
                                                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs text-muted-foreground">{doctor.doctor_id}</span>
                                                                <span>-</span>
                                                                <span>{doctor.first_name} {doctor.last_name}</span>
                                                                <span className="text-xs text-muted-foreground">({doctor.specialization})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="none" disabled>
                                                        No doctors available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {errors.head_doctor_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.head_doctor_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base font-semibold">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={handleChange}
                                        placeholder="Enter department description"
                                        rows={4}
                                        className="resize-none"
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.description}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <Card className="shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-green-600" />
                                    </div>
                                    Contact Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Update phone number and address details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
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
                                        <MapPin className="h-4 w-4 text-purple-600" />
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
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/departments">
                                <Button type="button" variant="outline" size="lg" className="shadow-md">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={processing}
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing ? 'Saving...' : 'Update Department'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
}
