<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\Bill;
use App\Models\Department;
use Illuminate\Database\Seeder;

class PerformanceTestSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Generating performance test data...');

        // Create departments
        $departments = Department::factory()->count(10)->create();

        // Create doctors
        $doctors = Doctor::factory()->count(50)->create([
            'department_id' => fn() => $departments->random()->id,
        ]);

        // Create patients
        $patients = Patient::factory()->count(500)->create();

        // Create medicines
        $medicines = Medicine::factory()->count(100)->create();

        // Create appointments (1000 records for performance testing)
        $this->command->info('Creating appointments...');
        foreach (range(1, 1000) as $i) {
            Appointment::factory()->create([
                'patient_id' => $patients->random()->id,
                'doctor_id' => $doctors->random()->id,
                'appointment_date' => now()->addDays(rand(-365, 30)),
                'status' => collect(['scheduled', 'completed', 'cancelled', 'no-show'])->random(),
            ]);
        }

        // Create bills (500 records)
        $this->command->info('Creating bills...');
        foreach (range(1, 500) as $i) {
            Bill::factory()->create([
                'patient_id' => $patients->random()->id,
                'status' => collect(['draft', 'pending', 'paid', 'partial', 'void'])->random(),
            ]);
        }

        // Create users (admin, staff, etc.)
        $this->command->info('Creating test users...');
        User::factory()->count(20)->create([
            'role' => 'admin',
        ]);
        User::factory()->count(50)->create([
            'role' => 'staff',
        ]);
        User::factory()->count(30)->create([
            'role' => 'doctor',
        ]);

        $this->command->info('Performance test data generated successfully!');
        $this->command->info("Created: {$departments->count()} departments, {$doctors->count()} doctors, {$patients->count()} patients, 1000 appointments, 500 bills");
    }
}
