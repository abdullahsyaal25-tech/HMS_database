<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Support\Facades\DB;

class RBACSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->createRoles();
        $this->createPermissions();
        $this->assignRolePermissions();
        $this->setupRoleHierarchy();
    }

    /**
     * Create the hierarchical roles.
     */
    protected function createRoles(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Ultimate system authority with unrestricted access',
                'is_system' => true,
                'priority' => 100,
                'reporting_structure' => 'Top of hierarchy, reports to board/ownership',
                'module_access' => [
                    'users', 'roles', 'permissions', 'patients', 'doctors', 
                    'appointments', 'pharmacy', 'laboratory', 'reports'
                ],
                'data_visibility_scope' => 'All system data across all departments and facilities',
                'user_management_capabilities' => [
                    'create_users', 'delete_users', 'assign_roles', 'reset_passwords'
                ],
                'system_configuration_access' => [
                    'database_config', 'security_settings', 'backup_restore', 'maintenance'
                ],
                'reporting_permissions' => [
                    'all_system_reports', 'audit_logs', 'performance_metrics', 'compliance'
                ],
                'role_specific_limitations' => [
                    'cannot_delete_own_account', 'cannot_remove_super_admin_role'
                ]
            ],
            [
                'name' => 'Sub Super Admin',
                'slug' => 'sub-super-admin',
                'description' => 'Senior administrative role with broad system access',
                'is_system' => true,
                'priority' => 90,
                'reporting_structure' => 'Reports to Super Admin, manages Hospital Admin level',
                'module_access' => [
                    'users', 'roles', 'patients', 'doctors', 'appointments', 
                    'pharmacy', 'laboratory', 'reports'
                ],
                'data_visibility_scope' => 'All departments within assigned facilities',
                'user_management_capabilities' => [
                    'create_users', 'assign_roles', 'reset_passwords'
                ],
                'system_configuration_access' => [
                    'department_settings', 'ui_customization', 'report_templates'
                ],
                'reporting_permissions' => [
                    'department_reports', 'user_activity', 'operational_metrics'
                ],
                'role_specific_limitations' => [
                    'cannot_modify_super_admin', 'limited_financial_operations'
                ]
            ],
            [
                'name' => 'Pharmacy Admin',
                'slug' => 'pharmacy-admin',
                'description' => 'Specialized administrator for pharmaceutical operations',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, manages pharmacy staff',
                'module_access' => [
                    'pharmacy', 'medicines', 'suppliers', 'purchase_orders', 
                    'stock_management', 'prescriptions'
                ],
                'data_visibility_scope' => [
                    'pharmacy_inventory', 'prescription_records', 'supplier_info'
                ],
                'user_management_capabilities' => [
                    'manage_pharmacy_staff', 'assign_pharmacy_roles'
                ],
                'system_configuration_access' => [
                    'pharmacy_settings', 'inventory_thresholds', 'supplier_configs'
                ],
                'reporting_permissions' => [
                    'inventory_reports', 'expiry_tracking', 'procurement_analytics'
                ],
                'role_specific_limitations' => [
                    'limited_patient_medical_history', 'no_financial_settings'
                ]
            ],
            [
                'name' => 'Laboratory Admin',
                'slug' => 'laboratory-admin',
                'description' => 'Specialized administrator for laboratory operations',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, manages laboratory staff',
                'module_access' => [
                    'laboratory', 'lab_tests', 'test_requests', 'test_results', 
                    'equipment', 'quality_control'
                ],
                'data_visibility_scope' => [
                    'laboratory_tests', 'patient_diagnostics', 'equipment_records'
                ],
                'user_management_capabilities' => [
                    'manage_laboratory_staff', 'assign_laboratory_roles'
                ],
                'system_configuration_access' => [
                    'laboratory_settings', 'test_parameters', 'instrument_configs'
                ],
                'reporting_permissions' => [
                    'test_volume_reports', 'turnaround_analytics', 'qc_reports'
                ],
                'role_specific_limitations' => [
                    'limited_patient_medical_history', 'no_test_pricing_changes'
                ]
            ],
            [
                'name' => 'Reception Admin',
                'slug' => 'reception-admin',
                'description' => 'Front-desk personnel for patient, appointment and department management',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, manages reception desk operations',
                'module_access' => [
                    'patients', 'appointments', 'departments', 'doctors', 'queue', 'scheduling'
                ],
                'data_visibility_scope' => [
                    'patient_demographics', 'appointment_schedules', 'department_data', 'doctor_schedules'
                ],
                'user_management_capabilities' => [
                    'manage_reception_staff'
                ],
                'system_configuration_access' => [
                    'appointment_preferences', 'communication_templates', 'department_settings'
                ],
                'reporting_permissions' => [
                    'daily_schedules', 'patient_flow_reports', 'reception_metrics', 'appointment_reports'
                ],
                'role_specific_limitations' => [
                    'no_medical_records', 'no_financial_transactions', 'no_patient_deletion'
                ]
            ],
            [
                'name' => 'Hospital Admin',
                'slug' => 'hospital-admin',
                'description' => 'Hospital administrator role with department oversight',
                'is_system' => true,
                'priority' => 70,
                'reporting_structure' => 'Reports to Sub Super Admin, manages hospital operations',
                'module_access' => [
                    'users', 'patients', 'doctors', 'appointments', 
                     'pharmacy', 'laboratory', 'reports', 'departments'
                ],
                'data_visibility_scope' => 'All hospital departments and patient data',
                'user_management_capabilities' => [
                    'create_users', 'assign_roles', 'reset_passwords'
                ],
                'system_configuration_access' => [
                    'department_settings', 'hospital_config', 'report_templates'
                ],
                'reporting_permissions' => [
                    'department_reports', 'user_activity', 'operational_metrics'
                ],
                'role_specific_limitations' => [
                    'cannot_modify_system_settings', 'cannot_delete_system_roles'
                ]
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }

    /**
     * Create comprehensive permissions.
     */
    protected function createPermissions(): void
    {
        $permissions = [
            // User Management
            ['name' => 'view-users', 'slug' => 'view_users', 'description' => 'View user list', 'resource' => 'users', 'action' => 'view', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 2],
            ['name' => 'create-users', 'slug' => 'create_users', 'description' => 'Create new users', 'resource' => 'users', 'action' => 'create', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 3, 'requires_approval' => true],
            ['name' => 'edit-users', 'slug' => 'edit_users', 'description' => 'Edit existing users', 'resource' => 'users', 'action' => 'edit', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 2],
            ['name' => 'delete-users', 'slug' => 'delete_users', 'description' => 'Delete users', 'resource' => 'users', 'action' => 'delete', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            
            // Role Management
            ['name' => 'view-roles', 'slug' => 'view_roles', 'description' => 'View role list', 'resource' => 'roles', 'action' => 'view', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 1],
            ['name' => 'create-roles', 'slug' => 'create_roles', 'description' => 'Create new roles', 'resource' => 'roles', 'action' => 'create', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            ['name' => 'edit-roles', 'slug' => 'edit_roles', 'description' => 'Edit existing roles', 'resource' => 'roles', 'action' => 'edit', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 2],
            ['name' => 'delete-roles', 'slug' => 'delete_roles', 'description' => 'Delete roles', 'resource' => 'roles', 'action' => 'delete', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            
            // Patient Management
            ['name' => 'view-patients', 'slug' => 'view_patients', 'description' => 'View patient list', 'resource' => 'patients', 'action' => 'view', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 1],
            ['name' => 'create-patients', 'slug' => 'create_patients', 'description' => 'Create new patients', 'resource' => 'patients', 'action' => 'create', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 1],
            ['name' => 'edit-patients', 'slug' => 'edit_patients', 'description' => 'Edit existing patients', 'resource' => 'patients', 'action' => 'edit', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 2],
            ['name' => 'delete-patients', 'slug' => 'delete_patients', 'description' => 'Delete patients', 'resource' => 'patients', 'action' => 'delete', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 3, 'requires_approval' => true],
            
            // Pharmacy Management
            ['name' => 'view-pharmacy', 'slug' => 'view_pharmacy', 'description' => 'View pharmacy section', 'resource' => 'pharmacy', 'action' => 'view', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 1],
            ['name' => 'manage-medicines', 'slug' => 'manage_medicines', 'description' => 'Manage medicine inventory', 'resource' => 'medicines', 'action' => 'manage', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'process-prescriptions', 'slug' => 'process_prescriptions', 'description' => 'Process prescriptions', 'resource' => 'prescriptions', 'action' => 'process', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'manage-prescriptions', 'slug' => 'manage_prescriptions', 'description' => 'Manage prescriptions workflow', 'resource' => 'prescriptions', 'action' => 'manage', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'inventory-management', 'slug' => 'inventory_management', 'description' => 'Manage pharmacy inventory', 'resource' => 'inventory', 'action' => 'manage', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            
            // Laboratory Management
            ['name' => 'view-laboratory', 'slug' => 'view_laboratory', 'description' => 'View laboratory section', 'resource' => 'laboratory', 'action' => 'view', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 1],
            ['name' => 'manage-lab-tests', 'slug' => 'manage_lab_tests', 'description' => 'Manage lab tests', 'resource' => 'lab-tests', 'action' => 'manage', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'process-test-results', 'slug' => 'process_test_results', 'description' => 'Process test results', 'resource' => 'lab-test-results', 'action' => 'process', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'quality-control', 'slug' => 'quality_control', 'description' => 'Manage lab quality control', 'resource' => 'quality-control', 'action' => 'manage', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            
            // RBAC Management
            ['name' => 'view-rbac-dashboard', 'slug' => 'view_rbac_dashboard', 'description' => 'View RBAC dashboard', 'resource' => 'rbac', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'manage-role-permissions', 'slug' => 'manage_role_permissions', 'description' => 'Manage role permissions', 'resource' => 'role-permissions', 'action' => 'manage', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            ['name' => 'view-permission-matrix', 'slug' => 'view_permission_matrix', 'description' => 'View permission matrix', 'resource' => 'permissions', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'view-activity-logs', 'slug' => 'view_activity_logs', 'description' => 'View audit logs', 'resource' => 'audit-logs', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'manage-roles', 'slug' => 'manage_roles', 'description' => 'Create and manage roles', 'resource' => 'roles', 'action' => 'manage', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 2],
            ['name' => 'manage-user-roles', 'slug' => 'manage_user_roles', 'description' => 'Assign roles to users', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 3],
            
            // Permission Template Management
            ['name' => 'view-permission-templates', 'slug' => 'view_permission_templates', 'description' => 'View permission templates and Apply Template button', 'resource' => 'permission-templates', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'edit-role-permissions', 'slug' => 'edit_role_permissions', 'description' => 'Apply or copy permissions from templates to roles', 'resource' => 'role-permissions', 'action' => 'edit', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 3, 'requires_approval' => true],
            ['name' => 'reset-role-permissions', 'slug' => 'reset_role_permissions', 'description' => 'Reset role permissions to default values', 'resource' => 'role-permissions', 'action' => 'reset', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            
            // Dashboard
            ['name' => 'view-dashboard', 'slug' => 'view_dashboard', 'description' => 'View dashboard', 'resource' => 'dashboard', 'action' => 'view', 'category' => 'Dashboard', 'module' => 'dashboard', 'segregation_group' => 'dashboard', 'risk_level' => 1],
            
            // Doctor Management
            ['name' => 'view-doctors', 'slug' => 'view_doctors', 'description' => 'View doctor list', 'resource' => 'doctors', 'action' => 'view', 'category' => 'Doctor Management', 'module' => 'doctors', 'segregation_group' => 'doctor_management', 'risk_level' => 1],
            ['name' => 'create-doctors', 'slug' => 'create_doctors', 'description' => 'Create new doctors', 'resource' => 'doctors', 'action' => 'create', 'category' => 'Doctor Management', 'module' => 'doctors', 'segregation_group' => 'doctor_management', 'risk_level' => 2],
            ['name' => 'edit-doctors', 'slug' => 'edit_doctors', 'description' => 'Edit existing doctors', 'resource' => 'doctors', 'action' => 'edit', 'category' => 'Doctor Management', 'module' => 'doctors', 'segregation_group' => 'doctor_management', 'risk_level' => 2],
            ['name' => 'delete-doctors', 'slug' => 'delete_doctors', 'description' => 'Delete doctors', 'resource' => 'doctors', 'action' => 'delete', 'category' => 'Doctor Management', 'module' => 'doctors', 'segregation_group' => 'doctor_management', 'risk_level' => 3, 'requires_approval' => true],
            
            // Appointment Management
            ['name' => 'view-appointments', 'slug' => 'view_appointments', 'description' => 'View appointment list', 'resource' => 'appointments', 'action' => 'view', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 1],
            ['name' => 'create-appointments', 'slug' => 'create_appointments', 'description' => 'Create new appointments', 'resource' => 'appointments', 'action' => 'create', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 1],
            ['name' => 'edit-appointments', 'slug' => 'edit_appointments', 'description' => 'Edit existing appointments', 'resource' => 'appointments', 'action' => 'edit', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 2],
            ['name' => 'delete-appointments', 'slug' => 'delete_appointments', 'description' => 'Delete appointments', 'resource' => 'appointments', 'action' => 'delete', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 2],
            ['name' => 'manage-queue', 'slug' => 'manage_queue', 'description' => 'Manage patient queue', 'resource' => 'queue', 'action' => 'manage', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 1],
            ['name' => 'cancel-appointments', 'slug' => 'cancel_appointments', 'description' => 'Cancel appointments', 'resource' => 'appointments', 'action' => 'cancel', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 2],
            ['name' => 'reschedule-appointments', 'slug' => 'reschedule_appointments', 'description' => 'Reschedule appointments', 'resource' => 'appointments', 'action' => 'reschedule', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 2],
            ['name' => 'view-appointment-schedule', 'slug' => 'view_appointment_schedule', 'description' => 'View appointment schedule', 'resource' => 'appointment-schedule', 'action' => 'view', 'category' => 'Appointment Management', 'module' => 'appointments', 'segregation_group' => 'appointment_management', 'risk_level' => 1],
            
            // Medicine Management (individual permissions)
            ['name' => 'create-medicines', 'slug' => 'create_medicines', 'description' => 'Add new medicines', 'resource' => 'medicines', 'action' => 'create', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'edit-medicines', 'slug' => 'edit_medicines', 'description' => 'Edit medicine information', 'resource' => 'medicines', 'action' => 'edit', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'delete-medicines', 'slug' => 'delete_medicines', 'description' => 'Delete medicines', 'resource' => 'medicines', 'action' => 'delete', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 3, 'requires_approval' => true],
            
            // Lab Test Management (individual permissions)
            ['name' => 'create-lab-tests', 'slug' => 'create_lab_tests', 'description' => 'Create new lab tests', 'resource' => 'lab-tests', 'action' => 'create', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'edit-lab-tests', 'slug' => 'edit_lab_tests', 'description' => 'Edit lab tests', 'resource' => 'lab-tests', 'action' => 'edit', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'delete-lab-tests', 'slug' => 'delete_lab_tests', 'description' => 'Delete lab tests', 'resource' => 'lab-tests', 'action' => 'delete', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 3, 'requires_approval' => true],
            ['name' => 'view-lab-results', 'slug' => 'view_lab_results', 'description' => 'View lab test results', 'resource' => 'lab-results', 'action' => 'view', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 1],
            ['name' => 'create-lab-results', 'slug' => 'create_lab_results', 'description' => 'Create lab test results', 'resource' => 'lab-results', 'action' => 'create', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'edit-lab-results', 'slug' => 'edit_lab_results', 'description' => 'Edit lab test results', 'resource' => 'lab-results', 'action' => 'edit', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'manage-lab-materials', 'slug' => 'manage_lab_materials', 'description' => 'Manage lab materials and supplies', 'resource' => 'lab-materials', 'action' => 'manage', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            
            // Reports
            ['name' => 'view-reports', 'slug' => 'view_reports', 'description' => 'View reports', 'resource' => 'reports', 'action' => 'view', 'category' => 'Reports', 'module' => 'reports', 'segregation_group' => 'reports', 'risk_level' => 1],
            
            // Settings
            ['name' => 'view-settings', 'slug' => 'view_settings', 'description' => 'View settings', 'resource' => 'settings', 'action' => 'view', 'category' => 'System Configuration', 'module' => 'settings', 'segregation_group' => 'settings', 'risk_level' => 2],
            
            // Departments
            ['name' => 'view-departments', 'slug' => 'view_departments', 'description' => 'View department list', 'resource' => 'departments', 'action' => 'view', 'category' => 'System Configuration', 'module' => 'departments', 'segregation_group' => 'departments', 'risk_level' => 1],
            ['name' => 'create-departments', 'slug' => 'create_departments', 'description' => 'Create new departments', 'resource' => 'departments', 'action' => 'create', 'category' => 'System Configuration', 'module' => 'departments', 'segregation_group' => 'departments', 'risk_level' => 2],
            ['name' => 'edit-departments', 'slug' => 'edit_departments', 'description' => 'Edit existing departments', 'resource' => 'departments', 'action' => 'edit', 'category' => 'System Configuration', 'module' => 'departments', 'segregation_group' => 'departments', 'risk_level' => 2],
            
            // Wallet/Finance
            ['name' => 'wallet.view', 'slug' => 'wallet_view', 'description' => 'View wallet and revenue', 'resource' => 'wallet', 'action' => 'view', 'category' => 'Finance', 'module' => 'wallet', 'segregation_group' => 'finance', 'risk_level' => 2],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }
    }

    /**
     * Assign permissions to roles.
     */
    protected function assignRolePermissions(): void
    {
        $rolePermissions = [
            'super-admin' => [
                'view-users', 'create-users', 'edit-users', 'delete-users',
                'view-roles', 'create-roles', 'edit-roles', 'delete-roles',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-pharmacy', 'manage-medicines', 'process-prescriptions',
                'view-laboratory', 'manage-lab-tests', 'process-test-results',
                'view-rbac-dashboard', 'manage-role-permissions', 'view-permission-matrix', 'view-activity-logs'
            ],
            'sub-super-admin' => [
                'view-dashboard', 'view-users', 'create-users', 'edit-users', 'delete-users',
                'view-roles', 'create-roles', 'edit-roles', 'manage-roles', 'manage-role-permissions', 'manage-user-roles',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'view-pharmacy', 'create-medicines', 'edit-medicines',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests',
                'view-reports', 'view-settings', 'view-activity-logs',
                'view-departments', 'create-departments', 'edit-departments',
                'wallet.view',
                'view-pharmacy', 'manage-medicines', 'process-prescriptions',
                'view-laboratory', 'manage-lab-tests', 'process-test-results',
                'view-rbac-dashboard', 'view-permission-matrix', 'view-activity-logs',
                'view-permission-templates', 'edit-role-permissions', 'reset-role-permissions'
            ],
            'pharmacy-admin' => [
                'view-dashboard',
                'view-patients',
                'view-pharmacy', 'create-medicines', 'edit-medicines', 'delete-medicines',
                'manage-prescriptions', 'inventory-management',
                'view-reports',
            ],
            'laboratory-admin' => [
                'view-dashboard',
                'view-patients',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests', 'delete-lab-tests',
                'process-test-results', 'quality-control',
                'view-lab-results', 'create-lab-results', 'edit-lab-results',
                'manage-lab-materials',
                'view-reports',
            ],
            'reception-admin' => [
                'view-dashboard',
                'view-patients', 'create-patients', 'edit-patients',
                'view-doctors',
                'view-departments', 'create-departments', 'edit-departments',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'cancel-appointments', 'reschedule-appointments',
                'manage-queue', 'view-appointment-schedule',
                'view-reports',
                'view-users' // Limited view only
            ],
            'hospital-admin' => [
                'view-dashboard', 'view-users',
                'view-roles', 'create-roles', 'edit-roles', 'manage-roles', 'manage-user-roles',
                'view-patients', 'create-patients', 'edit-patients',
                'view-doctors', 'create-doctors', 'edit-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments',
                'view-reports', 'view-activity-logs',
                'view-departments', 'create-departments', 'edit-departments',
                'wallet.view',
                'view-permission-templates', 'edit-role-permissions', 'reset-role-permissions'
            ],
            'doctor' => [
                'view-dashboard',
                'view-patients', 'edit-patients',
                'view-doctors',
                'view-appointments', 'edit-appointments',
                'view-laboratory',
            ],
            'patient' => [
                'view-dashboard',
                'view-appointments',
            ]
        ];

        foreach ($rolePermissions as $roleSlug => $permissionNames) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $permissions = Permission::whereIn('name', $permissionNames)->get();
                $role->permissions()->sync($permissions->pluck('id')->toArray());
            }
        }
    }

    /**
     * Setup role hierarchy relationships.
     */
    protected function setupRoleHierarchy(): void
    {
        $hierarchy = [
            'sub-super-admin' => 'super-admin',
            'pharmacy-admin' => 'sub-super-admin',
            'laboratory-admin' => 'sub-super-admin',
            'reception-admin' => 'sub-super-admin',
            'hospital-admin' => 'sub-super-admin',
        ];

        foreach ($hierarchy as $subordinateSlug => $supervisorSlug) {
            $subordinate = Role::where('slug', $subordinateSlug)->first();
            $supervisor = Role::where('slug', $supervisorSlug)->first();
            
            if ($subordinate && $supervisor) {
                $subordinate->update(['parent_role_id' => $supervisor->id]);
            }
        }
    }
}
