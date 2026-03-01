import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, Shield, CheckCircle2, AlertTriangle, Info, Loader2 } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useMemo, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Toast';
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
import { Input } from '@/components/ui/input';

interface Permission {
    id: number;
    name: string;
    description: string;
    module?: string;
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    is_critical?: boolean;
}

interface PageProps {
    role: string;
    permissions: Permission[];
    assignedPermissionIds: number[];
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

export default function EditRolePermissions() {
    const { props } = usePage();
    const { role, permissions, assignedPermissionIds, auth } = props as unknown as PageProps;
    const { showSuccess, showError } = useToast();
    
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(assignedPermissionIds);
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    // Check user permissions
    const canEditRolePermissions = hasPermission(auth.user, 'edit-role-permissions');
    const canManagePermissions = hasPermission(auth.user, 'manage-permissions');

    const togglePermission = useCallback((permissionId: number) => {
        if (!canEditRolePermissions) {
            showError('Access Denied', 'You do not have permission to modify role permissions.');
            return;
        }
        setSelectedPermissions(prev => {
            setHasChanges(true);
            return prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];
        });
    }, [canEditRolePermissions, showError]);

    const selectAll = useCallback(() => {
        if (!canEditRolePermissions) {
            showError('Access Denied', 'You do not have permission to modify role permissions.');
            return;
        }
        const allIds = permissions.filter(p => p.name !== 'view-server-management').map(p => p.id);
        setSelectedPermissions(allIds);
        setHasChanges(true);
        showSuccess('All Selected', 'All available permissions have been selected.');
    }, [canEditRolePermissions, permissions, showSuccess, showError]);

    const deselectAll = useCallback(() => {
        if (!canEditRolePermissions) {
            showError('Access Denied', 'You do not have permission to modify role permissions.');
            return;
        }
        setSelectedPermissions([]);
        setHasChanges(true);
        showError('All Deselected', 'All permissions have been deselected.');
    }, [canEditRolePermissions, showError]);

    const saveRolePermissions = useCallback(() => {
        if (!canManagePermissions) {
            showError('Access Denied', 'You do not have permission to save permission changes.');
            return;
        }
        
        setIsSaving(true);
        router.put(`/admin/permissions/roles/${encodeURIComponent(role)}`, {
            permissions: selectedPermissions
        }, {
            onSuccess: () => {
                setIsSaving(false);
                setHasChanges(false);
                showSuccess('Permissions Saved', `Permissions for ${role} have been saved successfully!`);
            },
            onError: (errors) => {
                setIsSaving(false);
                console.error('Failed to save permissions:', errors);
                showError('Save Failed', 'Failed to save permissions. Please try again.');
            }
        });
    }, [canManagePermissions, role, selectedPermissions, showSuccess, showError]);

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
        return permissions.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [permissions, searchQuery]);

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
    const totalCount = permissions.length;

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title={`Edit ${role} Permissions`} />
                
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Shield className="h-8 w-8 text-blue-600" />
                                Edit Role Permissions
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Manage permissions for the <span className="font-semibold capitalize">{role.replace(/_/g, ' ')}</span> role
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasChanges && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Unsaved Changes
                                </Badge>
                            )}
                            <Link href="/admin/permissions" onClick={handleBackClick}>
                                <Button variant="outline" className="gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Back to Roles
                                </Button>
                            </Link>
                            {canManagePermissions && (
                                <Button 
                                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                                    onClick={saveRolePermissions}
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

                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <Shield className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Role</p>
                                    <p className="text-xl font-bold text-gray-900 capitalize">{role.replace(/_/g, ' ')}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Selected</p>
                                    <p className="text-xl font-bold text-gray-900">{selectedCount} / {totalCount}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Info className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Coverage</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0}%
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Search and Bulk Actions */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 w-full">
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                {canEditRolePermissions && (
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
                        {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                            <Card key={moduleName}>
                                <CardHeader>
                                    <CardTitle className="text-lg uppercase tracking-wide">{moduleName}</CardTitle>
                                    <CardDescription>{modulePerms.length} permissions in this module</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {modulePerms.filter(permission => permission.name !== 'view-server-management').map(permission => (
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
                                                                !canEditRolePermissions && "cursor-not-allowed opacity-70"
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
                        ))}
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
                        <Link href="/admin/permissions">
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
