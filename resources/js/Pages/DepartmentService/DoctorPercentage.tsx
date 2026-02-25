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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Heading from '@/components/heading';
import {
    Package,
    Search,
    Building2,
    Stethoscope,
    DollarSign,
    TrendingUp,
    ArrowLeft,
    Percent,
    Wallet,
    Activity,
    Calendar,
    CalendarDays,
    CalendarRange,
    User,
    Eye,
} from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Department {
    id: number;
    name: string;
}

interface ServiceWithDoctorPercentage {
    id: number;
    name: string;
    description: string | null;
    base_cost: string;
    fee_percentage: string;
    discount_percentage: string;
    doctor_percentage: string;
    final_cost: number;
    doctor_amount: number;
    is_active: boolean;
    department_id: number;
    doctor_id: number | null;
    department: Department;
    doctor: { id: number; full_name: string; specialization?: string | null } | null;
}

interface Summary {
    total_services: number;
    total_base_cost: number;
    total_final_cost: number;
    total_doctor_earnings: number;
}

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
}

interface AppointmentService {
    id: number;
    name: string;
    custom_cost: number;
    discount_percentage: number;
    final_cost: number;
    doctor_percentage: number;
    doctor_amount: number;
}

interface AppointmentItem {
    id: number;
    appointment_id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    fee: number;
    discount: number;
    grand_total: number;
    created_at: string;
    patient: Patient | null;
    services: AppointmentService[];
}

interface AppointmentsData {
    today: AppointmentItem[];
    monthly: AppointmentItem[];
    yearly: AppointmentItem[];
}

interface AppointmentStats {
    todayCount: number;
    monthlyCount: number;
    yearlyCount: number;
}

interface DoctorInfo {
    id: number;
    doctor_id: string;
    full_name: string;
    specialization: string;
    department?: { id: number; name: string } | null;
}

interface DoctorPercentagePageProps {
    services: ServiceWithDoctorPercentage[];
    departments: Department[];
    filters: {
        search: string;
        department: string;
        status: string;
        doctor: string;
    };
    summary: Summary;
    appointments: AppointmentsData;
    appointment_stats: AppointmentStats;
    doctor_info: DoctorInfo | null;
}

