import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Phone, MapPin, User, ArrowLeft, Pencil, FileText, Droplet, Users, ChevronLeft, ChevronRight, Calendar, Shield } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient } from '@/types/patient';

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
}

interface PatientShowProps {
    patient: Patient;
    patients_pagination?: {
        data: Patient[];
        meta?: PaginationMeta;
    };
}

export default function PatientShow({ patient, patients_pagination }: PatientShowProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getGenderColor = (gender: string) => {
        switch (gender.toLowerCase()) {
            case 'male': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'female': return 'bg-pink-100 text-pink-700 border-pink-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const goToPage = (page: number) => {
        router.get(`/patients/${patient.patient_id}?page=${page}`);
    };

    const goToPreviousPage = () => {
        const currentPage = patients_pagination?.meta?.current_page || 1;
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        const currentPage = patients_pagination?.meta?.current_page || 1;
        if (patients_pagination?.meta && currentPage < patients_pagination.meta.last_page) {
            goToPage(currentPage + 1);
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Patient Details - ${patient.patient_id}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={patient.first_name || `Patient ${patient.patient_id}`} />
                            <p className="text-sm text-muted-foreground mt-1">
                                Patient ID: <span className="font-mono font-semibold text-blue-600">{patient.patient_id}</span>
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Link href={`/patients/${patient.patient_id}/edit`}>
                                <Button variant="outline" className="shadow-sm hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            <Link href="/patients">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Patients
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patient Information Card */}
                        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient ID</h3>
                                        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                            {patient.patient_id}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</h3>
                                        <p className="text-lg font-semibold">{patient.first_name || 'N/A'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Father's Name</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                <Users className="h-3.5 w-3.5 text-purple-600" />
                                            </div>
                                            <span className="text-base">{patient.father_name || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gender</h3>
                                        <div className="pt-0.5">
                                            {patient.gender ? (
                                                <Badge className={`${getGenderColor(patient.gender as string)} border`}>
                                                    {(patient.gender as string).charAt(0).toUpperCase() + (patient.gender as string).slice(1)}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">N/A</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Age</h3>
                                        <p className="text-base font-medium">{patient.age ? `${patient.age} years` : 'N/A'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blood Group</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-red-500/10 flex items-center justify-center">
                                                <Droplet className="h-3.5 w-3.5 text-red-600" />
                                            </div>
                                            {patient.blood_group ? (
                                                <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                                                    {patient.blood_group}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-6 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</h3>
                                            <p className="text-base">{patient.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</h3>
                                            <p className="text-base">{patient.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Patient Summary Card */}
                        <div className="space-y-6">
                            <Card className="shadow-lg border-l-4 border-l-green-500">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-green-600" />
                                        </div>
                                        Patient Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registered</h3>
                                        <p className="text-sm font-medium">{formatDate(patient.created_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</h3>
                                        <p className="text-sm font-medium">{formatDate(patient.updated_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Status</h3>
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                            Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg border-l-4 border-l-purple-500">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Shield className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    <Link href={`/appointments?patient_id=${patient.id}`} className="block">
                                        <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            View Appointments
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Additional Information Section */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                            <CardTitle className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                </div>
                                Additional Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground leading-relaxed">
                                This patient profile contains all relevant medical and contact information.
                                Healthcare providers can use this information to coordinate care and maintain
                                accurate records.
                            </p>

                            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                                    <Shield className="h-4 w-4" />
                                    Important Notes
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                                    <li>All patient information is kept confidential and secure</li>
                                    <li>Medical history and treatment plans can be accessed separately</li>
                                    <li>Emergency contacts are maintained in the patient's profile</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Pagination Controls */}
            {patients_pagination?.meta && patients_pagination.meta.last_page > 1 && (
                <div className="px-4 md:px-8 pb-8">
                    <div className="max-w-7xl mx-auto">
                        <Card className="shadow-lg">
                            <CardContent className="pt-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing <strong>{patients_pagination.meta.from}</strong> to <strong>{patients_pagination.meta.to}</strong> of{' '}
                                        <strong>{patients_pagination.meta.total}</strong> patients
                                        {patients_pagination.meta.last_page > 1 && (
                                            <span className="ml-2 text-xs">(Page {patients_pagination.meta.current_page} of {patients_pagination.meta.last_page})</span>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={patients_pagination.meta.current_page <= 1}
                                            onClick={goToPreviousPage}
                                            className="flex items-center gap-1 shadow-sm"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>

                                        <div className="flex space-x-1">
                                            {(() => {
                                                if (!patients_pagination.meta) return null;
                                                return Array.from({ length: Math.min(5, patients_pagination.meta.last_page) }, (_, i) => {
                                                    let pageNum;
                                                    if (patients_pagination.meta!.last_page <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (patients_pagination.meta!.current_page <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (patients_pagination.meta!.current_page >= patients_pagination.meta!.last_page - 2) {
                                                        pageNum = patients_pagination.meta!.last_page - 4 + i;
                                                    } else {
                                                        pageNum = patients_pagination.meta!.current_page - 2 + i;
                                                    }

                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={patients_pagination.meta!.current_page === pageNum ? "default" : "outline"}
                                                            size="sm"
                                                            onClick={() => goToPage(pageNum)}
                                                            className="w-8 h-8 p-0"
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                });
                                            })()}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={patients_pagination.meta.current_page >= patients_pagination.meta.last_page}
                                            onClick={goToNextPage}
                                            className="flex items-center gap-1 shadow-sm"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </HospitalLayout>
    );
}
