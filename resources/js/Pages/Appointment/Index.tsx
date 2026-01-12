import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Calendar, User, Stethoscope, PlusCircle, Search } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

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
    patient: Patient;
    doctor: Doctor;
}

interface AppointmentIndexProps {
    appointments: {
        data: Appointment[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
}

export default function AppointmentIndex({ appointments }: AppointmentIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAppointments = appointments.data.filter(appointment =>
        appointment.appointment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctor.doctor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${appointment.patient.first_name} ${appointment.patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${appointment.doctor.first_name} ${appointment.doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );



    const formatDateTime = (dateString: string, timeString: string) => {
        const date = new Date(`${dateString}T${timeString}`);
        return date.toLocaleString('en-US', {
            weekday: 'short',
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
            <div className="space-y-6">
                <Head title="Appointments" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Appointment Management" />
                    
                    <Link href="/appointments/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Schedule New Appointment
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointments List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search appointments..."
                                    className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Appointment ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Doctor</TableHead>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reason</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAppointments.length > 0 ? (
                                        filteredAppointments.map((appointment) => (
                                            <TableRow key={appointment.id}>
                                                <TableCell className="font-medium">
                                                    {appointment.appointment_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {appointment.patient.first_name} {appointment.patient.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Stethoscope className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {appointment.doctor.first_name} {appointment.doctor.last_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(appointment.status)}>
                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={appointment.reason}>
                                                        {appointment.reason}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/appointments/${appointment.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/appointments/${appointment.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No appointments found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {appointments.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{appointments.meta?.from || 0}</strong> to <strong>{appointments.meta?.to || 0}</strong> of{' '}
                                <strong>{appointments.meta?.total || 0}</strong> appointments
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(appointments.meta?.current_page) || appointments.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/appointments?page=${(appointments.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(appointments.meta?.current_page) || appointments.meta?.current_page >= (appointments.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/appointments?page=${(appointments.meta?.current_page || 1) + 1}`}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}