import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    ArrowLeft, Save, Shield, CheckCircle, XCircle, Settings, Filter, Search, 
    ChevronDown, ChevronRight, AlertTriangle, Users, KeyRound, RotateCcw,
    Building2, FlaskConical, Pill, UserCog, ClipboardList
} from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect, useCallback } from 'react';

interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
    category?: string;
    module?: string;
    risk_level?: string;
    is_critical?: boolean;
}

interface Role {
    id: number;
    name: string;
    description?: string;
    permissions: Permission[];
    is_default?: boolean;
    user_count?: number;
}

interface PermissionCategory {
    name: string;
    permissions: Permission[];
    collapsed: boolean;
    count: number;
    selectedCount: number;
    icon?: React.ReactNode;
}

interface PermissionsIndexProps extends PageProps {
    permissions: Permission[];
    roles: Role[];
    rolePermissions: Record<number, number[]>;
    categories: string[];
    modules: string[];
    legacyRoles: string[];
    legacyRolePermissions: Record<string, number[]>;
    roleUserCounts: Record<number, number>;
    rolePermissionScopes: Record<number, number[]>;
    legacyRolePermissionScopes: Record<string, number[]>;
}

// Role icons based on role name
const getRoleIcon = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('laboratory') || name.includes('lab')) {
        return <FlaskConical className="h-5 w-5 text-orange-600" />;
    }
    if (name.includes('pharmacy')) {
        return <Pill className="h-5 w-5 text-purple-600" />;
    }
    if (name.includes('reception')) {
        return <ClipboardList className="h-5 w-5 text-teal-600" />;
    }
    if (name.includes('super admin') || name.includes('admin')) {
        return <Shield className="h-5 w-5 text-red-600" />;
    }
    return <UserCog className="h-5 w-5 text-blue-600" />;
};

