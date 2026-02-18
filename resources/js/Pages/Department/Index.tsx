import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Building, Users, Phone, PlusCircle, Search, Eye, Pencil, Trash2, Activity, Building2 } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Department } from '@/types/department';

interface DepartmentIndexProps {
    departments: {
        data: Department[];
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

export default function DepartmentIndex({ departments }: DepartmentIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filteredDepartments = departments.data.filter(department => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (department.department_id?.toLowerCase() || '').includes(searchLower) ||
            (department.name?.toLowerCase() || '').includes(searchLower) ||
            (department.description?.toLowerCase() || '').includes(searchLower) ||
            (department.head_doctor_name?.toLowerCase() || '').includes(searchLower)
        );
    });

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            setDeletingId(id);
            router.post(`/departments/${id}`, {
                _method: 'DELETE',
            }, {
                onFinish: () => setDeletingId(null),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title="Departments" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Departments" />
                            <p className="text-sm text-muted-foreground mt-1">
                                Manage hospital departments and their information
                            </p>
                        </div>
                        <Link href="/departments/create">
                            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-white">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Department
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="shadow-md border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Departments</p>
                                        <p className="text-2xl font-bold text-blue-700">{departments.meta?.total || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-md border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Activity className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Active</p>
                                        <p className="text-2xl font-bold text-green-700">{departments.meta?.total || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-md border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">This Page</p>
                                        <p className="text-2xl font-bold text-purple-700">{filteredDepartments.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Table Card */}
                    <Card className="shadow-lg border-t-4 border-t-blue-500">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Building className="h-6 w-6 text-blue-600" />
                                        All Departments
                                    </CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        View and manage all hospital departments
                                    </CardDescription>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search departments..."
                                        className="pl-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-b-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                                <TableHead className="w-[60px] font-semibold">#</TableHead>
                                                <TableHead className="font-semibold">Department</TableHead>
                                                <TableHead className="font-semibold">Description</TableHead>
                                                <TableHead className="font-semibold">Head Doctor</TableHead>
                                                <TableHead className="font-semibold">Services</TableHead>
                                                <TableHead className="font-semibold">Contact</TableHead>
                                                <TableHead className="font-semibold">Status</TableHead>
                                                <TableHead className="text-right font-semibold">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDepartments.length > 0 ? (
                                                filteredDepartments.map((department, index) => (
                                                    <TableRow key={department.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <TableCell className="font-medium text-muted-foreground">
                                                            {(departments.meta?.from || 1) + index}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                                    <Building className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold">{department.name}</p>
                                                                    <p className="text-xs text-muted-foreground font-mono">{department.department_id}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs truncate text-sm text-muted-foreground" title={department.description || 'N/A'}>
                                                                {department.description || <span className="italic">No description</span>}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-sm">{department.head_doctor_name || '—'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                                                                <Activity className="mr-1 h-3 w-3" />
                                                                {department.services_count || 0}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5">
                                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span className="text-sm">{department.phone || '—'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                                                                Active
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Link href={`/departments/${department.id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700" title="View details">
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Link href={`/departments/${department.id}/edit`}>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-700" title="Edit">
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                                                                    title="Delete"
                                                                    onClick={() => handleDelete(department.id, department.name)}
                                                                    disabled={deletingId === department.id}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="h-32 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                            <Building2 className="h-8 w-8 opacity-30" />
                                                            <p>No departments found</p>
                                                            {searchTerm && <p className="text-sm">Try adjusting your search term</p>}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {departments.meta && (
                                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-muted/20 gap-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing <strong>{departments.meta?.from || 0}</strong> to <strong>{departments.meta?.to || 0}</strong> of{' '}
                                        <strong>{departments.meta?.total || 0}</strong> departments
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shadow-sm"
                                            disabled={!(departments.meta?.current_page) || departments.meta?.current_page <= 1}
                                            onClick={() => window.location.href = `/departments?page=${(departments.meta?.current_page || 1) - 1}`}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="shadow-sm"
                                            disabled={!(departments.meta?.current_page) || departments.meta?.current_page >= (departments.meta?.last_page || 1)}
                                            onClick={() => window.location.href = `/departments?page=${(departments.meta?.current_page || 1) + 1}`}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}
