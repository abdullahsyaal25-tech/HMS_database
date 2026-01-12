import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Phone, MapPin, User, ArrowLeft, Pencil, FileText } from 'lucide-react';

interface User {
    id: number;
    name: string;
    username: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    phone: string;
    address: string;
    created_at: string;
    updated_at: string;
    user: User;
}

interface DoctorShowProps {
    doctor: Doctor;
}

export default function DoctorShow({ doctor }: DoctorShowProps) {
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
            <Head title={`Doctor Details - ${doctor.doctor_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Doctor: ${doctor.doctor_id}`} />
                    
                    <div className="flex space-x-2">
                        <Link href={`/doctors/${doctor.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Link href="/doctors">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Doctors
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Doctor Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Doctor ID</h3>
                                    <p className="text-lg font-semibold">{doctor.doctor_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                                    <p className="text-lg">Dr. {doctor.first_name} {doctor.last_name}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Specialization</h3>
                                    <div className="pt-1">
                                        <Badge variant="outline" className="capitalize">
                                            {doctor.specialization.replace(/-/g, ' ')}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                                    <p>{doctor.user.username}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-2">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                                    <div className="flex items-center pt-1">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{doctor.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                                    <div className="flex items-start pt-1">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span>{doctor.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Doctor Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDate(doctor.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDate(doctor.updated_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                                <Badge variant="outline">Active</Badge>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Related Actions</h3>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <Link href={`/appointments?doctor_id=${doctor.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Appointments
                                        </Button>
                                    </Link>
                                    
                                    <Link href={`/billing?doctor_id=${doctor.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Billing
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
                            <p>This doctor profile contains all relevant medical expertise and contact information. 
                            Healthcare providers can use this information to coordinate care and maintain 
                            accurate records.</p>
                            
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-medium mb-2">Specialization Details</h4>
                                <p className="text-sm capitalize">
                                    {doctor.specialization.replace(/-/g, ' ')} - Dr. {doctor.first_name} {doctor.last_name} 
                                    specializes in {doctor.specialization.replace(/-/g, ' ')} and has been serving patients 
                                    since joining our healthcare team.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}