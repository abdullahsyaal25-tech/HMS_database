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

        ];
    }
}
