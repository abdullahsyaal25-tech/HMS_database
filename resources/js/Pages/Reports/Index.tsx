import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, Pill, FlaskConical } from 'lucide-react';
import { Link } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';

export default function ReportsIndex() {
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Reports" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Reports Dashboard</h1>
                        <p className="text-gray-600 mt-2">Generate and view various reports for the hospital</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/reports/patients" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Patient Reports</CardTitle>
                                            <CardDescription>View patient statistics and information</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/reports/doctors" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <User className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Doctor Reports</CardTitle>
                                            <CardDescription>View doctor schedules and performance</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/reports/appointments" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-yellow-100 p-2 rounded-full">
                                            <Calendar className="h-5 w-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Appointment Reports</CardTitle>
                                            <CardDescription>View appointment statistics and trends</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/reports/pharmacy-sales" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-purple-100 p-2 rounded-full">
                                            <Pill className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Pharmacy Sales Reports</CardTitle>
                                            <CardDescription>View pharmacy sales and inventory reports</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/reports/lab-test" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-indigo-100 p-2 rounded-full">
                                            <FlaskConical className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Lab Test Reports</CardTitle>
                                            <CardDescription>View laboratory test reports and results</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        View Report
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