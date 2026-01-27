import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Building, Phone, Mail, MapPin, Users, ArrowLeft, Pencil, Trash2, Calendar, Stethoscope } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';

interface Department {
    id: number;
    department_id: string;
    name: string;
    description?: string | null;
    head_doctor_id?: number | null;
    head_doctor_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    created_at: string;
    updated_at: string;
}

interface DepartmentShowProps {
    department: Department;
}

export default function DepartmentShow({ department }: DepartmentShowProps) {
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
        if (confirm(`Are you sure you want to delete ${department.name}? This action cannot be undone.`)) {
            setIsDeleting(true);
            router.delete(`/departments/${department.id}`, {
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Department Details - ${department.department_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title={department.name} />
                        <p className="text-sm text-muted-foreground mt-1">Department ID: {department.department_id}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/departments/${department.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        
                        <Link href="/departments">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Departments
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                Department Information
                            </CardTitle>
                            <CardDescription>
                                Department details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Department ID</p>
                                    <p className="text-base font-semibold">{department.department_id}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Department Name</p>
                                    <p className="text-base">{department.name}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Head Doctor</p>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-base">{department.head_doctor_name || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-base">{department.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {department.description && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                    <p className="text-base text-muted-foreground">{department.description}</p>
                                </div>
                            )}
                            
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                            <p className="text-base">{department.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                                            <p className="text-base">{department.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar Cards */}
                    <div className="space-y-6">
                        {/* Timeline Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-sm">{formatDate(department.created_at)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDateTime(department.updated_at)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Active
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/doctors?department_id=${department.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Stethoscope className="mr-2 h-4 w-4" />
                                        View Doctors
                                    </Button>
                                </Link>
                                
                                <Link href={`/appointments?department_id=${department.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        View Appointments
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}