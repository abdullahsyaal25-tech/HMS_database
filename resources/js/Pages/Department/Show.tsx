import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Building, Phone, Mail, MapPin, Users, ArrowLeft, Pencil, FileText } from 'lucide-react';

interface Department {
    id: number;
    department_id: string;
    name: string;
    description: string;
    head_doctor_id: number;
    head_doctor_name: string;
    phone: string;
    email: string;
    address: string;
    created_at: string;
    updated_at: string;
}

interface DepartmentShowProps {
    department: Department;
}

export default function DepartmentShow({ department }: DepartmentShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <>
            <Head title={`Department Details - ${department.department_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Department: ${department.department_id}`} />
                    
                    <div className="flex space-x-2">
                        <Link href={`/departments/${department.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Link href="/departments">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Departments
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Department Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Building className="mr-2 h-5 w-5" />
                                Department Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Department ID</h3>
                                    <p className="text-lg font-semibold">{department.department_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Department Name</h3>
                                    <p className="text-lg">{department.name}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Head Doctor</h3>
                                    <div className="flex items-center pt-1">
                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{department.head_doctor_name}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                                    <div className="flex items-center pt-1">
                                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{department.email || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-2">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                                    <p className="pt-1">{department.description || 'No description provided'}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                                    <div className="flex items-center pt-1">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{department.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                                    <div className="flex items-start pt-1">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span>{department.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Department Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Department Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDate(department.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDate(department.updated_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                                <Badge variant="outline">Active</Badge>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Related Actions</h3>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <Link href={`/doctors?department_id=${department.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Doctors
                                        </Button>
                                    </Link>
                                    
                                    <Link href={`/appointments?department_id=${department.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Appointments
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none">
                            <p>This department profile contains all relevant information about the department's operations, 
                            staff, and contact details. Healthcare administrators can use this information to coordinate 
                            departmental activities and maintain accurate records.</p>
                            
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-medium mb-2">Department Overview</h4>
                                <p className="text-sm">
                                    {department.name} is led by {department.head_doctor_name} and serves as a key 
                                    department within our healthcare facility. The department handles {department.description || 'various medical services'}.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}