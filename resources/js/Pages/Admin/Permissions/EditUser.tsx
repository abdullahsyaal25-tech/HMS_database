import { Head, useForm, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    ArrowLeft, Save, Shield, CheckCircle, XCircle, Settings, Users, 
    KeyRound, AlertTriangle, ShieldCheck, ShieldAlert, Loader2, Info
} from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Permission {
    id: number;
    name: string;
    description?: string;
    resource: string;
    action: string;
    category?: string;
    module?: string;
    risk_level?: string;
    is_critical?: boolean;
}

interface EditUserPermissionsProps extends PageProps {
    user: {
        id: number;
        name: string;
        email: string;
        username: string;
        role: string;
        role_id?: number;
        role_name?: string;
        is_super_admin: boolean;
    };
    allPermissions: Permission[];
    userPermissionIds: number[];
    auth: {
        user: {
            id: number;
            name: string;
            role: string;
            is_super_admin: boolean;
            permissions: string[];
        };
    };
}

export default function EditUserPermissions({ user, allPermissions, userPermissionIds, auth }: EditUserPermissionsProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState<string>('all');

    // Group permissions by module
    const permissionsByModule = allPermissions.reduce((acc, permission) => {
        const module = permission.module || 'Other';
        if (!acc[module]) {
            acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
    }, {} as Record<string, Permission[]>);

    // Get unique modules
    const modules = Object.keys(permissionsByModule).sort();

    // Filter permissions based on search and module
    const filteredPermissions = allPermissions.filter(permission => {
        const matchesSearch = !searchQuery || 
            permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            permission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            permission.resource.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesModule = filterModule === 'all' || permission.module === filterModule;
        
        return matchesSearch && matchesModule;
    });

    const filteredByModule = Object.keys(permissionsByModule)
        .filter(m => filterModule === 'all' || m === filterModule)
        .sort()
        .reduce((acc, key) => {
            acc[key] = permissionsByModule[key].filter(p => 
                !searchQuery || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.resource.toLowerCase().includes(searchQuery.toLowerCase())
            );
            return acc;
        }, {} as Record<string, Permission[]>);

    const { data, setData, processing, errors, reset } = useForm({
        permissions: selectedPermissions,
    });

    // Update form data when selection changes
    useEffect(() => {
        setData('permissions', selectedPermissions);
    }, [selectedPermissions, setData]);

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const selectAllInModule = (module: string) => {
        const modulePerms = permissionsByModule[module]?.map(p => p.id) || [];
        setSelectedPermissions(prev => [...new Set([...prev, ...modulePerms])]);
    };

    const deselectAllInModule = (module: string) => {
        const modulePerms = permissionsByModule[module]?.map(p => p.id) || [];
        setSelectedPermissions(prev => prev.filter(id => !modulePerms.includes(id)));
    };

    const selectAll = () => {
        setSelectedPermissions(allPermissions.map(p => p.id));
    };

    const deselectAll = () => {
        setSelectedPermissions([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        router.visit(`/admin/users/${user.id}/permissions`, {
            method: 'post',
            data: {
                permissions: selectedPermissions,
                _method: 'PUT',
            },
            preserveScroll: true,
            onSuccess: () => {
                // Optionally show success message
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            },
        });
    };

    const getModuleIcon = (module: string) => {
        const m = module.toLowerCase();
        if (m.includes('user') || m.includes('permission')) {
            return <Users className="h-4 w-4" />;
        }
        if (m.includes('patient') || m.includes('medical')) {
            return <ShieldCheck className="h-4 w-4" />;
        }
        if (m.includes('appointment') || m.includes('schedule')) {
            return <Settings className="h-4 w-4" />;
        }
        return <KeyRound className="h-4 w-4" />;
    };

    const getRiskBadgeColor = (risk?: string) => {
        switch (risk?.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-700 border-green-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const selectedCount = selectedPermissions.length;
    const totalPermissions = allPermissions.length;
    const isAllSelected = selectedCount === totalPermissions;
    const isNoneSelected = selectedCount === 0;

    // Check if user can edit this user
    const canEdit = !auth.user.is_super_admin || user.is_super_admin 
        ? auth.user.is_super_admin && !user.is_super_admin
        : true;

    return (
        <HospitalLayout header="Edit User Permissions">
            <Head title={`Edit Permissions - ${user.name}`} />
            
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit User Permissions</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage permissions for {user.name} ({user.role || user.role_name || 'No role'})
                        </p>
                    </div>
                    <Link href="/admin/permissions">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Permissions
                        </Button>
                    </Link>
                </div>

                {/* User Info Card */}
                <Card className="mb-6 shadow-sm border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{user.name}</h3>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                    <p className="text-xs text-gray-400">Username: {user.username}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {user.role_name && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {user.role_name}
                                    </Badge>
                                )}
                                {user.is_super_admin && (
                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                        <ShieldAlert className="h-3 w-3 mr-1" />
                                        Super Admin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Authorization Warning */}
                {!canEdit && (
                    <Alert className="mb-6 bg-amber-50 border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                            You may have limited ability to modify these permissions. Contact a Super Admin if you need to make changes.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Permission Selection Summary */}
                <Card className="mb-6 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Permission Summary</CardTitle>
                            <div className="flex items-center gap-2">
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    onClick={selectAll}
                                    disabled={processing || user.is_super_admin}
                                >
                                    Select All
                                </Button>
                                <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    onClick={deselectAll}
                                    disabled={processing || user.is_super_admin}
                                >
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    Selected: <span className="font-semibold">{selectedCount}</span> of {totalPermissions} permissions
                                </span>
                                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-600 transition-all duration-300"
                                        style={{ width: `${totalPermissions > 0 ? (selectedCount / totalPermissions) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Search permissions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={filterModule}
                                    onChange={(e) => setFilterModule(e.target.value)}
                                    className="px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Modules</option>
                                    {modules.map(module => (
                                        <option key={module} value={module}>{module}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {errors.permissions && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.permissions}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit}>
                    {/* Permissions by Module */}
                    <div className="space-y-6">
                        {Object.entries(filteredByModule).map(([module, permissions]) => (
                            permissions.length > 0 && (
                                <Card key={module} className="shadow-sm">
                                    <CardHeader className="pb-3 bg-gray-50/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {getModuleIcon(module)}
                                                <CardTitle className="text-base">{module}</CardTitle>
                                                <Badge variant="secondary" className="ml-2">
                                                    {permissions.filter(p => selectedPermissions.includes(p.id)).length} / {permissions.length}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => selectAllInModule(module)}
                                                    disabled={processing || user.is_super_admin}
                                                >
                                                    Select All
                                                </Button>
                                                <Button 
                                                    type="button"
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => deselectAllInModule(module)}
                                                    disabled={processing || user.is_super_admin}
                                                >
                                                    Deselect All
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {permissions.map(permission => {
                                                const isSelected = selectedPermissions.includes(permission.id);
                                                const isCritical = permission.is_critical || permission.risk_level === 'high';
                                                
                                                return (
                                                    <div 
                                                        key={permission.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                                            isSelected 
                                                                ? "bg-blue-50 border-blue-200" 
                                                                : "bg-white border-gray-200 hover:border-gray-300"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            id={`permission-${permission.id}`}
                                                            checked={isSelected}
                                                            onCheckedChange={() => togglePermission(permission.id)}
                                                            disabled={processing || user.is_super_admin}
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <label
                                                                htmlFor={`permission-${permission.id}`}
                                                                className="flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <span className={cn(
                                                                    "font-medium text-sm",
                                                                    isSelected ? "text-blue-900" : "text-gray-700"
                                                                )}>
                                                                    {permission.name}
                                                                </span>
                                                                {isCritical && (
                                                                    <Badge className="text-[10px] px-1 py-0 h-5 bg-red-100 text-red-700 border-red-200">
                                                                        Critical
                                                                    </Badge>
                                                                )}
                                                            </label>
                                                            {permission.description && (
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                    {permission.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[10px] text-gray-400">
                                                                    {permission.resource}:{permission.action}
                                                                </span>
                                                                {permission.risk_level && (
                                                                    <Badge className={cn("text-[10px] px-1 py-0 h-5", getRiskBadgeColor(permission.risk_level))}>
                                                                        {permission.risk_level}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ))}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Link href="/admin/permissions">
                            <Button type="button" variant="ghost" className="text-gray-600 hover:bg-gray-100">
                                Cancel
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing || user.is_super_admin || !canEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 transition-all duration-200"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Permissions
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </HospitalLayout>
    );
}
