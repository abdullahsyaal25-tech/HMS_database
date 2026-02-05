<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;

class DefaultUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure roles exist first
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $pharmacyAdminRole = Role::where('slug', 'pharmacy-admin')->first();
        $laboratoryAdminRole = Role::where('slug', 'laboratory-admin')->first();
        $subSuperAdminRole = Role::where('slug', 'sub-super-admin')->first();
        
        // Create or update Super Admin
        User::updateOrCreate(
            ['username' => 'hospital_admin'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('password'),
                'role_id' => $superAdminRole?->id,
            ]
        );
        
        // Create or update Pharmacy Admin
        User::updateOrCreate(
            ['username' => 'pharmacy_admin'],
            [
                'name' => 'Pharmacy Admin',
                'password' => bcrypt('password'),
                'role_id' => $pharmacyAdminRole?->id,
            ]
        );
        
        // Create or update Laboratory Admin
        User::updateOrCreate(
            ['username' => 'lab_admin'],
            [
                'name' => 'Laboratory Admin',
                'password' => bcrypt('password'),
                'role_id' => $laboratoryAdminRole?->id,
            ]
        );
        
        // Create or update Sub Super Admin
        User::updateOrCreate(
            ['username' => 'sub_super_admin'],
            [
                'name' => 'Sub Super Admin',
                'password' => bcrypt('password'),
                'role_id' => $subSuperAdminRole?->id,
            ]
        );
        
        $this->command->info('Default users seeded with roles!');
    }
}
