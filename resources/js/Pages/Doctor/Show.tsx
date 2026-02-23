import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Phone, MapPin, User, ArrowLeft, Pencil, FileText, Calendar, Building2, Stethoscope, Trash2, Percent } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    username: string;
}

interface Department {
    id: number;
    name: string;
    description?: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    father_name: string;
    age: number;
    specialization: string;
    phone_number: string;
    address: string;
    bio: string;
    fees: number;
    fee_percentage: number;
    salary: number;
    bonus: number;
    department_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    user: User;
    department?: Department;
}

interface DoctorShowProps {
    doctor: Doctor;
}

export default function DoctorShow({ doctor }: DoctorShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete Dr. ${doctor.full_name}? This action cannot be undone.`)) {
            setIsDeleting(true);
            router.visit(`/doctors/${doctor.id}/delete`, {
                method: 'post',
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Doctor Details - ${doctor.doctor_id}`} />

            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={`Dr. ${doctor.full_name}`} />
                            <p className="text-sm text-muted-foreground mt-1">
                                Doctor ID: <span className="font-mono font-semibold text-green-600">{doctor.doctor_id}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/doctors/${doctor.id}/edit`}>
                                <Button variant="outline" className="shadow-sm hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                className="shadow-sm text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                            <Link href="/doctors">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information Card */}
                        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-green-600" />
                                    </div>
                                    Personal Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Doctor's personal and professional details
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctor ID</p>
                                        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                            {doctor.doctor_id}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
                                        <p className="text-base font-semibold">Dr. {doctor.full_name}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Father's Name</p>
                                        <p className="text-base">{doctor.father_name || 'N/A'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age</p>
                                        <p className="text-base">{doctor.age ? `${doctor.age} years` : 'N/A'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</p>
                                        <p className="text-base font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{doctor.user.username}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                            Active
                                        </Badge>
                                    </div>
                                </div>

                                <div className="border-t pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                                                <p className="text-base">{doctor.phone_number || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                                                <p className="text-base">{doctor.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {doctor.bio && (
                                    <div className="border-t pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="space-y-1 flex-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Biography</p>
                                                <div className="bg-muted/40 rounded-lg p-4">
                                                    <p className="text-base leading-relaxed">{doctor.bio}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Sidebar Cards */}
                        <div className="space-y-6">
                            {/* Professional Details Card */}
                            <Card className="shadow-lg border-l-4 border-l-green-500">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                        </div>
                                        Professional Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specialization</p>
                                        <Badge variant="outline" className="capitalize border-green-200 text-green-700 bg-green-50">
                                            {doctor.specialization.replace(/-/g, ' ')}
                                        </Badge>
                                    </div>

                                    {doctor.department && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <Building2 className="h-3 w-3" />
                                                Department
                                            </p>
                                            <p className="text-base font-medium">{doctor.department.name}</p>
                                        </div>
                                    )}

                                    <div className="border-t pt-4 space-y-3">
                                        <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 border border-amber-100">
                                            <span className="text-sm text-amber-800 font-medium">Consultation Fee</span>
                                            <span className="font-bold text-amber-700">؋{doctor.fees || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-100">
                                            <span className="text-sm text-blue-800 font-medium">Salary</span>
                                            <span className="font-bold text-blue-700">؋{doctor.salary || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50 border border-purple-100">
                                            <span className="text-sm text-purple-800 font-medium">Bonus</span>
                                            <span className="font-bold text-purple-700">؋{doctor.bonus || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-100">
                                            <span className="text-sm text-green-800 font-medium">Fee Percentage</span>
                                            <span className="font-bold text-green-700">{doctor.fee_percentage || 0}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline Card */}
                            <Card className="shadow-lg border-l-4 border-l-blue-500">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</p>
                                        <p className="text-sm font-medium">{formatDate(doctor.created_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</p>
                                        <p className="text-sm font-medium">{formatDateTime(doctor.updated_at)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Card */}
                            <Card className="shadow-lg border-l-4 border-l-purple-500">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Stethoscope className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    <Link href={`/doctors/${doctor.id}/appointments`} className="block">
                                        <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            View Reception
                                        </Button>
                                    </Link>

                                    <Link href={`/departments/services/doctor-percentage?doctor=${doctor.id}`} className="block">
                                        <Button variant="outline" size="sm" className="w-full justify-start text-purple-700 hover:text-purple-800 hover:bg-purple-50 hover:border-purple-300">
                                            <Percent className="mr-2 h-4 w-4" />
                                            Doctor % Services
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}
