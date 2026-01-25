<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolePermissionMappingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Maps permissions to the new normalized roles table.
     */
    public function run(): void
    {
        $roles = Role::all()->keyBy('slug');
        $permissions = Permission::all()->keyBy('name');

        // Define permission mappings for each role
        $mappings = [
            'super-admin' => array_keys($permissions->toArray()), // All permissions
            
            'sub-super-admin' => [
                'view-dashboard', 'view-users', 'create-users', 'edit-users',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'view-billing', 'create-billing', 'edit-billing',
                'view-pharmacy', 'create-medicines', 'edit-medicines',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests',
                'view-reports', 'view-settings', 'view-activity-logs',
                'view-departments', 'create-departments', 'edit-departments',
            ],
            
            'hospital-admin' => [
                'view-dashboard', 'view-users',
                'view-patients', 'create-patients', 'edit-patients',
                'view-doctors', 'create-doctors', 'edit-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments',
                'view-billing', 'create-billing', 'edit-billing',
                'view-reports', 'view-activity-logs',
                'view-departments', 'create-departments', 'edit-departments',
            ],
            
            'reception-admin' => [
                'view-dashboard',
                'view-patients', 'create-patients', 'edit-patients',
                'view-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments',
                'view-billing', 'create-billing',
                'view-reports',
            ],
            
            'pharmacy-admin' => [
                'view-dashboard',
                'view-patients',
                'view-pharmacy', 'create-medicines', 'edit-medicines', 'delete-medicines',
                'view-reports',
            ],
            
            'laboratory-admin' => [
                'view-dashboard',
                'view-patients',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests', 'delete-lab-tests',
                'view-reports',
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
            ],
        ];

        $now = now();

        foreach ($mappings as $roleSlug => $permissionNames) {
            if (!isset($roles[$roleSlug])) {
                $this->command->warn("Role '{$roleSlug}' not found, skipping...");
                continue;
            }

            $role = $roles[$roleSlug];

            foreach ($permissionNames as $permName) {
                if (!isset($permissions[$permName])) {
                    $this->command->warn("Permission '{$permName}' not found, skipping...");
                    continue;
                }

                DB::table('role_permission_mappings')->insertOrIgnore([
                    'role_id' => $role->id,
                    'permission_id' => $permissions[$permName]->id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->command->info('Role permission mappings seeded successfully.');
    }
}
