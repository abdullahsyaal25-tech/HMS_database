import { Head, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, User, Shield, CheckCircle2, AlertTriangle, Info, Loader2, Search } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useMemo, useCallback } from 'react';
import { Link, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Permission {
    id: number;
    name: string;
    description: string;
    module?: string;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    is_critical?: boolean;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    roleModel?: {
        name: string;
    };
}

interface PageProps {
    user: UserData;
    allPermissions: Permission[];
    userPermissionIds: number[];
    auth: {
        user: {
            id: number;
            name: string;
            role?: string;
            permissions?: string[];
            is_super_admin?: boolean;
        };
    };
}

// Permission check helper
const hasPermission = (user: PageProps['auth']['user'], permission: string): boolean => {
    if (user.is_super_admin) return true;
    return user.permissions?.includes(permission) || false;
};

export default function EditUserPermissions() {
    const { props } = usePage();
    const { user, allPermissions, userPermissionIds, auth } = props as unknown as PageProps;
    const { showSuccess, showError, showWarning } = useToast();
    
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Check user permissions
    const canManageUserPermissions = hasPermission(auth.user, 'manage-user-permissions');
    const canManagePermissions = hasPermission(auth.user, 'manage-permissions');

    // Check if current user can edit this user
    const isSelf = auth.user.id === user.id;
    const canEdit = canManageUserPermissions && !isSelf;

    if (!canManagePermissions && !auth.user.is_super_admin) {
        return (
            <HospitalLayout>
                <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="py-12 text-center">
                                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
                                <p className="text-red-700 mb-6">You do not have permission to edit user permissions.</p>
                                <Link href="/admin/users">
                                    <Button variant="outline">Back to Users</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </HospitalLayout>
        );
    }

    if (isSelf) {
        return (
            <HospitalLayout>
                <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Card className="border-amber-200 bg-amber-50">
                            <CardContent className="py-12 text-center">
                                <Info className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-amber-900 mb-2">Cannot Edit Own Permissions</h2>
                                <p className="text-amber-700 mb-6">For security reasons, you cannot modify your own permissions.</p>
                                <Link href="/admin/users">
                                    <Button variant="outline">Back to Users</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </HospitalLayout>
        );
    }

    const togglePermission = useCallback((permissionId: number) => {
        if (!canEdit) {
            showError('Access Denied', 'You do not have permission to modify this user\'s permissions.');
            return;
        }
        setSelectedPermissions(prev => {
            setHasChanges(true);
            return prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];
        });
    }, [canEdit, showError]);

    const selectAll = useCallback(() => {
        if (!canEdit) {
            showError('Access Denied', 'You do not have permission to modify this user\'s permissions.');
            return;
        }
        const allIds = allPermissions.map(p => p.id);
        setSelectedPermissions(allIds);
        setHasChanges(true);
        showSuccess('All Selected', 'All permissions have been selected for this user.');
    }, [canEdit, allPermissions, showSuccess, showError]);

    const deselectAll = useCallback(() => {
        if (!canEdit) {
            showError('Access Denied', 'You do not have permission to modify this user\'s permissions.');
            return;
        }
        setSelectedPermissions([]);
        setHasChanges(true);
        showWarning('All Deselected', 'All permissions have been removed from this user.');
    }, [canEdit, showWarning, showError]);

    const saveUserPermissions = useCallback(async () => {
        if (!canEdit) {
            showError('Access Denied', 'You do not have permission to save these changes.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/admin/permissions/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    permissions: selectedPermissions
                })
            });
            
            if (response.ok) {
                setIsSaving(false);
                setHasChanges(false);
                showSuccess('Permissions Saved', `Permissions for ${user.name} have been saved successfully!`);
            } else {
                setIsSaving(false);
                showError('Save Failed', 'Failed to save permissions. Please try again.');
            }
        } catch (error) {
            setIsSaving(false);
            console.error('Error saving user permissions:', error);
            showError('Error', 'An error occurred while saving permissions.');
        }
    }, [canEdit, user.id, user.name, selectedPermissions, showSuccess, showError]);

    const handleBackClick = useCallback((e: React.MouseEvent) => {
        if (hasChanges) {
            e.preventDefault();
            setShowUnsavedDialog(true);
        }
    }, [hasChanges]);

    const getRiskColor = useCallback((risk?: string) => {
        switch (risk) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    }, []);

    const filteredPermissions = useMemo(() => {
        return allPermissions.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allPermissions, searchQuery]);

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, Permission[]> = {};
        filteredPermissions.forEach(p => {
            const module = p.module || 'System';
            if (!groups[module]) groups[module] = [];
            groups[module].push(p);
        });
        return groups;
    }, [filteredPermissions]);

    const selectedCount = selectedPermissions.length;
    const totalCount = allPermissions.length;

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title={`Edit ${user.name} Permissions`} />
                
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <User className="h-8 w-8 text-blue-600" />
                                Edit User Permissions
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage permissions for <span className="font-semibold">{user.name}</span>
                                <span className="text-gray-400 mx-2">|</span>
                                <Badge variant="secondary">{user.roleModel?.name || user.role}</Badge>
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasChanges && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Unsaved Changes
                                </Badge>
                            )}
                            <Link href="/admin/users" onClick={handleBackClick}>
                                <Button variant="outline" className="gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Back to Users
                                </Button>
                            </Link>
                            {canEdit && (
                                <Button 
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    onClick={saveUserPermissions}
                                    disabled={isSaving || !hasChanges}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* User Info Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                                    <p className="text-gray-500">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary">{user.roleModel?.name || user.role}</Badge>
                                        <span className="text-sm text-gray-400">ID: {user.id}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Direct Permissions</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedCount}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Shield className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Available</p>
                                    <p className="text-xl font-bold text-gray-900">{totalCount}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <Info className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Note</p>
                                    <p className="text-sm text-gray-700">User also inherits permissions from their role</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Bulk Actions */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={selectAll}>
                                            Select All
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={deselectAll}>
                                            Deselect All
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Permissions Grid */}
                    <div className="space-y-6">
                        {Object.entries(groupedPermissions).length === 0 ? (
                            <Card className="bg-gray-50 border-dashed">
                                <CardContent className="py-12 text-center">
                                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900">No permissions found</h3>
                                    <p className="text-gray-500">Adjust your search to see more results</p>
                                </CardContent>
                            </Card>
                        ) : (
                            Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                                <Card key={moduleName}>
                                    <CardHeader>
                                        <CardTitle className="text-lg uppercase tracking-wide">{moduleName}</CardTitle>
                                        <CardDescription>{modulePerms.length} permissions in this module</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {modulePerms.map(permission => (
                                                <TooltipProvider key={permission.id}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div 
                                                                onClick={() => togglePermission(permission.id)}
                                                                className={cn(
                                                                    "p-4 border rounded-lg cursor-pointer transition-all",
                                                                    selectedPermissions.includes(permission.id)
                                                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                                                                    !canEdit && "cursor-not-allowed opacity-70"
                                                                )}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={cn(
                                                                        "flex items-center justify-center h-5 w-5 rounded border-2 mt-0.5",
                                                                        selectedPermissions.includes(permission.id)
                                                                            ? "bg-blue-600 border-blue-600"
                                                                            : "border-gray-300 bg-white"
                                                                    )}>
                                                                        {selectedPermissions.includes(permission.id) && (
                                                                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <h4 className="font-semibold text-gray-900">
                                                                                {permission.name.split('-').map(word => 
                                                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                                                ).join(' ')}
                                                                            </h4>
                                                                            {permission.is_critical && (
                                                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 mt-1">
                                                                            {permission.description || `Grants ability to ${permission.name.replace(/-/g, ' ')}`}
                                                                        </p>
                                                                        {permission.risk_level && (
                                                                            <Badge className={cn("mt-2 text-[10px]", getRiskColor(permission.risk_level))}>
                                                                                {permission.risk_level}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Click to {selectedPermissions.includes(permission.id) ? 'remove' : 'assign'} this permission</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Unsaved Changes Dialog */}
            <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Unsaved Changes
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to leave this page? 
                            Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay on Page</AlertDialogCancel>
                        <Link href="/admin/users">
                            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                Leave Without Saving
                            </AlertDialogAction>
                        </Link>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </HospitalLayout>
    );
}
