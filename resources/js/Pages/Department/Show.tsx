import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    Building, Phone, MapPin, Users, ArrowLeft, Pencil, Trash2,
    Calendar, Stethoscope, Plus, Activity, Edit
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Department, DepartmentService, DoctorBasic } from '@/types/department';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DepartmentShowProps {
    department: Department;
    doctors: DoctorBasic[];
}

export default function DepartmentShow({ department, doctors }: DepartmentShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<DepartmentService | null>(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        name: '',
        description: '',
        base_cost: '',
        discount_percentage: '',
        doctor_percentage: '',
        doctor_id: null as number | null,
        is_active: true,
    });

    const openAddServiceModal = () => {
        setEditingService(null);
        reset();
        setIsServiceModalOpen(true);
    };

    const openEditServiceModal = (service: DepartmentService) => {
        setEditingService(service);
        setData({
            name: service.name,
            description: service.description || '',
            base_cost: service.base_cost.toString() || '',
            discount_percentage: service.discount_percentage ? service.discount_percentage.toString() : '',
            doctor_percentage: service.doctor_percentage ? service.doctor_percentage.toString() : '',
            doctor_id: service.doctor_id ?? null,
            is_active: service.is_active,
        });
        setIsServiceModalOpen(true);
    };

    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            put(route('departments.services.update', editingService.id), {
                onSuccess: () => {
                    setIsServiceModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('departments.services.store', department.id), {
                onSuccess: () => {
                    setIsServiceModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDeleteService = (service: DepartmentService) => {
        if (confirm(`Are you sure you want to remove the service "${service.name}"?`)) {
            router.delete(route('departments.services.destroy', service.id));
        }
    };

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
        if (confirm(`Are you sure you want to delete ${department.name}? This action cannot be undone.`)) {
            setIsDeleting(true);
            router.post(`/departments/${department.id}`, {
                _method: 'DELETE',
            }, {
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Department Details - ${department.department_id}`} />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={department.name} />
                            <p className="text-sm text-muted-foreground mt-1">
                                Department ID: <span className="font-mono font-semibold text-blue-600">{department.department_id}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={`/departments/${department.id}/edit`}>
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
                            <Link href="/departments">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Information Card */}
                        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Building className="h-5 w-5 text-blue-600" />
                                    </div>
                                    Department Information
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Department details and contact information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department ID</p>
                                        <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                            {department.department_id}
                                        </Badge>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department Name</p>
                                        <p className="text-base font-semibold">{department.name}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Head Doctor</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Users className="h-3.5 w-3.5 text-green-600" />
                                            </div>
                                            <span className="text-base">{department.head_doctor_name || 'Not assigned'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                            Active
                                        </Badge>
                                    </div>
                                </div>

                                {department.description && (
                                    <div className="border-t pt-4">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
                                        <div className="bg-muted/40 rounded-lg p-4">
                                            <p className="text-base leading-relaxed">{department.description}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <Phone className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                                                <p className="text-base">{department.phone || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                                                <p className="text-base">{department.address || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Timeline Card */}
                            <Card className="shadow-lg border-l-4 border-l-green-500">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-green-600" />
                                        </div>
                                        Timeline
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                                        <p className="text-sm font-medium">{formatDate(department.created_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</p>
                                        <p className="text-sm font-medium">{formatDateTime(department.updated_at)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions Card */}
                            <Card className="shadow-lg border-l-4 border-l-purple-500">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                                            <Activity className="h-4 w-4 text-purple-600" />
                                        </div>
                                        Quick Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 pt-4">
                                    <Link href={`/doctors?department_id=${department.id}`} className="block">
                                        <Button variant="outline" size="sm" className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                                            <Stethoscope className="mr-2 h-4 w-4" />
                                            View Doctors
                                        </Button>
                                    </Link>
                                    <Link href={`/appointments?department_id=${department.id}`} className="block">
                                        <Button variant="outline" size="sm" className="w-full justify-start hover:bg-green-50 hover:text-green-700 hover:border-green-300">
                                            <Calendar className="mr-2 h-4 w-4" />
                                            View Appointments
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                                        onClick={openAddServiceModal}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add New Service
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Services Management Section */}
                    <Card className="shadow-lg border-t-4 border-t-indigo-500">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                        <Activity className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    Services Offered
                                </CardTitle>
                                <CardDescription className="text-base mt-1">
                                    Manage services and pricing for this department
                                </CardDescription>
                            </div>
                            <Button
                                size="sm"
                                onClick={openAddServiceModal}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Service
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableHead className="font-semibold">Service Name</TableHead>
                                            <TableHead className="font-semibold">Assigned Doctor</TableHead>
                                            <TableHead className="font-semibold">Base Cost</TableHead>
                                            <TableHead className="font-semibold">Fee (%)</TableHead>
                                            <TableHead className="font-semibold">Discount (%)</TableHead>
                                            <TableHead className="font-semibold">Doctor %</TableHead>
                                            <TableHead className="font-semibold">Final Cost</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="text-right font-semibold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {department.services && department.services.length > 0 ? (
                                            department.services.map((service) => (
                                                <TableRow key={service.id} className="hover:bg-indigo-50/50 transition-colors">
                                                    <TableCell className="font-medium">
                                                        <div>
                                                            <p className="font-semibold">{service.name}</p>
                                                            {service.description && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                    {service.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {service.doctor ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                    <Stethoscope className="h-3 w-3 text-blue-500" />
                                                                </div>
                                                                <span className="text-sm">Dr. {service.doctor.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs italic">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">؋{service.base_cost}</TableCell>
                                                    <TableCell>{service.fee_percentage}%</TableCell>
                                                    <TableCell>{service.discount_percentage}%</TableCell>
                                                    <TableCell>
                                                        {service.doctor_percentage > 0 ? (
                                                            <Badge variant="outline" className="text-purple-700 border-purple-300 bg-purple-50">
                                                                {service.doctor_percentage}%
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-green-700">
                                                        ؋{service.final_cost}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={service.is_active
                                                                ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                                                : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                                                            }
                                                        >
                                                            {service.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-700"
                                                                onClick={() => openEditServiceModal(service)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                                                                onClick={() => handleDeleteService(service)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-32 text-center">
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <Activity className="h-8 w-8 opacity-30" />
                                                        <p>No services defined for this department</p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={openAddServiceModal}
                                                            className="mt-1"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Add First Service
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Add/Edit Modal */}
                    <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                        <Activity className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    {editingService ? 'Edit Service' : 'Add New Service'}
                                </DialogTitle>
                                <DialogDescription>
                                    Set the service details and pricing information.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleServiceSubmit}>
                                <div className="grid gap-2 py-4">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="name">Service Name</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Consultation, Surgery, etc."
                                            required
                                        />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Brief description of the service"
                                            className="resize-none max-h-24"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="base_cost">Base Cost (؋) *</Label>
                                            <Input
                                                id="base_cost"
                                                type="number"
                                                step="0.01"
                                                value={data.base_cost}
                                                onChange={(e) => setData('base_cost', e.target.value)}
                                                placeholder="Enter base cost"
                                                required
                                            />
                                            {errors.base_cost && <p className="text-xs text-red-500">{errors.base_cost}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="is_active">Status</Label>
                                            <div className="flex items-center space-x-2 pt-1.5">
                                                <Switch
                                                    id="is_active"
                                                    checked={data.is_active}
                                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                                />
                                                <Label htmlFor="is_active" className="cursor-pointer">{data.is_active ? 'Active' : 'Inactive'}</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-2 space-y-2">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-1">Optional Pricing</h3>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="discount_percentage" className="flex items-center gap-1 text-sm">
                                                    Discount (%)
                                                    <span className="text-xs text-muted-foreground font-normal">opt</span>
                                                </Label>
                                                <Input
                                                    id="discount_percentage"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={data.discount_percentage}
                                                    onChange={(e) => setData('discount_percentage', e.target.value)}
                                                    placeholder="0"
                                                />
                                                {errors.discount_percentage && <p className="text-xs text-red-500">{errors.discount_percentage}</p>}
                                            </div>

                                            <div className="grid gap-1.5">
                                                <Label htmlFor="doctor_percentage" className="flex items-center gap-1 text-sm">
                                                    Doctor Share (%)
                                                    <span className="text-xs text-muted-foreground font-normal">opt</span>
                                                </Label>
                                                <Input
                                                    id="doctor_percentage"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={data.doctor_percentage}
                                                    onChange={(e) => setData('doctor_percentage', e.target.value)}
                                                    placeholder="0"
                                                />
                                                {errors.doctor_percentage && <p className="text-xs text-red-500">{errors.doctor_percentage}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-2 space-y-2">
                                        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-1">Doctor Assignment</h3>
                                        
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="doctor_id" className="flex items-center gap-1 text-sm">
                                                Assign Doctor
                                                <span className="text-xs text-muted-foreground font-normal">opt</span>
                                            </Label>
                                            <select
                                                id="doctor_id"
                                                value={data.doctor_id ?? ''}
                                                onChange={(e) => setData('doctor_id', e.target.value ? parseInt(e.target.value) : null)}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            >
                                                <option value="">— Select a doctor —</option>
                                                {doctors.map((doctor) => (
                                                    <option key={doctor.id} value={doctor.id}>
                                                        Dr. {doctor.full_name}{doctor.specialization ? ` (${doctor.specialization})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.doctor_id && <p className="text-xs text-red-500">{errors.doctor_id}</p>}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 mt-2 space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-medium text-slate-700">Base Cost:</span>
                                            <span className="text-base font-bold text-indigo-700">
                                                ؋{data.base_cost ? parseFloat(data.base_cost.toString()).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        {data.discount_percentage && parseFloat(data.discount_percentage.toString()) > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Discount ({data.discount_percentage}%):</span>
                                                <span className="text-green-600 font-medium">
                                                    -؋{(parseFloat(data.base_cost?.toString() || '0') * parseFloat(data.discount_percentage.toString()) / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-indigo-200 pt-1.5 flex justify-between items-center">
                                            <span className="text-xs font-semibold text-slate-900">Final Cost:</span>
                                            <span className="text-base font-bold text-indigo-700">
                                                ؋{(parseFloat(data.base_cost?.toString() || '0') - (data.discount_percentage ? parseFloat(data.base_cost?.toString() || '0') * parseFloat(data.discount_percentage.toString()) / 100 : 0)).toFixed(2)}
                                            </span>
                                        </div>
                                        {data.doctor_percentage && parseFloat(data.doctor_percentage.toString()) > 0 && (
                                            <div className="border-t border-indigo-200 pt-1.5 flex justify-between items-center bg-purple-100/50 rounded p-1.5">
                                                <span className="text-xs font-medium text-purple-700">Doctor Share ({data.doctor_percentage}%):</span>
                                                <span className="text-sm font-bold text-purple-700">
                                                    ؋{(parseFloat(data.base_cost?.toString() || '0') * parseFloat(data.doctor_percentage.toString()) / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                    >
                                        {editingService ? 'Save Changes' : 'Add Service'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </HospitalLayout>
    );
}
