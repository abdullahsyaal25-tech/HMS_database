import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';

export default function PatientReportIndex() {
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Patient Reports" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Patient Reports</h1>
                        <p className="text-gray-600 mt-2">View and generate patient-related reports</p>
                    </div>
                    
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-full">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Patient Report</CardTitle>
                                    <CardDescription>Generate patient statistics and information reports</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">This section allows you to generate various patient reports including:</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                <li>Patient demographics</li>
                                <li>Appointment history</li>
                                <li>Medical history</li>
                                <li>Treatment reports</li>
                                <li>Payment history</li>
                            </ul>
                            <div className="pt-4">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Generate Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}