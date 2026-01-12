import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Calendar, Clock, User, Stethoscope, FileText, ArrowLeft, Pencil } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
}

interface Appointment {
    id: number;
    appointment_id: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    created_at: string;
    updated_at: string;
    patient: Patient;
    doctor: Doctor;
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
        <>
            <Head title={`Appointment Details - ${appointment.appointment_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Appointment: ${appointment.appointment_id}`} />
                    
                    <div className="flex space-x-2">
                        <Link href={`/appointments/${appointment.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Link href="/appointments">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Appointments
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Appointment Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Appointment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Appointment ID</h3>
                                    <p className="text-lg font-semibold">{appointment.appointment_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                    <div className="pt-1">
                                        <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                                    <div className="flex items-center pt-1">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Time</h3>
                                    <div className="flex items-center pt-1">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{appointment.appointment_time}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Reason for Appointment</h3>
                                    <p className="pt-1">{appointment.reason}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient and Doctor Information Card */}
                    <div className="space-y-6">
                        {/* Patient Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="mr-2 h-5 w-5" />
                                    Patient Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Patient ID</h3>
                                    <p>{appointment.patient.patient_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                                    <p>{appointment.patient.first_name} {appointment.patient.last_name}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Doctor Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Stethoscope className="mr-2 h-5 w-5" />
                                    Doctor Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Doctor ID</h3>
                                    <p>{appointment.doctor.doctor_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                                    <p>{appointment.doctor.first_name} {appointment.doctor.last_name}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Specialization</h3>
                                    <p className="capitalize">{appointment.doctor.specialization.replace(/-/g, ' ')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Additional Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDate(appointment.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDate(appointment.updated_at)}</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 p-4 bg-muted rounded-md">
                            <h4 className="font-medium mb-2">Appointment Notes</h4>
                            <p className="text-sm">
                                This appointment is scheduled between {appointment.patient.first_name} {appointment.patient.last_name} 
                                and Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}. 
                                Please ensure all necessary preparations are completed before the appointment time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}