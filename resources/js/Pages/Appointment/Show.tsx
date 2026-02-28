import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Calendar, Clock, User, Stethoscope, FileText, ArrowLeft, Pencil, Package, DollarSign, Percent, Tag, Receipt, Building2, FlaskConical } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    specialization: string;
}

interface Department {
    id: number;
    name: string;
}

interface DepartmentInfo {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
    department: DepartmentInfo | null;
    pivot: {
        custom_cost: number;
        discount_percentage: number;
        final_cost: number;
    };
}

interface Appointment {
    id: number;
    appointment_id: string;
    patient_id: number;
    doctor_id: number | null;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    fee: number;
    discount: number;
    grand_total: number;
    created_at: string;
    updated_at: string;
    patient: Patient;
    doctor: Doctor | null;
    department: Department | null;
    services: Service[];
}

interface AppointmentShowProps {
    appointment: Appointment;
}

export default function AppointmentShow({ appointment }: AppointmentShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled':
                return 'secondary';
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'destructive';
            case 'rescheduled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Appointment Details - ${appointment.appointment_id}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={`Appointment: ${appointment.appointment_id}`} />
                            <p className="text-sm text-muted-foreground mt-1">
                                View detailed information about this appointment
                            </p>
                        </div>
                        
                        <div className="flex space-x-2">
                            <Link href={`/appointments/${appointment.id}/edit`}>
                                <Button variant="outline" className="shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            
                            <Link href="/appointments">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Appointments
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Appointment Information Card */}
                        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                    Appointment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appointment ID</h3>
                                        <Badge variant="outline" className="text-base font-mono px-3 py-1">
                                            {appointment.appointment_id}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h3>
                                        <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-base px-3 py-1 capitalize">
                                            {appointment.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Date</h3>
                                        <div className="flex items-center gap-2 text-base">
                                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-green-600" />
                                            </div>
                                            <span className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time</h3>
                                        <div className="flex items-center gap-2 text-base">
                                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <span className="font-medium">{appointment.appointment_time}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reason for Appointment</h3>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-base leading-relaxed">{appointment.reason}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Patient and Doctor Information Card */}
                        <div className="space-y-6">
                            {/* Patient Information */}
                            <Card className="shadow-lg border-l-4 border-l-blue-500">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-lg">Patient Information</div>
                                            <div className="text-xs font-normal text-muted-foreground">Patient details</div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient ID</h3>
                                        <Badge variant="outline" className="font-mono">{appointment.patient.patient_id}</Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</h3>
                                        <p className="font-semibold text-lg">{appointment.patient.full_name}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Doctor / Department Information */}
                            <Card className={`shadow-lg border-l-4 ${appointment.doctor ? 'border-l-green-500' : 'border-l-purple-500'}`}>
                                <CardHeader className={`bg-gradient-to-r ${appointment.doctor ? 'from-green-50 to-emerald-50' : 'from-purple-50 to-violet-50'}`}>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${appointment.doctor ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                                            <Stethoscope className={`h-5 w-5 ${appointment.doctor ? 'text-green-600' : 'text-purple-600'}`} />
                                        </div>
                                        <div>
                                            <div className="text-lg">{appointment.doctor ? 'Doctor Information' : 'Department Information'}</div>
                                            <div className="text-xs font-normal text-muted-foreground">
                                                {appointment.doctor ? 'Attending physician' : 'Service department'}
                                            </div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    {appointment.doctor ? (
                                        <>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctor ID</h3>
                                                <Badge variant="outline" className="font-mono">{appointment.doctor.doctor_id}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</h3>
                                                <p className="font-semibold text-lg">Dr. {appointment.doctor.full_name}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specialization</h3>
                                                <Badge variant="secondary" className="capitalize">
                                                    {appointment.doctor.specialization?.replace(/-/g, ' ') || 'N/A'}
                                                </Badge>
                                            </div>
                                        </>
                                    ) : appointment.department ? (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</h3>
                                            <p className="font-semibold text-lg text-purple-700">{appointment.department.name}</p>
                                            <p className="text-sm text-muted-foreground italic">No doctor assigned</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">Not Assigned</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Services and Billing Section */}
                    <Card className="shadow-lg border-t-4 border-t-emerald-500">
                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Receipt className="h-6 w-6 text-emerald-600" />
                                Services & Billing Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Consultation Fee */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h3 className="text-sm font-medium text-blue-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                                    <Stethoscope className="h-4 w-4" />
                                    Doctor Consultation Fee
                                </h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Consultation Fee</span>
                                    <span className="font-semibold text-lg">؋{Number(appointment.fee || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Services List */}
                            {appointment.services && appointment.services.length > 0 ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Services ({appointment.services.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {appointment.services.map((service, index) => {
                                            const isLaboratory = service.department?.name?.toLowerCase().includes('lab');
                                            return (
                                                <div key={service.id} className={`rounded-lg p-4 border ${isLaboratory ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isLaboratory ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                                                                {isLaboratory ? (
                                                                    <FlaskConical className="h-5 w-5 text-blue-600" />
                                                                ) : (
                                                                    <Building2 className="h-5 w-5 text-purple-600" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{service.name}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {isLaboratory ? (
                                                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                                                            Laboratory
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                                                            {service.department?.name || 'Department Service'}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-emerald-600">؋{Number(service.pivot.final_cost).toFixed(2)}</p>
                                                            {service.pivot.discount_percentage > 0 && (
                                                                <p className="text-sm text-red-500">-{service.pivot.discount_percentage}% off</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Base Cost:</span>
                                                            <span className="ml-2 font-medium">؋{Number(service.pivot.custom_cost).toFixed(2)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Discount:</span>
                                                            <span className="ml-2 font-medium text-red-600">{service.pivot.discount_percentage}%</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Final:</span>
                                                            <span className="ml-2 font-medium text-emerald-600">؋{Number(service.pivot.final_cost).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-6 text-center border border-gray-200">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-muted-foreground">No additional services attached to this appointment</p>
                                </div>
                            )}

                            {/* Cost Summary */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                                <h3 className="text-sm font-medium text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                                    <DollarSign className="h-4 w-4" />
                                    Cost Summary
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Consultation Fee</span>
                                        <span className="font-medium">؋{Number(appointment.fee || 0).toFixed(2)}</span>
                                    </div>
                                    {appointment.services && appointment.services.length > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Services Total</span>
                                            <span className="font-medium">
                                                ؋{appointment.services.reduce((sum, s) => sum + Number(s.pivot.final_cost), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-medium">
                                            ؋{(Number(appointment.fee || 0) + (appointment.services?.reduce((sum, s) => sum + Number(s.pivot.final_cost), 0) || 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    {appointment.discount > 0 && (
                                        <div className="flex items-center justify-between text-red-600">
                                            <span className="flex items-center gap-2">
                                                <Tag className="h-4 w-4" />
                                                Appointment Discount
                                            </span>
                                            <span className="font-medium">-؋{Number(appointment.discount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-amber-200 flex items-center justify-between">
                                        <span className="text-lg font-semibold text-amber-900">Grand Total</span>
                                        <span className="text-2xl font-bold text-emerald-600">؋{Number(appointment.grand_total || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Information Section */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Created
                                    </h3>
                                    <p className="text-base">{formatDate(appointment.created_at)}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Last Updated
                                    </h3>
                                    <p className="text-base">{formatDate(appointment.updated_at)}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                                    <FileText className="h-5 w-5" />
                                    Appointment Notes
                                </h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    This appointment is scheduled for {appointment.patient.full_name}
                                    {appointment.doctor
                                        ? ` with Dr. ${appointment.doctor.full_name}`
                                        : appointment.department
                                            ? ` at the ${appointment.department.name} department`
                                            : ''
                                    }.
                                    Please ensure all necessary preparations are completed before the appointment time.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}