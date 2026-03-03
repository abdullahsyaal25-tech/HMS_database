import { Head, router, usePage } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Search, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  Filter,
  ArrowLeft,
  User,
  Mail,
  Loader2,
  Users,
  Info,
  XCircle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  SearchX,
  Check,
  X,
  Copy,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Permission type definition
interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  resource: string;
  category?: string;
  requires_approval?: boolean;
  is_critical?: boolean;
}

// User permission override
interface PermissionOverride {
  id: number;
  allowed: boolean;
  permission: {
    id: number;
    name: string;
    description: string;
  };
}

// User data structure
interface UserData {
  id: number;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  is_super_admin: boolean;
}

// Permissions data structure
interface PermissionsData {
  all: Permission[];
  by_module: Record<string, Permission[]>;
  categories: string[];
  modules: string[];
}

// User permissions data
interface UserPermissionsData {
  effective: string[];
  role_based: number[];
  overrides: Record<string, PermissionOverride>;
}

// Page props interface
interface UserPermissionsProps {
  user: UserData;
  permissions: PermissionsData;
  user_permissions: UserPermissionsData;
  flash?: {
    success?: string;
    error?: string;
  };
  auth: {
    user: {
      id: number;
      name: string;
      is_super_admin?: boolean;
    };
  };
}

// Permission state type
type PermissionState = 'inherited' | 'granted' | 'revoked';

// Human-readable labels for permission names
const permissionLabelMap: Record<string, string> = {
  'view-users': 'View Users',
  'create-users': 'Create Users',
  'edit-users': 'Edit Users',
  'delete-users': 'Delete Users',
  'view-roles': 'View Roles',
  'create-roles': 'Create Roles',
  'edit-roles': 'Edit Roles',
  'delete-roles': 'Delete Roles',
  'view-patients': 'View Patients',
  'create-patients': 'Create Patients',
  'edit-patients': 'Edit Patients',
  'delete-patients': 'Delete Patients',
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
  'view-rbac-dashboard': 'View RBAC Dashboard',
  'manage-role-permissions': 'Manage Role Permissions',
  'view-permission-matrix': 'View Permission Matrix',
  'view-activity-logs': 'View Activity Logs',
  'manage-roles': 'Manage Roles',
  'manage-user-roles': 'Manage User Roles',
  'view-permission-templates': 'View Permission Templates',
  'edit-role-permissions': 'Edit Role Permissions',
  'reset-role-permissions': 'Reset Role Permissions',
  'view-dashboard': 'View Dashboard',
  'view-doctors': 'View Doctors',
  'create-doctors': 'Create Doctors',
  'edit-doctors': 'Edit Doctors',
  'delete-doctors': 'Delete Doctors',
  'view-appointments': 'View Appointments',
  'create-appointments': 'Create Appointments',
  'edit-appointments': 'Edit Appointments',
  'delete-appointments': 'Delete Appointments',
  'manage-queue': 'Manage Queue',
  'cancel-appointments': 'Cancel Appointments',
  'reschedule-appointments': 'Reschedule Appointments',
  'view-appointment-schedule': 'View Appointment Schedule',
  'view-reports': 'View Reports',
  'view-settings': 'View Settings',
  'view-departments': 'View Departments',
  'create-departments': 'Create Departments',
  'edit-departments': 'Edit Departments',
  'wallet.view': 'View Wallet',
  'wallet.create': 'Create Wallet Transaction',
  'wallet.edit': 'Edit Wallet Transaction',
  'manage-permissions': 'Manage Permissions',
  'manage-users': 'Manage Users',
  'manage-user-permissions': 'Manage User Permissions',
};

// Module label mapping
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

// Module icon mapping
const getModuleIcon = (moduleName: string): string => {
  const icons: Record<string, string> = {
    'patients': '👥',
    'patient-management': '👥',
    'appointments': '📅',
    'doctors': '👨‍⚕️',
    'doctor-management': '👨‍⚕️',
    'pharmacy': '💊',
    'laboratory': '🔬',
    'billing': '💰',
    'wallet': '💰',
    'reports': '📊',
    'admin': '⚙️',
    'users': '👤',
    'user-management': '👤',
    'roles': '🔐',
    'role-management': '🔐',
    'rbac': '🛡️',
    'access-control': '🛡️',
    'settings': '🔧',
    'departments': '🏥',
    'dashboard': '📊',
    'system': '🔒',
  };
  return icons[moduleName.toLowerCase()] || '📦';
};

