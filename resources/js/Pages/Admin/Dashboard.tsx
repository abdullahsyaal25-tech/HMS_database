import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Settings, KeyRound } from 'lucide-react';
import { Link } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';

export default function AdminDashboard() {
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Admin Dashboard" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage system settings users and permissions</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/admin/users" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">User Management</CardTitle>
                                        <CardDescription>Manage system users and roles</CardDescription>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="outline" className="w-full">
                                        Manage Users
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Card className="opacity-50 cursor-not-allowed">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-lg">System Settings</CardTitle>
                                    <CardDescription>Configure system-wide settings</CardDescription>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <Settings className="h-6 w-6 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" disabled>
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="opacity-50 cursor-not-allowed">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-lg">Security</CardTitle>
                                    <CardDescription>Manage security settings</CardDescription>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <Shield className="h-6 w-6 text-yellow-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" disabled>
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                        
                        <Card className="opacity-50 cursor-not-allowed">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="text-lg">Permissions</CardTitle>
                                    <CardDescription>Manage user permissions</CardDescription>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <KeyRound className="h-6 w-6 text-purple-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" disabled>
                                    Coming Soon
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Administrative Functions</h2>
                        <p className="text-gray-600 mb-4">
                            As an administrator, you have access to advanced system management features including 
                            user management, role assignments, and system configuration.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="/admin/users">
                                <Button>Go to User Management</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}