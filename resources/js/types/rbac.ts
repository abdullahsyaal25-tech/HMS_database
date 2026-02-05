export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  priority: number;
  is_system: boolean;
  is_super_admin: boolean;
  parent_role_id?: number;
  reporting_structure?: string;
  module_access?: string[];
  data_visibility_scope?: Record<string, unknown>;
  user_management_capabilities?: string[];
  system_configuration_access?: string[];
  reporting_permissions?: string[];
  role_specific_limitations?: string[];
  mfa_required?: boolean;
  mfa_grace_period_days?: number;
  session_timeout_minutes?: number;
  concurrent_session_limit?: number;
  created_at?: string;
  updated_at?: string;
  users_count?: number;
  permissions_count?: number;
  parent_role?: Role;
  child_roles?: Role[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  is_critical: boolean;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  role_id: number;
  role?: string;
  roleModel?: Role;
  permissions?: string[];
  two_factor_confirmed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RBACStats {
  total_roles: number;
  active_permissions: number;
  assigned_users: number;
  pending_requests: number;
  security_violations: number;
  role_distribution: {
    role_id: number;
    role_name: string;
    user_count: number;
    percentage: number;
  }[];
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id: number;
  target_name: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface PermissionMatrixRow {
  permission_id: number;
  permission_name: string;
  permission_description: string;
  roles: {
    role_id: number;
    role_name: string;
    has_permission: boolean;
  }[];
}

export interface PermissionEscalationRequest {
  id: number;
  requester_id: number;
  requested_permissions: string[];
  justification: string;
  duration_hours: number;
  escalation_level: number;
  status: 'pending' | 'approved' | 'denied' | 'active' | 'expired';
  requested_at: string;
  expires_at: string;
  approvals?: ApprovalInfo[];
}

export interface ApprovalInfo {
  approver_id: number;
  approver_name: string;
  approved_at: string;
}

export interface SecurityAlert {
  id: number;
  type: string;
  details: Record<string, unknown>;
  severity: 'info' | 'warning' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface PrivilegeAuditResult {
  user_id: number;
  user_name: string;
  role: string;
  audit_date: string;
  findings: {
    permission_anomalies: AnomalyInfo[];
    cross_department_access: ViolationInfo[];
    recent_role_changes: RoleChangeInfo[];
    temporary_permissions: TemporaryPermissionInfo[];
    mfa_status: MfaStatusInfo;
  };
  risk_score: number;
  recommendations: string[];
}

export interface AnomalyInfo {
  type: string;
  description: string;
  permission_count?: number;
  threshold?: number;
  role_priority?: number;
  sensitive_permission_count?: number;
  change_count?: number;
  timeframe_hours?: number;
}

export interface ViolationInfo {
  type: string;
  description: string;
  accessed_module?: string;
  assigned_modules?: string[];
  resource?: string;
  timestamp?: string;
  accessed_department?: string;
  assigned_department?: string;
  resource_type?: string;
  resource_id?: number;
}

export interface RoleChangeInfo {
  action: string;
  timestamp: string;
  details?: {
    old_role_id?: number;
    new_role_id?: number;
  };
}

export interface TemporaryPermissionInfo {
  permission: string;
  expires_at: string;
  reason: string;
}

export interface MfaStatusInfo {
  compliant: boolean;
  has_mfa: boolean;
  role_mfa_required: boolean;
  reason: string;
  grace_period_end?: string;
  days_remaining?: number;
}
