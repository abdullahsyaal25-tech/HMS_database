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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  SearchX,
  Eye,
  EyeOff,
  SlidersHorizontal,
  X,
  Check,
} from 'lucide-react';
import axios from 'axios';
import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';

interface PageProps {
  permissions: Permission[];
  roles: Role[];
  rolePermissions: Record<number, number[]>;
  categories: string[];
  modules: string[];
  legacyRoles: string[];
  legacyRolePermissions: Record<string, number[]>;
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

// Convert role name to human-readable format
const formatRoleName = (roleName: string): string => {
  return roleName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Human-readable labels for permission names
const permissionLabelMap: Record<string, string> = {
  // Users
  'view-users': 'View Users',
  'create-users': 'Create Users',
  'edit-users': 'Edit Users',
  'delete-users': 'Delete Users',
  
  // Roles
  'view-roles': 'View Roles',
  'create-roles': 'Create Roles',
  'edit-roles': 'Edit Roles',
  'delete-roles': 'Delete Roles',
  
  // Patients
  'view-patients': 'View Patients',
  'create-patients': 'Create Patients',
  'edit-patients': 'Edit Patients',
  'delete-patients': 'Delete Patients',
  
  // Pharmacy
  'view-pharmacy': 'View Pharmacy',
  'manage-medicines': 'Manage Medicines',
  'process-prescriptions': 'Process Prescriptions',
  'manage-prescriptions': 'Manage Prescriptions',
  'inventory-management': 'Inventory Management',
  'create-medicines': 'Create Medicines',
  'edit-medicines': 'Edit Medicines',
  'delete-medicines': 'Delete Medicines',
  'create-sales': 'Create Sales',
  'view-sales': 'View Sales',
  'delete-sales': 'Delete Sales',
  'pharmacy-sales': 'Pharmacy Sales',
  
  // Laboratory
  'view-laboratory': 'View Laboratory',
  'manage-lab-tests': 'Manage Lab Tests',
  'process-test-results': 'Process Test Results',
  'quality-control': 'Quality Control',
  'create-lab-tests': 'Create Lab Tests',
  'edit-lab-tests': 'Edit Lab Tests',
  'delete-lab-tests': 'Delete Lab Tests',
  'view-lab-results': 'View Lab Results',
  'create-lab-results': 'Create Lab Results',
  'edit-lab-results': 'Edit Lab Results',
  'manage-lab-materials': 'Manage Lab Materials',
  
  // RBAC
  'view-rbac-dashboard': 'View RBAC Dashboard',
  'manage-role-permissions': 'Manage Role Permissions',
  'view-permission-matrix': 'View Permission Matrix',
  'view-activity-logs': 'View Activity Logs',
  'manage-roles': 'Manage Roles',
  'manage-user-roles': 'Manage User Roles',
  'view-permission-templates': 'View Permission Templates',
  'edit-role-permissions': 'Edit Role Permissions',
  'reset-role-permissions': 'Reset Role Permissions',
  
  // Dashboard
  'view-dashboard': 'View Dashboard',
  
  // Doctors
  'view-doctors': 'View Doctors',
  'create-doctors': 'Create Doctors',
  'edit-doctors': 'Edit Doctors',
  'delete-doctors': 'Delete Doctors',
  
  // Appointments
  'view-appointments': 'View Appointments',
  'create-appointments': 'Create Appointments',
  'edit-appointments': 'Edit Appointments',
  'delete-appointments': 'Delete Appointments',
  'manage-queue': 'Manage Queue',
  'cancel-appointments': 'Cancel Appointments',
  'reschedule-appointments': 'Reschedule Appointments',
  'view-appointment-schedule': 'View Appointment Schedule',
  
  // Reports
  'view-reports': 'View Reports',
  
  // Settings
  'view-settings': 'View Settings',
  
  // Departments
  'view-departments': 'View Departments',
  'create-departments': 'Create Departments',
  'edit-departments': 'Edit Departments',
  
  // Wallet/Finance
  'wallet.view': 'View Wallet',
  'wallet.create': 'Create Wallet Transaction',
  'wallet.edit': 'Edit Wallet Transaction',
};

// Human-readable labels for module names
const moduleLabelMap: Record<string, string> = {
  'users': 'User Management',
  'roles': 'Role Management',
  'patients': 'Patient Management',
  'pharmacy': 'Pharmacy',
  'laboratory': 'Laboratory',
  'rbac': 'Access Control',
  'dashboard': 'Dashboard',
  'doctors': 'Doctor Management',
  'appointments': 'Appointments',
  'reports': 'Reports',
  'settings': 'Settings',
  'departments': 'Departments',
  'wallet': 'Wallet & Finance',
  'system': 'System',
};

// Format permission name to human-readable format
const formatPermissionName = (permissionName: string): string => {
  // First check if we have a direct mapping
  if (permissionLabelMap[permissionName]) {
    return permissionLabelMap[permissionName];
  }
  
  // Otherwise, convert from kebab-case or snake_case to Title Case
  return permissionName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Format module name to human-readable format
const formatModuleName = (moduleName: string): string => {
  // First check if we have a direct mapping
  if (moduleLabelMap[moduleName.toLowerCase()]) {
    return moduleLabelMap[moduleName.toLowerCase()];
  }
  
  // Otherwise, convert from kebab-case or snake_case to Title Case
  return moduleName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Get module icon based on module name (original or formatted)
const getModuleIcon = (moduleName: string) => {
  const normalizedName = moduleName.toLowerCase();
  const moduleIcons: Record<string, string> = {
    // Original module names
    'patients': '👥',
    'patient-management': '👥',
    'appointments': '📅',
    'doctors': '👨‍⚕️',
    'doctor-management': '👨‍⚕️',
    'pharmacy': '💊',
    'laboratory': '🔬',
    'billing': '💰',
    'reports': '📊',
    'admin': '⚙️',
    'rbac': '🛡️',
    'access-control': '🛡️',
    'settings': '🔧',
    'users': '👤',
    'user-management': '👤',
    'roles': '🔐',
    'role-management': '🔐',
    'departments': '🏥',
    'wallet': '💰',
    'wallet & finance': '💰',
    'dashboard': '📊',
    'system': '🔒',
  };
  
  return moduleIcons[normalizedName] || '📦';
};

// Module color mapping - supports both original and formatted module names
const getModuleColors = (moduleName: string) => {
  const normalizedName = moduleName.toLowerCase();
  const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    // Original module names
    'patients': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
    'patient-management': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
    'appointments': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' },
    'doctors': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600' },
    'doctor-management': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600' },
    'pharmacy': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
    'laboratory': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600' },
    'billing': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'bg-green-100 text-green-600' },
    'wallet': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'bg-green-100 text-green-600' },
    'wallet & finance': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'bg-green-100 text-green-600' },
    'reports': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
    'admin': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' },
    'users': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' },
    'user-management': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' },
    'rbac': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100 text-red-600' },
    'access-control': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100 text-red-600' },
    'settings': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'bg-gray-100 text-gray-600' },
    'departments': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'bg-teal-100 text-teal-600' },
    'dashboard': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600' },
    'roles': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    'role-management': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    'system': { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700', icon: 'bg-zinc-100 text-zinc-600' },
  };
  
  return colors[normalizedName] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' };
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
  
  // Expanded modules state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  
  // Initialize all modules as expanded
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    modules.forEach(m => {
      initialExpanded[m] = true;
    });
    setExpandedModules(initialExpanded);
  }, [modules]);

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

  // Filter panel visibility
  const [showFilters, setShowFilters] = useState(false);

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
    if (!selectedRoleId) return true;
    if (user?.is_super_admin) return true;
    return currentRolePermissionScope.includes(permissionId);
  }, [selectedRoleId, currentRolePermissionScope, user]);

  // Toggle individual permission
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

  // Toggle module expansion
  const toggleModuleExpansion = useCallback((moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  }, []);

  // Bulk operations
  const selectAllInModule = useCallback((moduleName: string) => {
    const modulePerms = permissions.filter(p => p.module === moduleName).map(p => p.id);
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

  // Filtering logic
  const filteredPermissions = useMemo(() => {
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

  // Count selected in each module
  const moduleSelectedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(groupedPermissions).forEach(([moduleName, perms]) => {
      counts[moduleName] = perms.filter(p => currentRolePerms.includes(p.id)).length;
    });
    return counts;
  }, [groupedPermissions, currentRolePerms]);

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
  const scopedTotalCount = filteredPermissions.length;
  const scopedTotalOriginal = selectedRoleId 
    ? currentRolePermissionScope.length 
    : permissions.length;

  const hasActiveFilters = searchQuery || filterModule !== 'all' || filterRisk !== 'all';

  return (
    <HospitalLayout>
      <Head title="Permissions Management" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Lock className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Permissions Management
                  </h1>
                  <p className="text-slate-500 mt-1">Configure role-based access control and security policies</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 shadow-sm">
                    <AlertTriangle className="h-3 w-3 mr-1.5 animate-pulse" />
                    Unsaved Changes
                  </Badge>
                )}
                <Button 
                  variant="outline" 
                  className="gap-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  onClick={resetToDefault}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
                <Button 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 border-0"
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
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Roles</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{roles.length + legacyRoles.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Available Permissions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {selectedRoleId ? scopedTotalCount : totalCount}
                      {selectedRoleId && scopedTotalOriginal !== scopedTotalCount && (
                        <span className="text-sm font-normal text-slate-400 ml-1">/ {scopedTotalOriginal}</span>
                      )}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
                    <Lock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Selected</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{selectedCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn(
              "border shadow-sm transition-all",
              selectedRoleId 
                ? "bg-gradient-to-br from-indigo-50 to-white border-indigo-200" 
                : "bg-white border-slate-200"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-500">Current Role</p>
                    <p className="text-lg font-bold text-slate-900 truncate mt-1">
                      {formatRoleName(selectedRole?.name || '') || 'None Selected'}
                    </p>
                    {!selectedRoleId && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Select a role to manage
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    selectedRoleId 
                      ? "bg-gradient-to-br from-indigo-100 to-indigo-200" 
                      : "bg-gradient-to-br from-slate-100 to-slate-200"
                  )}>
                    {selectedRoleId ? (
                      <ShieldCheck className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar: Role Selection */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-white border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        System Roles
                      </h2>
                      <p className="text-slate-300 text-sm mt-0.5">Select a role to configure</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 text-white border-0 gap-1.5 h-9"
                      onClick={() => setShowAddRoleDialog(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Role
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full rounded-none bg-slate-50 border-b border-slate-200 h-12 p-1">
                      <TabsTrigger 
                        value="new" 
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 h-full text-sm font-medium"
                      >
                        <ShieldCheck className="h-4 w-4 mr-1.5" />
                        Normalized
                        <Badge variant="secondary" className="ml-1.5 bg-blue-100 text-blue-700 text-[10px]">
                          {roles.length}
                        </Badge>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="legacy" 
                        className="flex-1 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 h-full text-sm font-medium"
                      >
                        <History className="h-4 w-4 mr-1.5" />
                        Legacy
                        <Badge variant="secondary" className="ml-1.5 bg-amber-100 text-amber-700 text-[10px]">
                          {legacyRoles.length}
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="h-[500px] overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <TabsContent value="new" className="mt-0 space-y-1">
                          {roles.map(role => {
                            const isSelected = selectedRoleId === role.id;
                            const permCount = rolePermissions[role.id]?.length || 0;
                            const userCount = roleUserCounts[role.id] || 0;
                            
                            return (
                              <div
                                key={role.id}
                                onClick={() => handleRoleChange(role.id)}
                                className={cn(
                                  "group relative w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border",
                                  isSelected 
                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm" 
                                    : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"
                                )}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
                                )}
                                
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                  )}>
                                    <ShieldCheck className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold truncate">{formatRoleName(role.name)}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-2">
                                      <span>{permCount} permissions</span>
                                      {userCount > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-emerald-600">{userCount} users</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {role.is_system && (
                                    <Badge variant="outline" className="text-[9px] h-5 bg-slate-50 text-slate-500 border-slate-200">
                                      SYS
                                    </Badge>
                                  )}
                                  {userCount > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openAssignRoleDialog(role);
                                            }}
                                            className={cn(
                                              "p-1.5 rounded-lg transition-colors",
                                              isSelected 
                                                ? "bg-blue-100 text-blue-600 hover:bg-blue-200" 
                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                            )}
                                          >
                                            <UserPlus className="h-3.5 w-3.5" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Assign to users</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </TabsContent>
                        
                        <TabsContent value="legacy" className="mt-0 space-y-1">
                          {legacyRoles.map(role => {
                            const isSelected = selectedRoleId === role;
                            const permCount = legacyRolePermissions[role]?.length || 0;
                            
                            return (
                              <div
                                key={role}
                                onClick={() => handleRoleChange(role)}
                                className={cn(
                                  "group relative w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border",
                                  isSelected 
                                    ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200 shadow-sm" 
                                    : "text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-200"
                                )}
                              >
                                {isSelected && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r-full" />
                                )}
                                
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                    isSelected ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                  )}>
                                    <History className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold truncate capitalize">{formatRoleName(role)}</div>
                                    <div className="text-xs text-slate-400">
                                      {permCount} permissions
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </TabsContent>
                      </div>
                    </div>
                  </Tabs>
                </CardContent>
                
                {canViewPermissionTemplates && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full gap-2 border-slate-200 hover:bg-slate-100">
                          <Copy className="h-4 w-4" />
                          Apply Permission Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Copy className="h-5 w-5 text-blue-600" />
                            Apply Permission Template
                          </DialogTitle>
                          <DialogDescription>
                            Choose an existing role to copy all permissions from. This will replace the current selections.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto py-4">
                          <Label className="text-xs font-bold text-slate-500 uppercase px-1">Normalized Roles</Label>
                          {roles.filter(r => r.id !== selectedRoleId).map(role => (
                            <Button 
                              key={role.id} 
                              variant="ghost" 
                              className="justify-start gap-3 h-12 hover:bg-slate-50"
                              onClick={() => copyFromRole(role.id)}
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <ShieldCheck className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{formatRoleName(role.name)}</div>
                                <div className="text-xs text-slate-400">{rolePermissions[role.id]?.length || 0} permissions</div>
                              </div>
                            </Button>
                          ))}
                          <Separator className="my-2" />
                          <Label className="text-xs font-bold text-slate-500 uppercase px-1">Legacy Roles</Label>
                          {legacyRoles.filter(r => r !== selectedRoleId).map(role => (
                            <Button 
                              key={role} 
                              variant="ghost" 
                              className="justify-start gap-3 h-12 hover:bg-slate-50"
                              onClick={() => copyFromRole(role)}
                            >
                              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                <History className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium capitalize">{formatRoleName(role)}</div>
                                <div className="text-xs text-slate-400">{legacyRolePermissions[role]?.length || 0} permissions</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </Card>

              {/* Help Card */}
              <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-lg shadow-slate-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-700">
                    <Info className="h-4 w-4 text-blue-600" />
                    Permission Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Critical</Badge>
                    <span className="text-xs text-slate-500">High security risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-[10px]">High</Badge>
                    <span className="text-xs text-slate-500">Elevated privileges</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px]">Medium</Badge>
                    <span className="text-xs text-slate-500">Standard access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">Low</Badge>
                    <span className="text-xs text-slate-500">Basic permissions</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Area: Permissions Grid */}
            <div className="lg:col-span-9 space-y-4">
              
              {/* Search and Filters */}
              <Card className="bg-white border-slate-200 shadow-lg shadow-slate-200/50">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search permissions by name or description..." 
                        className="pl-10 h-11 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button
                        variant={showFilters ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "gap-2 h-11",
                          showFilters ? "bg-slate-800 hover:bg-slate-700" : "border-slate-200 hover:bg-slate-50"
                        )}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                          <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-[10px] h-5 px-1.5">
                            {(searchQuery ? 1 : 0) + (filterModule !== 'all' ? 1 : 0) + (filterRisk !== 'all' ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                      
                      {hasActiveFilters && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterModule('all');
                            setFilterRisk('all');
                          }}
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Expandable Filters */}
                  {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                          <Layers className="h-4 w-4 text-slate-400" />
                          <select 
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer flex-1 text-slate-700"
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                          >
                            <option value="all">All Modules</option>
                            {modules.map(m => <option key={m} value={m}>{formatModuleName(m)}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50/50">
                          <AlertTriangle className="h-4 w-4 text-slate-400" />
                          <select 
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer flex-1 text-slate-700"
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
                  )}
                </CardContent>
              </Card>

              {/* RBAC Warning Banner */}
              {selectedRoleId && scopedTotalOriginal !== totalCount && (
                <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 shadow-sm">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        Managing permissions for: <span className="font-bold">{formatRoleName(selectedRole?.name || '')}</span>
                      </p>
                      <p className="text-xs text-amber-700">
                        Showing {scopedTotalCount} of {totalCount} total permissions in scope
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Categorized Permissions */}
              <div className="space-y-6 pb-24">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <Card className="bg-white border-slate-200 border-dashed">
                    <CardContent className="py-16 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <SearchX className="h-10 w-10 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">
                        {selectedRoleId ? 'No permissions in scope' : 'No permissions found'}
                      </h3>
                      <p className="text-slate-500 max-w-md">
                        {selectedRoleId 
                          ? 'This role has no permissions assigned to it. Select another role or add permissions to this role.'
                          : 'Adjust your search or filters to see more results'
                        }
                      </p>
                      {!selectedRoleId && (
                        <p className="text-amber-600 text-sm mt-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Please select a role from the sidebar to manage its permissions.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => {
                    const moduleColors = getModuleColors(moduleName);
                    const isExpanded = expandedModules[moduleName] !== false;
                    const selectedInModule = moduleSelectedCounts[moduleName] || 0;
                    
                    return (
                      <Card key={moduleName} className="bg-white border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                        {/* Module Header */}
                        <div 
                          className={cn(
                            "px-5 py-4 cursor-pointer transition-colors",
                            moduleColors.bg
                          )}
                          onClick={() => toggleModuleExpansion(moduleName)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                                moduleColors.icon
                              )}>
                                {getModuleIcon(moduleName)}
                              </div>
                              <div>
                                <h2 className="text-lg font-bold text-slate-900">{formatModuleName(moduleName)}</h2>
                                <p className="text-sm text-slate-500">
                                  {selectedInModule} of {modulePerms.length} selected
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Progress bar */}
                              <div className="hidden sm:flex items-center gap-2">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all",
                                      selectedInModule === modulePerms.length 
                                        ? "bg-emerald-500" 
                                        : selectedInModule > 0 
                                          ? "bg-blue-500" 
                                          : "bg-slate-300"
                                    )}
                                    style={{ width: `${(selectedInModule / modulePerms.length) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">
                                  {Math.round((selectedInModule / modulePerms.length) * 100)}%
                                </span>
                              </div>
                              
                              {/* Expand/Collapse */}
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                isExpanded ? "bg-white/80 text-slate-600" : "bg-white text-slate-400"
                              )}>
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          {isExpanded && (
                            <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectAllInModule(moduleName);
                                  }}
                                >
                                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                                  Select All
                                </Button>
                                <span className="text-slate-300">|</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-xs h-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deselectAllInModule(moduleName);
                                  }}
                                >
                                  <Square className="h-3.5 w-3.5 mr-1" />
                                  Deselect All
                                </Button>
                              </div>
                              <Badge variant="secondary" className="bg-white/80 text-slate-600">
                                {modulePerms.length} Capabilities
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        {/* Permissions Grid */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {modulePerms.map(p => {
                                const isSelected = currentRolePerms.includes(p.id);
                                const inScope = isPermissionInScope(p.id);
                                
                                return (
                                  <TooltipProvider key={p.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div 
                                          onClick={() => inScope ? togglePermission(p.id) : handleTogglePermission(p.id)}
                                          className={cn(
                                            "group relative flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer",
                                            !inScope && "cursor-not-allowed opacity-60",
                                            inScope && (
                                              isSelected 
                                                ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-100" 
                                                : "bg-white border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md"
                                            )
                                          )}
                                        >
                                          {!inScope && (
                                            <div className="absolute inset-0 bg-slate-50/90 rounded-xl flex items-center justify-center z-10">
                                              <div className="flex items-center gap-1.5 text-red-600 bg-white px-2.5 py-1 rounded-full shadow-sm border border-red-200 text-xs font-semibold">
                                                <XCircle className="h-3.5 w-3.5" />
                                                Out of Scope
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div className={cn(
                                            "mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                                            isSelected 
                                              ? "bg-blue-600 border-blue-600" 
                                              : inScope ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-100"
                                          )}>
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                          </div>
                                          
                                          <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <h4 className={cn(
                                                "font-semibold text-sm truncate",
                                                isSelected ? "text-blue-900" : "text-slate-900"
                                              )}>
                                                {formatPermissionName(p.name)}
                                              </h4>
                                              {p.is_critical && (
                                                <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                              {p.description || `Grants ability to ${p.name.replace(/-/g, ' ')}`}
                                            </p>
                                            
                                            <div className="flex items-center gap-1.5 pt-1">
                                              <Badge className={cn("text-[9px] px-1.5 h-4 uppercase font-medium", getRiskColor(p.risk_level))}>
                                                {p.risk_level}
                                              </Badge>
                                              {p.requires_approval && (
                                                <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-amber-200 text-amber-700 bg-amber-50">
                                                  Approval
                                                </Badge>
                                              )}
                                            </div>
                                          </div>

                                          {/* More Info Dropdown */}
                                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-slate-100">
                                                  <MoreVertical className="h-4 w-4 text-slate-400" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-60">
                                                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase">
                                                  Permission Details
                                                </DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <div className="px-3 py-2 space-y-2">
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase">System ID</div>
                                                  <code className="text-xs bg-slate-100 px-2 py-1 rounded block font-mono">{p.id}</code>
                                                  
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-2">Internal Name</div>
                                                  <code className="text-xs bg-slate-100 px-2 py-1 rounded block font-mono text-slate-600">{p.name}</code>
                                                  
                                                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-2">Description</div>
                                                  <p className="text-xs text-slate-600 italic">
                                                    {p.description || "No detailed description provided."}
                                                  </p>
                                                </div>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs">
                                        <p className="font-medium">{formatPermissionName(p.name)}</p>
                                        <p className="text-xs text-slate-400">{p.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })
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

      {/* Add Role Dialog */}
      <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Role
            </DialogTitle>
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
                className="border-slate-200 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description (Optional)</Label>
              <textarea
                id="role-description"
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={isSubmitting || !newRoleName.trim()}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
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
                  <span className="ml-2 text-slate-500">Loading users...</span>
                </div>
              ) : (
                <Select 
                  value={selectedUserId} 
                  onValueChange={setSelectedUserId}
                  disabled={users.length === 0}
                >
                  <SelectTrigger id="user-select" className="w-full border-slate-200">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">
                        No users available for assignment
                      </div>
                    ) : (
                      users.map(user => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                            {user.roleModel && (
                              <span className="text-xs text-blue-600">Current: {user.roleModel.name}</span>
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
              className="border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={!selectedUserId || isAssigning || isLoadingUsers}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
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
