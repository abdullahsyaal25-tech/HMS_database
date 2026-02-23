<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            RBACSeeder::class,
            RolePermissionMappingSeeder::class,
            DepartmentSeeder::class,
            DepartmentServiceSeeder::class,
            MedicineCategorySeeder::class,
            LabTestSeeder::class,
            DefaultUsersSeeder::class,
        ]);
    }
}