// Module color mapping
const getModuleColors = (moduleName: string) => {
  const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    'patients': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
    'appointments': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' },
    'doctors': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100 text-cyan-600' },
    'pharmacy': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
    'laboratory': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'bg-orange-100 text-orange-600' },
    'wallet': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'bg-green-100 text-green-600' },
    'reports': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
    'users': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' },
    'rbac': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100 text-red-600' },
    'settings': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'bg-gray-100 text-gray-600' },
    'departments': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: 'bg-teal-100 text-teal-600' },
    'dashboard': { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-600' },
    'roles': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
    'system': { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700', icon: 'bg-zinc-100 text-zinc-600' },
  };
  return colors[moduleName.toLowerCase()] || { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-600' };
};

// Format permission name
const formatPermissionName = (name: string): string => {
  if (permissionLabelMap[name]) return permissionLabelMap[name];
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Format module name
const formatModuleName = (name: string): string => {
  if (moduleLabelMap[name.toLowerCase()]) return moduleLabelMap[name.toLowerCase()];
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Get risk level styles
const getRiskStyles = (risk: string) => {
  switch (risk) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

// Get risk level label
const getRiskLabel = (risk: string): string => {
  switch (risk) {
    case 'critical': return 'Critical';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    default: return 'Low';
  }
};

export default function UserPermissions({ user, permissions, user_permissions, flash }: UserPermissionsProps) {
  const page = usePage();
  const { showSuccess, showError, showWarning } = useToast();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<number, PermissionState>>({});
  
  // Initialize expanded modules
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    permissions.modules.forEach(m => {
      initialExpanded[m] = true;
    });
    setExpandedModules(initialExpanded);
  }, [permissions.modules]);
  
  // Initialize selected permissions from user data
  useEffect(() => {
    const initial: Record<number, PermissionState> = {};
    
    // Set inherited permissions (from role)
    user_permissions.role_based.forEach(id => {
      initial[id] = 'inherited';
    });
    
    // Override with user-specific settings
    Object.entries(user_permissions.overrides).forEach(([permId, override]) => {
      initial[parseInt(permId)] = override.allowed ? 'granted' : 'revoked';
    });
    
    setSelectedPermissions(initial);
  }, [user_permissions]);
  
  // Handle flash messages
  useEffect(() => {
    if (flash?.success) {
      showSuccess('Success', flash.success);
    }
    if (flash?.error) {
      showError('Error', flash.error);
    }
  }, [flash, showSuccess, showError]);
  
  // Filter permissions
  const filteredPermissions = useMemo(() => {
    return permissions.all.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesModule = filterModule === 'all' || p.module === filterModule;
      const matchesRisk = filterRisk === 'all' || p.risk_level === filterRisk;
      
      return matchesSearch && matchesModule && matchesRisk;
    });
  }, [permissions.all, searchQuery, filterModule, filterRisk]);
  
  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    filteredPermissions.forEach(p => {
      const module = p.module || 'System';
      if (!groups[module]) groups[module] = [];
      groups[module].push(p);
    });
    return groups;
  }, [filteredPermissions]);
  
  // Get effective permission state
  const getPermissionState = useCallback((permissionId: number): PermissionState => {
    if (selectedPermissions[permissionId]) {
      return selectedPermissions[permissionId];
    }
    if (user_permissions.role_based.includes(permissionId)) {
      return 'inherited';
    }
    return 'revoked';
  }, [selectedPermissions, user_permissions.role_based]);
  
  // Toggle permission state
  const togglePermission = useCallback((permissionId: number) => {
    setSelectedPermissions(prev => {
      const current = prev[permissionId] || getPermissionState(permissionId);
      let next: PermissionState;
      
      // Cycle through states: inherited -> granted -> revoked -> inherited
      if (current === 'inherited') {
        next = 'granted';
      } else if (current === 'granted') {
        next = 'revoked';
      } else {
        // If it was revoked and originally inherited, go back to inherited
        // Otherwise stay revoked (explicit deny)
        next = user_permissions.role_based.includes(permissionId) ? 'inherited' : 'revoked';
      }
      
      setHasUnsavedChanges(true);
      return { ...prev, [permissionId]: next };
    });
  }, [getPermissionState, user_permissions.role_based]);
  
  // Toggle module expansion
  const toggleModuleExpansion = useCallback((moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  }, []);
  
  // Bulk grant all in module
  const grantAllInModule = useCallback((moduleName: string) => {
    const modulePerms = permissions.by_module[moduleName] || [];
    setSelectedPermissions(prev => {
      const updated = { ...prev };
      modulePerms.forEach(p => {
        updated[p.id] = 'granted';
      });
      return updated;
    });
    setHasUnsavedChanges(true);
    showSuccess('Permissions Granted', `All permissions in ${formatModuleName(moduleName)} have been granted.`);
  }, [permissions.by_module, showSuccess]);
  
  // Bulk revoke all in module
  const revokeAllInModule = useCallback((moduleName: string) => {
    const modulePerms = permissions.by_module[moduleName] || [];
    setSelectedPermissions(prev => {
      const updated = { ...prev };
      modulePerms.forEach(p => {
        updated[p.id] = 'revoked';
      });
      return updated;
    });
    setHasUnsavedChanges(true);
    showWarning('Permissions Revoked', `All permissions in ${formatModuleName(moduleName)} have been revoked.`);
  }, [permissions.by_module, showWarning]);
  
  // Save changes
  const handleSave = useCallback(() => {
    setIsSaving(true);
    
    const grantPermissions: number[] = [];
    const revokePermissions: number[] = [];
    
    Object.entries(selectedPermissions).forEach(([permId, state]) => {
      const id = parseInt(permId);
      if (state === 'granted') {
        grantPermissions.push(id);
      } else if (state === 'revoked' && user_permissions.role_based.includes(id)) {
        // Only add to revoke if it was originally inherited
        revokePermissions.push(id);
      }
    });
    
    router.put(`/admin/users/${user.id}/permissions`, {
      grant_permissions: grantPermissions,
      revoke_permissions: revokePermissions,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsSaving(false);
        setHasUnsavedChanges(false);
        showSuccess('Permissions Saved', 'User permissions have been updated successfully.');
      },
      onError: (errors) => {
        setIsSaving(false);
        console.error('Failed to save permissions:', errors);
        showError('Save Failed', 'Failed to save permissions. Please try again.');
      }
    });
  }, [selectedPermissions, user.id, user_permissions.role_based, showSuccess, showError]);
  
  // Reset to default
  const handleReset = useCallback(() => {
    setShowResetDialog(true);
  }, []);
  
  const confirmReset = useCallback(() => {
    setShowResetDialog(false);
    setSelectedPermissions({});
    setHasUnsavedChanges(true);
    showSuccess('Permissions Reset', 'Permissions have been reset to role defaults.');
  }, [showSuccess]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    let inherited = 0;
    let granted = 0;
    let revoked = 0;
    
    Object.values(selectedPermissions).forEach(state => {
      if (state === 'inherited') inherited++;
      else if (state === 'granted') granted++;
      else if (state === 'revoked') revoked++;
    });
    
    // Count inherited from role that haven't been overridden
    user_permissions.role_based.forEach(id => {
      if (!selectedPermissions[id]) inherited++;
    });
    
    return { inherited, granted, revoked, total: permissions.all.length };
  }, [selectedPermissions, user_permissions.role_based, permissions.all.length]);
  
  // Get state badge
  const getStateBadge = (state: PermissionState) => {
    switch (state) {
      case 'inherited':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Info className="w-3 h-3 mr-1" />
            Inherited
          </Badge>
        );
      case 'granted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Granted
          </Badge>
        );
      case 'revoked':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Revoked
          </Badge>
        );
    }
  };
  
  // Get state toggle styles
  const getToggleStyles = (state: PermissionState) => {
    switch (state) {
      case 'inherited':
        return 'data-[state=checked]:bg-blue-500';
      case 'granted':
        return 'data-[state=checked]:bg-green-500';
      case 'revoked':
        return 'data-[state=unchecked]:bg-red-300';
    }
  };
  
  const hasActiveFilters = searchQuery || filterModule !== 'all' || filterRisk !== 'all';
  
  return (
    <HospitalLayout>
      <Head title={`Permissions - ${user.name}`} />
      
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* User Header Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.visit('/admin/users')}
                  className="shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                      {user.username && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {user.username}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email || 'No email'}
                      </span>
                      <Badge variant={user.is_super_admin ? "destructive" : "secondary"}>
                        {user.role_name || user.role || 'No Role'}
                      </Badge>
                      {user.is_super_admin && (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Role Permissions Summary */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.inherited}</div>
                  <div className="text-xs text-gray-500">Inherited</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.granted}</div>
                  <div className="text-xs text-gray-500">Granted</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
                  <div className="text-xs text-gray-500">Revoked</div>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{stats.inherited + stats.granted}</div>
                  <div className="text-xs text-gray-500">Effective</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
                {/* Module Filter */}
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {permissions.modules.map(module => (
                      <SelectItem key={module} value={module}>
                        {getModuleIcon(module)} {formatModuleName(module)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Risk Filter */}
                <Select value={filterRisk} onValueChange={setFilterRisk}>
                  <SelectTrigger className="w-[150px]">
                    <ShieldAlert className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Risks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSearchQuery('');
                    setFilterModule('all');
                    setFilterRisk('all');
                  }}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasUnsavedChanges}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={hasUnsavedChanges ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
            
            {/* Unsaved Changes Indicator */}
            {hasUnsavedChanges && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">You have unsaved changes. Click Save Changes to apply them.</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Permissions Matrix */}
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => {
            const colors = getModuleColors(moduleName);
            const isExpanded = expandedModules[moduleName] !== false;
            const moduleStateCount = {
              inherited: 0,
              granted: 0,
              revoked: 0,
            };
            
            modulePermissions.forEach(p => {
              const state = getPermissionState(p.id);
              moduleStateCount[state]++;
            });
            
            return (
              <Card key={moduleName} className={cn("overflow-hidden", colors.bg, colors.border)}>
                <CardHeader 
                  className={cn("p-4 cursor-pointer hover:opacity-90 transition-opacity", colors.bg)}
                  onClick={() => toggleModuleExpansion(moduleName)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", colors.icon)}>
                        <span className="text-xl">{getModuleIcon(moduleName)}</span>
                      </div>
                      <div>
                        <CardTitle className={cn("text-lg", colors.text)}>
                          {formatModuleName(moduleName)}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {modulePermissions.length} permissions
                          {moduleStateCount.granted > 0 && (
                            <span className="ml-2 text-green-600">+{moduleStateCount.granted} granted</span>
                          )}
                          {moduleStateCount.revoked > 0 && (
                            <span className="ml-2 text-red-600">-{moduleStateCount.revoked} revoked</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Bulk Actions */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                grantAllInModule(moduleName);
                              }}
                            >
                              <CheckSquare className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Grant all in module</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                revokeAllInModule(moduleName);
                              }}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Revoke all in module</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {isExpanded ? (
                        <ChevronDown className={cn("h-5 w-5", colors.text)} />
                      ) : (
                        <ChevronRight className={cn("h-5 w-5", colors.text)} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="p-0 bg-white">
                    <div className="divide-y divide-gray-100">
                      {modulePermissions.map((permission) => {
                        const state = getPermissionState(permission.id);
                        
                        return (
                          <div
                            key={permission.id}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-gray-900">
                                    {formatPermissionName(permission.name)}
                                  </h4>
                                  {getStateBadge(state)}
                                  <Badge variant="outline" className={getRiskStyles(permission.risk_level)}>
                                    {getRiskLabel(permission.risk_level)}
                                  </Badge>
                                  {permission.is_critical && (
                                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                      <ShieldAlert className="h-3 w-3 mr-1" />
                                      Critical
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {permission.description || 'No description available'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Layers className="h-3 w-3" />
                                    {permission.resource}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" />
                                    {permission.action}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={state === 'granted' || (state === 'inherited' && user_permissions.role_based.includes(permission.id))}
                                          onCheckedChange={() => togglePermission(permission.id)}
                                          className={cn(getToggleStyles(state))}
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {state === 'inherited' && 'Inherited from role'}
                                      {state === 'granted' && 'Explicitly granted'}
                                      {state === 'revoked' && 'Explicitly revoked'}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          
          {Object.keys(groupedPermissions).length === 0 && (
            <Card className="p-12 text-center">
              <SearchX className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No permissions found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterModule('all');
                    setFilterRisk('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Permissions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all permissions to their role defaults. Any custom grants or revokes will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-red-600 hover:bg-red-700">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HospitalLayout>
  );
}
