import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';
import { Link } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';

export default function Dashboard() {
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Dashboard" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
                        <p className="text-gray-600 mt-2">Welcome to the Hospital Management System</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/patients" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">Patients</CardTitle>
                                        <CardDescription>Manage patient records</CardDescription>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Hospital className="h-6 w-6 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Patients
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/doctors" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">Doctors</CardTitle>
                                        <CardDescription>Manage doctor information</CardDescription>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <Hospital className="h-6 w-6 text-green-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Doctors
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/appointments" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">Appointments</CardTitle>
                                        <CardDescription>Schedule and manage appointments</CardDescription>
                                    </div>
                                    <div className="bg-yellow-100 p-3 rounded-full">
                                        <Hospital className="h-6 w-6 text-yellow-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Appointments
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/billing" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">Billing</CardTitle>
                                        <CardDescription>Manage billing and payments</CardDescription>
                                    </div>
                                    <div className="bg-red-100 p-3 rounded-full">
                                        <Hospital className="h-6 w-6 text-red-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Billing
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/pharmacy/medicines" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Pharmacy</CardTitle>
                                    <CardDescription>Manage medicines and inventory</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Pharmacy
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/laboratory/lab-tests" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Laboratory</CardTitle>
                                    <CardDescription>Manage lab tests and results</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Laboratory
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/departments" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">Departments</CardTitle>
                                    <CardDescription>Manage hospital departments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Departments
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}