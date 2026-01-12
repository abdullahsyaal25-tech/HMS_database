<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DefaultUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update Hospital Admin
        $user = \App\Models\User::firstOrCreate(
            ['username' => 'hospital_admin'],
            [
                'name' => 'Hospital Admin',
                'password' => 'password', // Will be automatically hashed by model cast
                'role' => 'Hospital Admin',
            ]
        );
        

        
        // Create or update Pharmacy Admin
        $user = \App\Models\User::firstOrCreate(
            ['username' => 'pharmacy_admin'],
            [
                'name' => 'Pharmacy Admin',
                'password' => 'password', // Will be automatically hashed by model cast
                'role' => 'Pharmacy Admin',
            ]
        );
        

        
        // Create or update Laboratory Admin
        $user = \App\Models\User::firstOrCreate(
            ['username' => 'lab_admin'],
            [
                'name' => 'Laboratory Admin',
                'password' => 'password', // Will be automatically hashed by model cast
                'role' => 'Laboratory Admin',
            ]
        );
        

        
        // Create or update a Doctor
        $user = \App\Models\User::firstOrCreate(
            ['username' => 'dr_john_doe'],
            [
                'name' => 'Dr. John Doe',
                'password' => 'password', // Will be automatically hashed by model cast
                'role' => 'doctor',
            ]
        );
        

    }
}