// Get role badge color
const getRoleBadgeColor = (roleName: string) => {
    const name = roleName.toLowerCase();
    if (name.includes('super admin')) {
        return 'bg-red-100 text-red-800 border-red-200';
    }
    if (name.includes('sub super admin')) {
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (name.includes('laboratory') || name.includes('lab')) {
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (name.includes('pharmacy')) {
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (name.includes('reception')) {
        return 'bg-teal-100 text-teal-800 border-teal-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
};

// Default permissions per role (for reset functionality)
const defaultPermissions: Record<string, string[]> = {
    'Super Admin': [],
    'Sub Super Admin': ['view-admin-dashboard', 'view-users', 'view-patients', 'view-appointments'],
    'Laboratory Admin': ['view-laboratory', 'view-lab-test-requests', 'process-lab-test-requests', 'view-lab-tests'],
    'Pharmacy Admin': ['view-pharmacy', 'view-medicines', 'edit-medicines', 'view-sales'],
    'Reception Admin': ['view-appointments', 'create-appointments', 'edit-appointments', 'view-patients', 'create-patients'],
};

export default function PermissionsIndex({
    permissions,
    roles,
    rolePermissions,
    categories,
    legacyRoles,
    legacyRolePermissions,
    roleUserCounts,
}: PermissionsIndexProps) {
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [categoriesState, setCategoriesState] = useState<PermissionCategory[]>([]);
    const [pendingChanges, setPendingChanges] = useState<{ added: number[]; removed: number[] } | null>(null);

    // Get all available permissions (combining both normalized and legacy)
    const allPermissions = permissions;

    // Group permissions by category
    const groupPermissionsByCategory = useCallback((perms: Permission[]): PermissionCategory[] => {
        const categoryMap = new Map<string, Permission[]>();

        perms.forEach(permission => {
            const category = permission.category || permission.module || 'General';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(permission);
        });

        const categoryIcons: Record<string, React.ReactNode> = {
            'Laboratory': <FlaskConical className="h-4 w-4 text-orange-600" />,
            'Pharmacy': <Pill className="h-4 w-4 text-purple-600" />,
            'Patients': <Users className="h-4 w-4 text-blue-600" />,
            'Appointments': <ClipboardList className="h-4 w-4 text-teal-600" />,
            'General': <Shield className="h-4 w-4 text-gray-600" />,
        };

        return Array.from(categoryMap.entries()).map(([name, permsList]) => ({
            name,
            permissions: permsList,
            collapsed: false,
            count: permsList.length,
            selectedCount: permsList.filter(p => selectedPermissions.includes(p.id)).length,
            icon: categoryIcons[name] || <Shield className="h-4 w-4 text-gray-600" />,
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedPermissions]);

    // Initialize categories when role is selected
    useEffect(() => {
        if (selectedRole) {
            setCategoriesState(groupPermissionsByCategory(allPermissions));
        }
    }, [selectedRole, selectedPermissions, groupPermissionsByCategory, allPermissions]);

    // Handle role selection
    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        // Get current permissions for this role (check both normalized and legacy)
        const rolePerms = rolePermissions[role.id] || legacyRolePermissions[role.name] || [];
        setSelectedPermissions(rolePerms);
        setSearchTerm('');
        setFilterCategory('all');
        setPendingChanges(null);
        setErrorMessage(null);
    };

    // Toggle permission
    const togglePermission = (permissionId: number) => {
        const wasSelected = selectedPermissions.includes(permissionId);
        const newPermissions = wasSelected
            ? selectedPermissions.filter(id => id !== permissionId)
            : [...selectedPermissions, permissionId];

        setSelectedPermissions(newPermissions);

        // Track pending changes
        if (wasSelected) {
            setPendingChanges(prev => ({
                added: prev?.added || [],
                removed: [...(prev?.removed || []), permissionId]
            }));
        } else {
            setPendingChanges(prev => ({
                added: [...(prev?.added || []), permissionId],
                removed: prev?.removed || []
            }));
        }
    };

    // Select/deselect all permissions in a category
    const toggleCategoryPermissions = (categoryName: string, selectAll: boolean) => {
        const category = categoriesState.find(c => c.name === categoryName);
        if (!category) return;

        let newPermissions = [...selectedPermissions];
        
        category.permissions.forEach(perm => {
            if (selectAll && !newPermissions.includes(perm.id)) {
                newPermissions.push(perm.id);
            } else if (!selectAll && newPermissions.includes(perm.id)) {
                newPermissions = newPermissions.filter(id => id !== perm.id);
            }
        });

        setSelectedPermissions(newPermissions);
    };

    // Filter categories based on search and category filter
    const filteredCategories = categoriesState
        .map(category => ({
            ...category,
            permissions: category.permissions.filter(permission => {
                const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      permission.description?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = filterCategory === 'all' || 
                    permission.category === filterCategory || 
                    permission.module === filterCategory;
                return matchesSearch && matchesCategory;
            })
        }))
        .filter(category => category.permissions.length > 0);

    // Save role permissions
    const handleSave = () => {
        if (!selectedRole) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        // Use Inertia router for proper CSRF handling
        router.visit(`/admin/permissions/roles/${selectedRole.id}`, {
            method: 'post',
            data: {
                permissions: selectedPermissions,
                _method: 'PUT',
            },
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage(`Permissions updated successfully for ${selectedRole.name}`);
                setPendingChanges(null);
                router.reload({ only: ['roles', 'rolePermissions', 'legacyRolePermissions'] });
                setIsSubmitting(false);
                setShowConfirmDialog(false);
            },
            onError: (errors) => {
                setErrorMessage(Object.values(errors).join(', ') || 'Failed to update permissions');
                setIsSubmitting(false);
                setShowConfirmDialog(false);
            },
        });
    };

    // Reset role permissions to default
    const handleReset = () => {
        if (!selectedRole) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        // Use Inertia router for proper CSRF handling
        router.visit(`/admin/permissions/roles/${selectedRole.id}/reset`, {
            method: 'post',
            preserveScroll: true,
            onSuccess: () => {
                setSuccessMessage(`Permissions reset to default for ${selectedRole.name}`);
                // Get default permissions and update state
                const defaults = defaultPermissions[selectedRole.name] || [];
                const defaultPermIds = permissions
                    .filter(p => defaults.includes(p.name))
                    .map(p => p.id);
                setSelectedPermissions(defaultPermIds);
                setPendingChanges(null);
                router.reload({ only: ['roles', 'rolePermissions', 'legacyRolePermissions'] });
                setIsSubmitting(false);
                setShowResetDialog(false);
            },
            onError: (errors) => {
                setErrorMessage(Object.values(errors).join(', ') || 'Failed to reset permissions');
                setIsSubmitting(false);
                setShowResetDialog(false);
            },
        });
    };

    // Back to roles list
    const handleBack = () => {
        setSelectedRole(null);
        setSelectedPermissions([]);
        setSearchTerm('');
        setFilterCategory('all');
        setPendingChanges(null);
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Role Permissions Management" />

                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4">
                            {selectedRole && (
                                <Button variant="ghost" size="icon" onClick={handleBack}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {selectedRole ? `Manage ${selectedRole.name} Permissions` : 'Role Permissions Management'}
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    {selectedRole 
                                        ? `Grant or revoke permissions for the ${selectedRole.name} role`
                                        : 'Select a role to view and manage its permissions'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Success/Error Messages */}
                    {successMessage && (
                        <Alert className="mb-4 bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {errorMessage && (
                        <Alert className="mb-4 bg-red-50 border-red-200">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    {!selectedRole ? (
                        /* Roles List View */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {roles.map((role) => {
                                const permissionCount = rolePermissions[role.id]?.length || 
                                    legacyRolePermissions[role.name]?.length || 0;
                                const userCount = roleUserCounts[role.id] || 0;

                                return (
                                    <Card 
                                        key={role.id} 
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleRoleSelect(role)}
                                    >
                                        <CardHeader className="flex flex-row items-start justify-between pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${getRoleBadgeColor(role.name).split(' ')[0]}`}>
                                                    {getRoleIcon(role.name)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{role.name}</CardTitle>
                                                    {role.description && (
                                                        <CardDescription className="text-sm">
                                                            {role.description}
                                                        </CardDescription>
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <KeyRound className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {permissionCount} permissions
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {userCount} users
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className={getRoleBadgeColor(role.name)}>
                                                    {permissionCount}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Legacy Roles */}
                            {legacyRoles.filter(r => !roles.some(role => role.name === r)).map((legacyRole, index) => {
                                const permissionCount = legacyRolePermissions[legacyRole]?.length || 0;

                                return (
                                    <Card 
                                        key={legacyRole} 
                                        className="hover:shadow-md transition-shadow cursor-pointer border-yellow-200 bg-yellow-50"
                                        onClick={() => {
                                            const role: Role = {
                                                id: 1000 + index,
                                                name: legacyRole,
                                                permissions: [],
                                            };
                                            handleRoleSelect(role);
                                        }}
                                    >
                                        <CardHeader className="flex flex-row items-start justify-between pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-yellow-100">
                                                    <Shield className="h-5 w-5 text-yellow-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{legacyRole}</CardTitle>
                                                    <CardDescription className="text-sm text-yellow-700">
                                                        Legacy Role
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1">
                                                        <KeyRound className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm font-medium">
                                                            {permissionCount} permissions
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                                                    Legacy
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        /* Role Permissions View */
                        <div className="space-y-6">
                            {/* Role Info Card */}
                            <Card>
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${getRoleBadgeColor(selectedRole.name).split(' ')[0]}`}>
                                                {getRoleIcon(selectedRole.name)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{selectedRole.name}</CardTitle>
                                                <CardDescription>
                                                    {selectedRole.description || 'Role-based permission management'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowResetDialog(true)}
                                                className="gap-2"
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                                Reset to Default
                                            </Button>
                                            <Button
                                                onClick={() => setShowConfirmDialog(true)}
                                                disabled={!pendingChanges || isSubmitting}
                                                className="gap-2"
                                            >
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <KeyRound className="h-4 w-4" />
                                            <span>{selectedPermissions.length} permissions assigned</span>
                                        </div>
                                        {pendingChanges && (
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                <span className="text-amber-600">
                                                    {pendingChanges.added.length} new, {pendingChanges.removed.length} removed
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Search and Filter */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search permissions..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Permission Categories */}
                            <div className="space-y-4">
                                {filteredCategories.map((category) => (
                                    <Card key={category.name}>
                                        <Collapsible defaultOpen={!category.collapsed}>
                                            <CollapsibleTrigger asChild>
                                                <CardHeader className="cursor-pointer hover:bg-gray-50 py-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            {category.icon}
                                                            <CardTitle className="text-lg">{category.name}</CardTitle>
                                                            <Badge variant="secondary">
                                                                {category.selectedCount}/{category.count}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const allSelected = category.permissions.every(p => 
                                                                        selectedPermissions.includes(p.id)
                                                                    );
                                                                    toggleCategoryPermissions(category.name, !allSelected);
                                                                }}
                                                            >
                                                                {category.permissions.every(p => 
                                                                    selectedPermissions.includes(p.id)
                                                                ) ? 'Deselect All' : 'Select All'}
                                                            </Button>
                                                            <ChevronDown className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <CardContent className="pt-0">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {category.permissions.map((permission) => {
                                                            const isSelected = selectedPermissions.includes(permission.id);
                                                            
                                                            return (
                                                                <div
                                                                    key={permission.id}
                                                                    onClick={() => togglePermission(permission.id)}
                                                                    className={`
                                                                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                                        ${isSelected 
                                                                            ? 'bg-blue-50 border-blue-300' 
                                                                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                                        }
                                                                    `}
                                                                >
                                                                    <div className={`
                                                                        w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                                                                        ${isSelected 
                                                                            ? 'bg-blue-600 border-blue-600' 
                                                                            : 'border-gray-300'
                                                                        }
                                                                    `}>
                                                                        {isSelected && (
                                                                            <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm truncate">
                                                                            {permission.name}
                                                                        </p>
                                                                        {permission.description && (
                                                                            <p className="text-xs text-gray-500 truncate">
                                                                                {permission.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </Card>
                                ))}
                            </div>

                            {filteredCategories.length === 0 && (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No permissions found matching your criteria</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                {/* Save Confirmation Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Save Permission Changes</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to save the permission changes for {selectedRole?.name}?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {pendingChanges && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>{pendingChanges.added.length} permissions will be granted</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        <span>{pendingChanges.removed.length} permissions will be revoked</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Reset Confirmation Dialog */}
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Permissions to Default</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reset permissions for {selectedRole?.name} to their default values?
                                This will remove all custom permissions and restore the original configuration.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleReset} disabled={isSubmitting}>
                                {isSubmitting ? 'Resetting...' : 'Reset to Default'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
