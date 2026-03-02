import { Head, router, usePage } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, 
  Lock, 
  Search, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Copy, 
  CheckCircle2, 
  Layers,
  Filter,
  History,
  MoreVertical,
  Loader2,
  Users,
  CheckSquare,
  Square,
  Info,
  Plus,
  UserPlus,
  XCircle,
} from 'lucide-react';
import axios from 'axios';
import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Role, Permission } from '@/types/rbac';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PageProps {
  permissions: Permission[];
  roles: Role[];
  rolePermissions: Record<number, number[]>;
  categories: string[];
  modules: string[];
  legacyRoles: string[];
  legacyRolePermissions: Record<string, number[]>;
  // RBAC: Track which permissions belong to which role
  rolePermissionScopes: Record<number, number[]>;
  legacyRolePermissionScopes: Record<string, number[]>;
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

interface Props {
  permissions: Permission[];
  roles: Role[];
  rolePermissions: Record<number, number[]>;
  categories: string[];
  modules: string[];
  legacyRoles: string[];
  legacyRolePermissions: Record<string, number[]>;
  roleUserCounts?: Record<number, number>;
  // RBAC: Track which permissions belong to which role
  rolePermissionScopes: Record<number, number[]>;
  legacyRolePermissionScopes: Record<string, number[]>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  role?: string;
  roleModel?: {
    id: number;
    name: string;
  };
}

// Permission check helper
const hasPermission = (user: PageProps['auth']['user'] | null | undefined, permission: string): boolean => {
  if (!user) return false;
  if (user.is_super_admin) return true;
  return user.permissions?.includes(permission) || false;
};

// Convert role name to human-readable format (e.g., "pharmacy_admin" -> "Pharmacy Admin")
const formatRoleName = (roleName: string): string => {
  return roleName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function PermissionsIndex({ 
  permissions, 
  roles, 
  rolePermissions, 
  modules,
  legacyRoles,
  legacyRolePermissions,
  roleUserCounts = {},
  rolePermissionScopes = {},
  legacyRolePermissionScopes = {},
}: Props) {
  const pageProps = usePage().props as unknown as PageProps;
  const auth = pageProps?.auth;
  const user = auth?.user;
  const { showSuccess, showError, showWarning } = useToast();
  
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>(roles[0]?.id || (legacyRoles[0] || ''));
  const [currentRolePerms, setCurrentRolePerms] = useState<number[]>(
    typeof selectedRoleId === 'number' 
      ? (rolePermissions[selectedRoleId] || []) 
      : (legacyRolePermissions[selectedRoleId] || [])
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add role dialog state
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign role dialog state
  const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<Role | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Check user permissions
  const canManagePermissions = hasPermission(user, 'manage-permissions');
  const canEditRolePermissions = hasPermission(user, 'edit-role-permissions');
  const canResetPermissions = hasPermission(user, 'reset-role-permissions');
  const canViewPermissionTemplates = hasPermission(user, 'view-permission-templates');

  // RBAC: Get the scope of permissions for the selected role
  const currentRolePermissionScope = useMemo(() => {
    if (typeof selectedRoleId === 'number') {
      return rolePermissionScopes[selectedRoleId] || [];
    }
    return legacyRolePermissionScopes[selectedRoleId] || [];
  }, [selectedRoleId, rolePermissionScopes, legacyRolePermissionScopes]);

  // RBAC: Check if a permission is within the current role's scope
  const isPermissionInScope = useCallback((permissionId: number): boolean => {
    // If no role selected, all permissions are in scope
    if (!selectedRoleId) return true;
    // Super admin can access everything
    if (user?.is_super_admin) return true;
    // Check if permission belongs to current role's scope
    return currentRolePermissionScope.includes(permissionId);
  }, [selectedRoleId, currentRolePermissionScope, user]);

  // Toggle individual permission - MUST be defined before handleTogglePermission
  const togglePermission = useCallback((permissionId: number) => {
    setCurrentRolePerms(prev => {
      const newPerms = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      setHasUnsavedChanges(true);
      return newPerms;
    });
  }, []);

  // RBAC: Handle permission toggle with access control
  const handleTogglePermission = useCallback((permissionId: number) => {
    // Check if permission is in scope
    if (!isPermissionInScope(permissionId)) {
      showError('Access Denied', 'You cannot modify permissions outside of this role\'s scope. Select a role to view and manage its specific permissions.');
      return;
    }
    togglePermission(permissionId);
  }, [isPermissionInScope, togglePermission, showError]);

  // Handle role change
  const handleRoleChange = useCallback((roleId: number | string) => {
    if (hasUnsavedChanges) {
      showWarning('Unsaved Changes', 'You have unsaved changes. Please save or discard them before switching roles.');
      return;
    }
    setSelectedRoleId(roleId);
    if (typeof roleId === 'number') {
      setCurrentRolePerms(rolePermissions[roleId] || []);
    } else {
      setCurrentRolePerms(legacyRolePermissions[roleId] || []);
    }
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges, rolePermissions, legacyRolePermissions, showWarning]);

  // Bulk operations - RBAC: Only allow operations on scoped permissions
  const selectAllInModule = useCallback((moduleName: string) => {
    const modulePerms = permissions.filter(p => p.module === moduleName).map(p => p.id);
    // Filter to only permissions in scope
    const scopedModulePerms = modulePerms.filter(id => isPermissionInScope(id));
    
    if (scopedModulePerms.length === 0 && modulePerms.length > 0) {
      showWarning('Access Restricted', `No permissions in the ${moduleName} module are assigned to this role. Only permissions within the role's scope can be selected.`);
      return;
    }
    
    setCurrentRolePerms(prev => {
      setHasUnsavedChanges(true);
      return Array.from(new Set([...prev, ...scopedModulePerms]));
    });
    showSuccess('Permissions Selected', `${scopedModulePerms.length} permissions in ${moduleName} module have been selected.`);
  }, [permissions, showSuccess, showWarning, isPermissionInScope]);

  const deselectAllInModule = useCallback((moduleName: string) => {
    const modulePerms = permissions.filter(p => p.module === moduleName).map(p => p.id);
    // Filter to only permissions in scope
    const scopedModulePerms = modulePerms.filter(id => isPermissionInScope(id));
    
    if (scopedModulePerms.length === 0 && modulePerms.length > 0) {
      showWarning('Access Restricted', `No permissions in the ${moduleName} module are assigned to this role.`);
      return;
    }
    
    setCurrentRolePerms(prev => {
      setHasUnsavedChanges(true);
      return prev.filter(id => !scopedModulePerms.includes(id));
    });
    showWarning('Permissions Deselected', `${scopedModulePerms.length} permissions in ${moduleName} module have been deselected.`);
  }, [permissions, showWarning, isPermissionInScope]);

  // Filtering logic - Show ALL permissions so admins can select any permission for any role
  // Scope validation is only enforced when saving permissions
  const filteredPermissions = useMemo(() => {
    // Show ALL permissions - never filter by scope when displaying
    // This allows admins to select any permission for any role
    return permissions.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesModule = filterModule === 'all' || p.module === filterModule;
      const matchesRisk = filterRisk === 'all' || p.risk_level === filterRisk;
      
      return matchesSearch && matchesModule && matchesRisk;
    });
  }, [permissions, searchQuery, filterModule, filterRisk]);

  // Grouped by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    filteredPermissions.forEach(p => {
      const module = p.module || 'System';
      if (!groups[module]) groups[module] = [];
      groups[module].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  // Save changes
  const handleSave = useCallback(() => {
    setIsSaving(true);
    router.visit(`/admin/permissions/roles/${selectedRoleId}`, {
      method: 'post',
      data: {
        _method: 'PUT',
        permissions: currentRolePerms
      },
      preserveScroll: true,
      onSuccess: () => {
        setIsSaving(false);
        setHasUnsavedChanges(false);
        showSuccess('Permissions Saved', `Permissions for the selected role have been updated successfully.`);
      },
      onError: (errors) => {
        setIsSaving(false);
        console.error('Failed to save permissions:', errors);
        showError('Save Failed', 'Failed to save permissions. Please try again.');
      }
    });
  }, [currentRolePerms, selectedRoleId, showSuccess, showError]);

  const resetToDefault = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const confirmReset = useCallback(() => {
    setShowResetDialog(false);
    router.post(`/admin/permissions/roles/${selectedRoleId}/reset`, {}, {
      onSuccess: () => {
        showSuccess('Permissions Reset', 'Role permissions have been reset to system defaults.');
        window.location.reload();
      },
      onError: () => {
        showError('Reset Failed', 'Failed to reset permissions. Please try again.');
      }
    });
  }, [selectedRoleId, showSuccess, showError]);

  const copyFromRole = useCallback((sourceRoleId: number | string) => {
    const sourcePerms = typeof sourceRoleId === 'number' 
      ? (rolePermissions[sourceRoleId] || []) 
      : (legacyRolePermissions[sourceRoleId] || []);
    
    setCurrentRolePerms(sourcePerms);
    setHasUnsavedChanges(true);
    setShowCopyDialog(false);
    showSuccess('Template Applied', 'Permissions from the selected role have been applied.');
  }, [rolePermissions, legacyRolePermissions, showSuccess]);

  // Add new role
  const handleAddRole = useCallback(async () => {
    if (!newRoleName.trim()) {
      showError('Validation Error', 'Role name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      await axios.post('/admin/roles', {
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || null,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
        },
      });

      showSuccess('Role Created', `The role "${newRoleName}" has been created successfully.`);
      setShowAddRoleDialog(false);
      setNewRoleName('');
      setNewRoleDescription('');
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: unknown) {
      console.error('Failed to create role:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to create role. Please try again.';
      showError('Creation Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [newRoleName, newRoleDescription, showSuccess, showError]);

  // Fetch users for role assignment
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get('/admin/rbac/users-list', {
        params: { exclude_super_admin: true }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showError('Error', 'Failed to load users. Please try again.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showError]);

  // Open assign role dialog
  const openAssignRoleDialog = useCallback(async (role: Role) => {
    setSelectedRoleForAssignment(role);
    setSelectedUserId('');
    setShowAssignRoleDialog(true);
    await fetchUsers();
  }, [fetchUsers]);

  // Handle assign role
  const handleAssignRole = useCallback(async () => {
    if (!selectedUserId || !selectedRoleForAssignment) {
      showError('Validation Error', 'Please select a user to assign the role to.');
      return;
    }

    setIsAssigning(true);
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      await axios.put(`/admin/rbac/users/${selectedUserId}/role`, {
        role_id: selectedRoleForAssignment.id,
      }, {
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          'Content-Type': 'application/json',
        },
      });

      showSuccess('Role Assigned', `The role "${selectedRoleForAssignment.name}" has been assigned successfully.`);
      setShowAssignRoleDialog(false);
      setSelectedRoleForAssignment(null);
      setSelectedUserId('');
      
      // Refresh the page to update user counts
      window.location.reload();
    } catch (error: unknown) {
      console.error('Failed to assign role:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to assign role. Please try again.';
      showError('Assignment Failed', errorMessage);
    } finally {
      setIsAssigning(false);
    }
  }, [selectedUserId, selectedRoleForAssignment, showSuccess, showError]);

  const getRiskColor = useCallback((risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }, []);

  const selectedRole = roles.find(r => r.id === selectedRoleId) || 
    (typeof selectedRoleId === 'string' ? { name: selectedRoleId, id: selectedRoleId } : null);

  const selectedCount = currentRolePerms.length;
  const totalCount = permissions.length;
  
  // RBAC: Count of visible permissions (in scope)
  const scopedTotalCount = filteredPermissions.length;
  const scopedTotalOriginal = selectedRoleId 
    ? currentRolePermissionScope.length 
    : permissions.length;

  return (
    <HospitalLayout>
      <Head title="Permissions Management" />
      
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                <Lock className="h-8 w-8 text-blue-600" />
                Permissions Management
              </h1>
              <p className="text-gray-500">Fine-tune system access and security policies across all roles</p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={resetToDefault}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </Button>
              <Button 
                className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md"
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Roles</p>
                  <p className="text-2xl font-bold text-gray-900">{roles.length + legacyRoles.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Lock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{selectedRoleId ? 'Role Permissions' : 'Total Permissions'}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedRoleId ? scopedTotalCount : totalCount}
                    {selectedRoleId && scopedTotalOriginal !== scopedTotalCount && (
                      <span className="text-sm font-normal text-gray-500"> / {scopedTotalOriginal}</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Selected</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">Current Role</p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {formatRoleName(selectedRole?.name || '') || 'None Selected'}
                  </p>
                  {!selectedRoleId && (
                    <p className="text-xs text-amber-600 mt-1">Select a role to manage its permissions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar: Role Selection */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="shadow-sm border-gray-200 sticky top-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        System Roles
                      </CardTitle>
                      <CardDescription>Select a role to configure</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1 h-8"
                      onClick={() => setShowAddRoleDialog(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Role
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-transparent h-12 p-0">
                      <TabsTrigger 
                        value="new" 
                        className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-full"
                      >
                        Normalized
                      </TabsTrigger>
                      <TabsTrigger 
                        value="legacy" 
                        className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-full"
                      >
                        Legacy
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
                      <TabsContent value="new" className="mt-0 space-y-1">
                        {roles.map(role => (
                          <div
                            key={role.id}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                              selectedRoleId === role.id 
                                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <div 
                              className="flex items-center gap-2 flex-1"
                              onClick={() => handleRoleChange(role.id)}
                            >
                              <Shield className={cn("h-4 w-4", selectedRoleId === role.id ? "text-blue-600" : "text-gray-400")} />
                              <span className="truncate">{formatRoleName(role.name)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {role.is_system && <Badge variant="outline" className="text-[10px] h-4">SYS</Badge>}
                              {roleUserCounts[role.id] !== undefined && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAssignRoleDialog(role);
                                        }}
                                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                                      >
                                        <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Assign role to user</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {roleUserCounts[role.id] !== undefined && roleUserCounts[role.id] > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-4 bg-blue-100 text-blue-700">
                                  {roleUserCounts[role.id]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="legacy" className="mt-0 space-y-1">
                        {legacyRoles.map(role => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                              selectedRoleId === role 
                                ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100" 
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <History className={cn("h-4 w-4", selectedRoleId === role ? "text-amber-600" : "text-gray-400")} />
                            <span className="capitalize">{formatRoleName(role)}</span>
                          </button>
                        ))}
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
                
                {/* Add Role Dialog */}
                <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Role</DialogTitle>
                      <DialogDescription>
                        Create a new role with custom permissions. You can configure the permissions after creating the role.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="role-name"
                          placeholder="Enter role name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role-description">Description (Optional)</Label>
                        <textarea
                          id="role-description"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Enter role description"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddRoleDialog(false);
                          setNewRoleName('');
                          setNewRoleDescription('');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddRole}
                        disabled={isSubmitting || !newRoleName.trim()}
                        className="gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {isSubmitting ? 'Creating...' : 'Create Role'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {canViewPermissionTemplates && (
                  <CardFooter className="pt-4 border-t bg-gray-50/50 rounded-b-xl">
                    <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full gap-2">
                          <Copy className="h-3.5 w-3.5" />
                          Apply Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply Permission Template</DialogTitle>
                          <DialogDescription>
                            Choose an existing role to copy all permissions from. This will replace the current selections.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto py-4">
                          <Label className="text-xs font-bold text-gray-500 uppercase px-1">Normalized Roles</Label>
                          {roles.filter(r => r.id !== selectedRoleId).map(role => (
                            <Button 
                              key={role.id} 
                              variant="ghost" 
                              className="justify-start gap-2 h-10"
                              onClick={() => copyFromRole(role.id)}
                            >
                              <Shield className="h-4 w-4 text-blue-500" />
{formatRoleName(role.name)}
                            </Button>
                          ))}
                          <div className="h-4" />
                          <Label className="text-xs font-bold text-gray-500 uppercase px-1">Legacy Roles</Label>
                          {legacyRoles.filter(r => r !== selectedRoleId).map(role => (
                            <Button 
                              key={role} 
                              variant="ghost" 
                              className="justify-start gap-2 h-10"
                              onClick={() => copyFromRole(role)}
                            >
                              <History className="h-4 w-4 text-amber-500" />
                              {formatRoleName(role)}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                )}
              </Card>

              {/* Permission Info Card */}
              <Card className="shadow-sm border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    About Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-600">
                  <p>Permissions control what actions users can perform in the system.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]">Critical</Badge>
                      <span className="text-xs">High security risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-[10px]">High</Badge>
                      <span className="text-xs">Elevated privileges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px]">Medium</Badge>
                      <span className="text-xs">Standard access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">Low</Badge>
                      <span className="text-xs">Basic permissions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Area: Permissions Grid */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Search and Global Filters */}
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search by permission name or description..." 
                        className="pl-10 h-11 border-gray-200 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select 
                          className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                          value={filterModule}
                          onChange={(e) => setFilterModule(e.target.value)}
                        >
                          <option value="all">All Modules</option>
                          {modules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <select 
                          className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                          value={filterRisk}
                          onChange={(e) => setFilterRisk(e.target.value)}
                        >
                          <option value="all">All Risk Levels</option>
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categorized Permissions */}
              <div className="space-y-8 pb-20">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <Card className="bg-gray-50 border-dashed">
                    <CardContent className="py-12 flex flex-col items-center text-center">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedRoleId ? 'No permissions in scope' : 'No permissions found'}
                      </h3>
                      <p className="text-gray-500">
                        {selectedRoleId 
                          ? 'This role has no permissions assigned to it. Select another role or add permissions to this role.'
                          : 'Adjust your search or filters to see more results'
                        }
                      </p>
                      {!selectedRoleId && (
                        <p className="text-amber-600 text-sm mt-2">
                          Please select a role from the sidebar to manage its permissions.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* RBAC Warning Banner when role is selected */}
                    {selectedRoleId && scopedTotalOriginal !== totalCount && (
                      <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="py-3 px-4 flex items-center gap-3">
                          <Shield className="h-5 w-5 text-amber-600 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900">
                              Viewing permissions for: <span className="font-bold">{formatRoleName(selectedRole?.name || '')}</span>
                            </p>
                            <p className="text-xs text-amber-700">
                              Showing {scopedTotalCount} of {totalCount} total permissions. Only permissions within this role's scope are displayed.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                    <div key={moduleName} className="space-y-4">
                      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2 border-b">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-1.5 rounded-lg">
                            <Layers className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{moduleName}</h2>
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            {modulePerms.length} Capabilities
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => selectAllInModule(moduleName)}
                            >
                              <CheckSquare className="h-3.5 w-3.5 mr-1" />
                              Select All
                            </Button>
                            <span className="text-gray-300">|</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => deselectAllInModule(moduleName)}
                            >
                              <Square className="h-3.5 w-3.5 mr-1" />
                              Deselect All
                            </Button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {modulePerms.map(p => {
                          const isSelected = currentRolePerms.includes(p.id);
                          // RBAC: Check if permission is in scope for the selected role
                          const inScope = isPermissionInScope(p.id);
                          
                          return (
                            <TooltipProvider key={p.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    onClick={() => inScope ? togglePermission(p.id) : handleTogglePermission(p.id)}
                                    className={cn(
                                      "group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
                                      !inScope && "cursor-not-allowed opacity-60",
                                      inScope && (
                                        isSelected 
                                          ? "bg-white border-blue-500 shadow-md ring-4 ring-blue-50" 
                                          : "bg-white border-transparent shadow-sm hover:border-gray-200 hover:shadow-md cursor-pointer"
                                      )
                                    )}
                                  >
                                    {!inScope && (
                                      <div className="absolute inset-0 bg-gray-50/80 rounded-xl flex items-center justify-center z-10">
                                        <div className="flex items-center gap-2 text-red-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-red-200">
                                          <XCircle className="h-4 w-4" />
                                          <span className="text-xs font-semibold">Out of Scope</span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-1">
                                      <div className={cn(
                                        "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                        isSelected 
                                          ? "bg-blue-600 border-blue-600" 
                                          : inScope ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-gray-100"
                                      )}>
                                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 space-y-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <h4 className={cn(
                                          "font-bold text-sm truncate",
                                          isSelected ? "text-blue-900" : "text-gray-900"
                                        )}>
                                          {p.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                        </h4>
                                        {p.is_critical && (
                                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-8">
                                        {p.description || `Grants user ability to ${p.name.replace(/-/g, ' ')}`}
                                      </p>
                                      
                                      <div className="flex items-center gap-2 pt-2">
                                        <Badge className={cn("text-[10px] px-1.5 h-4 uppercase", getRiskColor(p.risk_level))}>
                                          {p.risk_level}
                                        </Badge>
                                        {p.requires_approval && (
                                          <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-amber-200 text-amber-700 bg-amber-50">
                                            Req. Approval
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Info Popover */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                          <DropdownMenuLabel>Permission Details</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <div className="px-2 py-1.5 space-y-2">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">System ID</div>
                                            <code className="text-xs bg-gray-100 p-1 rounded block">{p.id}</code>
                                            
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Internal Name</div>
                                            <code className="text-xs bg-gray-100 p-1 rounded block">{p.name}</code>
                                            
                                            <div className="text-[10px] font-bold text-gray-400 uppercase">Description</div>
                                            <p className="text-xs text-gray-600 italic">
                                              {p.description || "No detailed description provided for this permission."}
                                            </p>
                                          </div>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="font-medium">{p.name}</p>
                                  <p className="text-xs text-gray-400">{p.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reset Permissions to Default?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action will reset all permissions for <strong>{formatRoleName(selectedRole?.name || '')}</strong> to the system defaults. 
              This cannot be undone. Any custom permissions will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReset}
              className="bg-red-600 hover:bg-red-700"
            >
              Reset Permissions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignRoleDialog} onOpenChange={setShowAssignRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Assign Role to User
            </DialogTitle>
            <DialogDescription>
              Select a user to assign the <strong>{selectedRoleForAssignment?.name}</strong> role to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-select">Select User <span className="text-red-500">*</span></Label>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-500">Loading users...</span>
                </div>
              ) : (
                <Select 
                  value={selectedUserId} 
                  onValueChange={setSelectedUserId}
                  disabled={users.length === 0}
                >
                  <SelectTrigger id="user-select" className="w-full">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users available for assignment
                      </div>
                    ) : (
                      users.map(user => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                            {user.roleModel && (
                              <span className="text-xs text-blue-600">Current role: {user.roleModel.name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedRoleForAssignment && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Role to assign:</span>
                  <span className="text-blue-700">{selectedRoleForAssignment.name}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignRoleDialog(false);
                setSelectedRoleForAssignment(null);
                setSelectedUserId('');
              }}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedUserId || isAssigning || isLoadingUsers}
              className="gap-2"
            >
              {isAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isAssigning ? 'Assigning...' : 'Assign Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </HospitalLayout>
  );
}
