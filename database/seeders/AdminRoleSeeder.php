<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdminRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for clean seeding
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Clear existing roles (optional - comment out if you want to preserve existing)
        Role::truncate();
        
        $roles = $this->getRoles();
        
        foreach ($roles as $roleData) {
            $role = Role::create([
                'name' => $roleData['name'],
                'slug' => $roleData['slug'],
                'description' => $roleData['description'],
                'is_system' => true,
                'priority' => $roleData['priority'],
                'parent_role_id' => $roleData['parent_role_id'] ?? null,
                'module_access' => $roleData['module_access'],
                'data_visibility_scope' => $roleData['data_visibility_scope'],
                'user_management_capabilities' => $roleData['user_management_capabilities'],
                'system_configuration_access' => $roleData['system_configuration_access'],
                'reporting_permissions' => $roleData['reporting_permissions'],
                'role_specific_limitations' => $roleData['role_specific_limitations'],
                'mfa_required' => $roleData['mfa_required'],
                'mfa_grace_period_days' => $roleData['mfa_grace_period_days'],
                'session_timeout_minutes' => $roleData['session_timeout_minutes'],
                'concurrent_session_limit' => $roleData['concurrent_session_limit'],
                'is_super_admin' => $roleData['is_super_admin'] ?? false,
            ]);
        }
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        $this->command->info('Admin roles seeded successfully!');
    }

    /**
     * Get the role definitions.
     */
    private function getRoles(): array
    {
        return [
            // Priority 100 - Super Admin (Root)
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Unrestricted system access with full control over all modules, users, and settings',
                'priority' => 100,
                'parent_role_id' => null,
                'module_access' => ['*'],
                'data_visibility_scope' => ['*'],
                'user_management_capabilities' => ['*'],
                'system_configuration_access' => ['*'],
                'reporting_permissions' => ['*'],
                'role_specific_limitations' => [],
                'mfa_required' => true,
                'mfa_grace_period_days' => null,
                'session_timeout_minutes' => 15,
                'concurrent_session_limit' => 1,
                'is_super_admin' => true,
            ],

            // Priority 90 - Sub Super Admin
            [
                'name' => 'Sub Super Admin',
                'slug' => 'sub-super-admin',
                'description' => 'Administrative access to all modules except Super Admin management',
                'priority' => 90,
                'parent_role_id' => 1, // Super Admin
                'module_access' => ['*'],
                'data_visibility_scope' => ['*'],
                'user_management_capabilities' => ['manage_users', 'manage_roles', 'manage_departments'],
                'system_configuration_access' => ['read', 'modify'],
                'reporting_permissions' => ['view', 'export', 'generate'],
                'role_specific_limitations' => ['cannot_manage_super_admin', 'cannot_modify_super_admin_role'],
                'mfa_required' => true,
                'mfa_grace_period_days' => null,
                'session_timeout_minutes' => 20,
                'concurrent_session_limit' => 1,
            ],

            // Priority 80 - Hospital Admin
            [
                'name' => 'Hospital Admin',
                'slug' => 'hospital-admin',
                'description' => 'Full access to hospital operations within assigned hospital',
                'priority' => 80,
                'parent_role_id' => 2, // Sub Super Admin
                'module_access' => ['patients', 'appointments', 'billing', 'pharmacy', 'laboratory', 'departments', 'staff', 'reports'],
                'data_visibility_scope' => ['hospital_id' => 'current'],
                'user_management_capabilities' => ['manage_staff', 'manage_department_heads'],
                'system_configuration_access' => [],
                'reporting_permissions' => ['view', 'export', 'generate'],
                'role_specific_limitations' => ['hospital_scope_only'],
                'mfa_required' => true,
                'mfa_grace_period_days' => null,
                'session_timeout_minutes' => 30,
                'concurrent_session_limit' => 2,
            ],

            // Priority 70 - Department Admin
            [
                'name' => 'Department Admin',
                'slug' => 'department-admin',
                'description' => 'Full access to assigned department(s) with staff management',
                'priority' => 70,
                'parent_role_id' => 3, // Hospital Admin
                'module_access' => ['department_specific_modules'],
                'data_visibility_scope' => ['department_id' => 'assigned'],
                'user_management_capabilities' => ['manage_own_staff'],
                'system_configuration_access' => [],
                'reporting_permissions' => ['view_department', 'export_department'],
                'role_specific_limitations' => ['department_scope_only', 'no_cross_department_access'],
                'mfa_required' => false,
                'mfa_grace_period_days' => 7,
                'session_timeout_minutes' => 45,
                'concurrent_session_limit' => 2,
            ],

            // Priority 60 - Module Admins
            [
                'name' => 'Pharmacy Admin',
                'slug' => 'pharmacy-admin',
                'description' => 'Full access to pharmacy module including inventory and sales',
                'priority' => 60,
                'parent_role_id' => 4, // Department Admin
                'module_access' => ['pharmacy', 'medicines', 'inventory', 'sales', 'suppliers'],
                'data_visibility_scope' => ['pharmacy' => true],
                'user_management_capabilities' => [],
                'system_configuration_access' => ['module_settings_only'],
                'reporting_permissions' => ['view_module', 'export_module'],
                'role_specific_limitations' => ['module_scope_only'],
                'mfa_required' => false,
                'mfa_grace_period_days' => 7,
                'session_timeout_minutes' => 60,
                'concurrent_session_limit' => 3,
            ],

            [
                'name' => 'Laboratory Admin',
                'slug' => 'laboratory-admin',
                'description' => 'Full access to laboratory module including tests and results',
                'priority' => 60,
                'parent_role_id' => 4, // Department Admin
                'module_access' => ['laboratory', 'tests', 'results', 'quality_control'],
                'data_visibility_scope' => ['laboratory' => true],
                'user_management_capabilities' => [],
                'system_configuration_access' => ['module_settings_only'],
                'reporting_permissions' => ['view_module', 'export_module'],
                'role_specific_limitations' => ['module_scope_only'],
                'mfa_required' => false,
                'mfa_grace_period_days' => 7,
                'session_timeout_minutes' => 60,
                'concurrent_session_limit' => 3,
            ],

            [
                'name' => 'Reception Admin',
                'slug' => 'reception-admin',
                'description' => 'Full access to patient registration, appointments, and queue management',
                'priority' => 60,
                'parent_role_id' => 4, // Department Admin
                'module_access' => ['patients', 'appointments', 'queue', 'registration'],
                'data_visibility_scope' => ['reception' => true],
                'user_management_capabilities' => [],
                'system_configuration_access' => [],
                'reporting_permissions' => ['view_module', 'export_module'],
                'role_specific_limitations' => ['module_scope_only', 'no_financial_access'],
                'mfa_required' => false,
                'mfa_grace_period_days' => 7,
                'session_timeout_minutes' => 60,
                'concurrent_session_limit' => 3,
            ],

            // Priority 30 - Staff
            [
                'name' => 'Staff',
                'slug' => 'staff',
                'description' => 'Limited feature access for daily operations',
                'priority' => 30,
                'parent_role_id' => 5, // Module Admin (default parent)
                'module_access' => ['assigned_work_area'],
                'data_visibility_scope' => ['assigned_patients', 'assigned_tasks'],
                'user_management_capabilities' => [],
                'system_configuration_access' => [],
                'reporting_permissions' => ['view_own', 'export_own'],
                'role_specific_limitations' => ['no_delete', 'no_financial_access', 'no_user_management'],
                'mfa_required' => false,
                'mfa_grace_period_days' => null,
                'session_timeout_minutes' => 120,
                'concurrent_session_limit' => 3,
            ],

            // Priority 10 - Viewer
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to public information and assigned reports',
                'priority' => 10,
                'parent_role_id' => 9, // Staff
                'module_access' => ['public_info'],
                'data_visibility_scope' => ['public' => true],
                'user_management_capabilities' => [],
                'system_configuration_access' => [],
                'reporting_permissions' => ['view_public'],
                'role_specific_limitations' => ['read_only', 'no_export', 'no_create', 'no_update', 'no_delete'],
                'mfa_required' => false,
                'mfa_grace_period_days' => null,
                'session_timeout_minutes' => 240,
                'concurrent_session_limit' => null, // Unlimited
            ],
        ];
    }
}