export default function DoctorPercentagePage({
    services,
    departments,
    filters,
    summary,
    appointments,
    appointment_stats,
    doctor_info,
}: DoctorPercentagePageProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeTab, setActiveTab] = useState('today');

    const filteredServices = services.filter(
        (service) =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.description &&
                service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            service.department.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const formatCurrency = (amount: string | number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) {
            return '؋0.00';
        }
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `؋${num.toFixed(2)}`;
    };

    const handleFilterChange = (key: string, value: string) => {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.location.href = url.toString();
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('search', searchTerm);
        window.location.href = url.toString();
    };

    // Compute totals from filtered services for live footer
    const filteredBaseCost = filteredServices.reduce((sum, s) => sum + parseFloat(s.base_cost), 0);
    const filteredFinalCost = filteredServices.reduce((sum, s) => sum + s.final_cost, 0);
    const filteredDoctorEarnings = filteredServices.reduce((sum, s) => sum + s.doctor_amount, 0);
    const filteredHospitalEarnings = filteredFinalCost - filteredDoctorEarnings;

    // Get the filtered doctor name for the header (if filtered by doctor)
    const filteredDoctorName = doctor_info
        ? `Dr. ${doctor_info.full_name}`
        : filters.doctor && filteredServices.length > 0 && filteredServices[0].doctor
            ? `Dr. ${filteredServices[0].doctor.full_name}`
            : null;

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled': return 'secondary';
            case 'completed': return 'default';
            case 'cancelled': return 'destructive';
            case 'rescheduled': return 'outline';
            default: return 'outline';
        }
    };

    const renderAppointmentTable = (appointmentList: AppointmentItem[]) => {
        // Filter to only show appointments where at least one service has a doctor percentage or amount
        const filteredAppointments = appointmentList.filter(appt => 
            appt.services.some(svc => svc.doctor_percentage > 0 || svc.doctor_amount > 0)
        );

        if (filteredAppointments.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p className="text-lg">No appointments with services found</p>
                    <p className="text-sm">There are no appointments with services for this period.</p>
                </div>
            );
        }
        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Appointment ID</TableHead>
                            <TableHead className="font-semibold">Patient</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Services</TableHead>
                            <TableHead className="font-semibold text-right">Discount</TableHead>
                            <TableHead className="font-semibold text-right">Total</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAppointments.map((appt) => (
                            <TableRow key={appt.id} className="hover:bg-muted/50 transition-colors align-top">
                                <TableCell className="font-medium pt-3">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        {appt.appointment_id}
                                    </Badge>
                                </TableCell>
                                <TableCell className="pt-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <span className="font-medium block">{appt.patient?.full_name ?? '—'}</span>
                                            <span className="text-xs text-muted-foreground">{appt.patient?.patient_id ?? ''}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="pt-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm">
                                            {new Date(appt.created_at).toLocaleString('en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </TableCell>
                                {/* Services list */}
                                <TableCell className="pt-2">
                                    <div className="space-y-1">
                                        {appt.services.map((svc) => (
                                            <div key={svc.id} className="flex items-center justify-between gap-3 bg-purple-50 rounded px-2 py-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Package className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                                    <span className="text-xs font-medium text-purple-800">{svc.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                                    <span>؋{svc.custom_cost.toFixed(2)}</span>
                                                    {svc.discount_percentage > 0 && (
                                                        <span className="text-red-500">-{svc.discount_percentage}%</span>
                                                    )}
                                                    <span className="font-semibold text-emerald-600">= ؋{svc.final_cost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pt-3">
                                    {appt.discount > 0 ? (
                                        <span className="font-medium text-red-600">-؋{appt.discount.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pt-3">
                                    <span className="font-semibold text-emerald-600">؋{appt.grand_total.toFixed(2)}</span>
                                </TableCell>
                                <TableCell className="pt-3">
                                    <Badge variant={getStatusBadgeVariant(appt.status)} className="capitalize">
                                        {appt.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pt-3">
                                    <Link href={`/appointments/${appt.id}`}>
                                        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-600 hover:border-green-600">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <Head title="Doctor Percentage Report" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title={filteredDoctorName ? `${filteredDoctorName}'s Service Percentages` : 'Doctor Percentage Report'} />
                        <p className="text-sm text-muted-foreground mt-1">
                            {filteredDoctorName
                                ? `Services and earnings breakdown for ${filteredDoctorName}`
                                : 'Services with assigned doctor percentages and earnings breakdown'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {filters.doctor && filteredServices.length > 0 && filteredServices[0].doctor && (
                            <Link href={`/doctors/${filteredServices[0].doctor.id}`}>
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Doctor
                                </Button>
                            </Link>
                        )}
                        <Link href="/departments/services/list">
                            <Button variant="outline">
                                <Package className="mr-2 h-4 w-4" />
                                All Services
                            </Button>
                        </Link>
                        <Link href="/departments">
                            <Button variant="outline">
                                <Building2 className="mr-2 h-4 w-4" />
                                Departments
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Services with Doctor %</p>
                                    <p className="text-2xl font-bold text-purple-600">{summary.total_services}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Stethoscope className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Base Cost</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.total_base_cost)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Doctor Earnings</p>
                                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.total_doctor_earnings)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <Percent className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Overview Card */}
                <Card className="mb-6 border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Financial Overview
                            {filters.doctor && filteredDoctorName && (
                                <Badge className="ml-2 bg-purple-100 text-purple-700 border-purple-300">
                                    {filteredDoctorName}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Base Cost */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Wallet className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Base Cost</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(filteredBaseCost)}</p>
                                <p className="text-xs text-muted-foreground mt-1">{filteredServices.length} services</p>
                            </div>

                            {/* Total Final Cost */}
                            <div className="bg-emerald-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Final Cost</p>
                                </div>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(filteredFinalCost)}</p>
                                <p className="text-xs text-muted-foreground mt-1">After fees & discounts</p>
                            </div>

                            {/* Doctor Earnings */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Percent className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Doctor Earnings</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">{formatCurrency(filteredDoctorEarnings)}</p>
                                <p className="text-xs text-muted-foreground mt-1">From base cost %</p>
                            </div>

                            {/* Hospital Earnings */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Hospital Earnings</p>
                                </div>
                                <p className="text-2xl font-bold text-amber-600">{formatCurrency(filteredHospitalEarnings)}</p>
                                <p className="text-xs text-muted-foreground mt-1">Final cost − doctor earnings</p>
                            </div>
                        </div>

                        {/* Breakdown Row */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Total Base Cost</p>
                                <p className="text-xl font-bold text-slate-700">{formatCurrency(filteredBaseCost)}</p>
                                <p className="text-xs text-muted-foreground">{filteredServices.length} services</p>
                            </div>
                            <div className="text-center border-l border-r border-border">
                                <p className="text-sm text-muted-foreground mb-1">Doctor Earnings</p>
                                <p className="text-xl font-bold text-purple-600">{formatCurrency(filteredDoctorEarnings)}</p>
                                <p className="text-xs text-muted-foreground">From assigned percentages</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Hospital Earnings</p>
                                <p className="text-xl font-bold text-emerald-600">{formatCurrency(filteredHospitalEarnings)}</p>
                                <p className="text-xs text-muted-foreground">Remaining after doctor %</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointment Tabs — only shown when filtered by a specific doctor */}
                {filters.doctor && (
                    <>
                        {/* Appointment Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                                            <p className="text-2xl font-bold text-blue-600">{appointment_stats.todayCount}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <Calendar className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                            <p className="text-2xl font-bold text-green-600">{appointment_stats.monthlyCount}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <CalendarDays className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">This Year</p>
                                            <p className="text-2xl font-bold text-purple-600">{appointment_stats.yearlyCount}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <CalendarRange className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Appointment History Tabs */}
                        <Card className="shadow-lg border-border/50 mb-6">
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Appointment History
                                    {filteredDoctorName && (
                                        <Badge className="ml-2 bg-blue-100 text-blue-700 border-blue-300">
                                            {filteredDoctorName}
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0">
                                        <TabsTrigger
                                            value="today"
                                            className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                        >
                                            <Calendar className="mr-2 h-4 w-4" />
                                            Today ({appointment_stats.todayCount})
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="monthly"
                                            className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            This Month ({appointment_stats.monthlyCount})
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="yearly"
                                            className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                        >
                                            <CalendarRange className="mr-2 h-4 w-4" />
                                            This Year ({appointment_stats.yearlyCount})
                                        </TabsTrigger>
                                    </TabsList>
                                    <div className="p-4">
                                        <TabsContent value="today" className="mt-0">
                                            {renderAppointmentTable(appointments.today)}
                                        </TabsContent>
                                        <TabsContent value="monthly" className="mt-0">
                                            {renderAppointmentTable(appointments.monthly)}
                                        </TabsContent>
                                        <TabsContent value="yearly" className="mt-0">
                                            {renderAppointmentTable(appointments.yearly)}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Main Table Card */}
                <Card className="shadow-lg border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-purple-600" />
                                Services with Doctor Percentage
                                <Badge variant="outline" className="ml-2">
                                    {filteredServices.length} services
                                </Badge>
                            </CardTitle>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                <select
                                    value={filters.department || ''}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative w-full sm:w-80 mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search services..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Service Name</TableHead>
                                        <TableHead className="font-semibold">Department</TableHead>
                                        <TableHead className="font-semibold">Assigned Doctor</TableHead>
                                        <TableHead className="font-semibold text-right">Base Cost</TableHead>
                                        <TableHead className="font-semibold text-right">Fee %</TableHead>
                                        <TableHead className="font-semibold text-right">Discount %</TableHead>
                                        <TableHead className="font-semibold text-right">Final Cost</TableHead>
                                        <TableHead className="font-semibold text-center">Doctor %</TableHead>
                                        <TableHead className="font-semibold text-right">Doctor Earnings</TableHead>
                                        <TableHead className="font-semibold text-right">Hospital Earnings</TableHead>
                                        <TableHead className="font-semibold text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map((service) => {
                                            const baseCost = parseFloat(service.base_cost);
                                            const doctorPct = parseFloat(service.doctor_percentage);
                                            const doctorEarning = service.doctor_amount;
                                            const hospitalEarning = service.final_cost - doctorEarning;

                                            return (
                                                <TableRow
                                                    key={service.id}
                                                    className="hover:bg-muted/50 transition-colors"
                                                >
                                                    {/* Service Name */}
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Package className="h-4 w-4 text-purple-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{service.name}</p>
                                                                {service.description && (
                                                                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                                                        {service.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Department */}
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                                                            </div>
                                                            <span className="text-sm font-medium">{service.department.name}</span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Assigned Doctor */}
                                                    <TableCell>
                                                        {service.doctor ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-7 w-7 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                                    <Stethoscope className="h-3.5 w-3.5 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium">Dr. {service.doctor.full_name}</p>
                                                                    {service.doctor.specialization && (
                                                                        <p className="text-xs text-muted-foreground">{service.doctor.specialization}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Base Cost */}
                                                    <TableCell className="text-right">
                                                        <span className="font-medium">؋{baseCost.toFixed(2)}</span>
                                                    </TableCell>

                                                    {/* Fee % */}
                                                    <TableCell className="text-right">
                                                        <span className="text-sm text-muted-foreground">
                                                            {parseFloat(service.fee_percentage).toFixed(2)}%
                                                        </span>
                                                    </TableCell>

                                                    {/* Discount % */}
                                                    <TableCell className="text-right">
                                                        <span className="text-sm text-muted-foreground">
                                                            {parseFloat(service.discount_percentage).toFixed(2)}%
                                                        </span>
                                                    </TableCell>

                                                    {/* Final Cost */}
                                                    <TableCell className="text-right">
                                                        <span className="font-semibold text-emerald-600">
                                                            ؋{service.final_cost.toFixed(2)}
                                                        </span>
                                                    </TableCell>

                                                    {/* Doctor % */}
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-purple-700 border-purple-300 bg-purple-50 font-semibold"
                                                        >
                                                            {doctorPct.toFixed(2)}%
                                                        </Badge>
                                                    </TableCell>

                                                    {/* Doctor Earnings */}
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-purple-600">
                                                            ؋{doctorEarning.toFixed(2)}
                                                        </span>
                                                    </TableCell>

                                                    {/* Hospital Earnings */}
                                                    <TableCell className="text-right">
                                                        <span className="font-bold text-amber-600">
                                                            ؋{hospitalEarning.toFixed(2)}
                                                        </span>
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={service.is_active ? 'default' : 'secondary'}
                                                            className="capitalize"
                                                        >
                                                            {service.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Stethoscope className="h-8 w-8 text-muted-foreground/50" />
                                                    <p className="font-medium">No services found</p>
                                                    <p className="text-sm">
                                                        No services have a doctor percentage assigned yet.
                                                    </p>
                                                    <Link href="/departments">
                                                        <Button variant="outline" size="sm" className="mt-2">
                                                            Go to Departments to add one
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer Totals */}
                        {filteredServices.length > 0 && (
                            <div className="border-t bg-muted/30 p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing{' '}
                                        <strong className="text-foreground">{filteredServices.length}</strong>{' '}
                                        of{' '}
                                        <strong className="text-foreground">{services.length}</strong>{' '}
                                        services
                                    </p>
                                    <div className="flex flex-wrap gap-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Base Cost:</span>
                                            <span className="font-semibold text-blue-600">{formatCurrency(filteredBaseCost)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Final Cost:</span>
                                            <span className="font-semibold text-emerald-600">{formatCurrency(filteredFinalCost)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Doctor Earnings:</span>
                                            <span className="font-bold text-purple-600">{formatCurrency(filteredDoctorEarnings)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">Hospital Earnings:</span>
                                            <span className="font-bold text-amber-600">{formatCurrency(filteredHospitalEarnings)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
