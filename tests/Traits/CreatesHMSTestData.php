<?php

namespace Tests\Traits;

use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Payment;
use App\Models\LabTest;
use App\Models\LabTestRequest;
use App\Models\LabTestResult;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\MedicalRecord;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Role;
use App\Models\Permission;

trait CreatesHMSTestData
{
    /**
     * Collection of test data.
     */
    protected \Illuminate\Support\Collection $testUsers;
    protected \Illuminate\Support\Collection $testPatients;
    protected \Illuminate\Support\Collection $testDoctors;
    protected \Illuminate\Support\Collection $testDepartments;
    protected \Illuminate\Support\Collection $testAppointments;
    protected \Illuminate\Support\Collection $testBills;
    protected \Illuminate\Support\Collection $testPayments;
    protected \Illuminate\Support\Collection $testMedicines;
    protected \Illuminate\Support\Collection $testLabTests;
    protected \Illuminate\Support\Collection $testRoles;
    protected \Illuminate\Support\Collection $testPermissions;

    /**
     * Create default roles for testing.
     */
    protected function createDefaultRoles(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'level' => 100, 'description' => 'Super Administrator with all permissions'],
            ['name' => 'Hospital Admin', 'slug' => 'hospital-admin', 'level' => 90, 'description' => 'Hospital administrative staff'],
            ['name' => 'Doctor', 'slug' => 'doctor', 'level' => 70, 'description' => 'Medical doctor'],
            ['name' => 'Nurse', 'slug' => 'nurse', 'level' => 60, 'description' => 'Nursing staff'],
            ['name' => 'Pharmacy Admin', 'slug' => 'pharmacy-admin', 'level' => 80, 'description' => 'Pharmacy administrative staff'],
            ['name' => 'Laboratory Admin', 'slug' => 'laboratory-admin', 'level' => 80, 'description' => 'Laboratory administrative staff'],
            ['name' => 'Staff', 'slug' => 'staff', 'level' => 50, 'description' => 'General staff'],
            ['name' => 'Patient', 'slug' => 'patient', 'level' => 10, 'description' => 'Patient account'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['slug' => $role['slug']], $role);
        }
        
        $this->testRoles = Role::all();
    }

    /**
     * Create default permissions.
     */
    protected function createDefaultPermissions(): void
    {
        $permissions = [
            // Dashboard permissions
            ['name' => 'view-dashboard', 'description' => 'Permission to view dashboard'],
            
            // Patient permissions
            ['name' => 'view-patients', 'description' => 'Permission to view patients'],
            ['name' => 'create-patients', 'description' => 'Permission to create patients'],
            ['name' => 'edit-patients', 'description' => 'Permission to edit patients'],
            ['name' => 'delete-patients', 'description' => 'Permission to delete patients'],
            
            // Doctor permissions
            ['name' => 'view-doctors', 'description' => 'Permission to view doctors'],
            ['name' => 'create-doctors', 'description' => 'Permission to create doctors'],
            ['name' => 'edit-doctors', 'description' => 'Permission to edit doctors'],
            ['name' => 'delete-doctors', 'description' => 'Permission to delete doctors'],
            
            // Appointment permissions
            ['name' => 'view-appointments', 'description' => 'Permission to view appointments'],
            ['name' => 'create-appointments', 'description' => 'Permission to create appointments'],
            ['name' => 'edit-appointments', 'description' => 'Permission to edit appointments'],
            ['name' => 'delete-appointments', 'description' => 'Permission to delete appointments'],
            ['name' => 'cancel-appointments', 'description' => 'Permission to cancel appointments'],
            ['name' => 'complete-appointments', 'description' => 'Permission to complete appointments'],
            
            // Billing permissions
            ['name' => 'view-billing', 'description' => 'Permission to view billing'],
            ['name' => 'create-billing', 'description' => 'Permission to create billing'],
            ['name' => 'edit-billing', 'description' => 'Permission to edit billing'],
            ['name' => 'delete-billing', 'description' => 'Permission to delete billing'],
            ['name' => 'process-refunds', 'description' => 'Permission to process refunds'],
            ['name' => 'void-bills', 'description' => 'Permission to void bills'],
            ['name' => 'approve-discounts', 'description' => 'Permission to approve discounts'],
            
            // Pharmacy permissions
            ['name' => 'view-pharmacy', 'description' => 'Permission to view pharmacy'],
            ['name' => 'manage-medicines', 'description' => 'Permission to manage medicines'],
            ['name' => 'view-inventory', 'description' => 'Permission to view inventory'],
            ['name' => 'create-sales', 'description' => 'Permission to create sales'],
            ['name' => 'view-alerts', 'description' => 'Permission to view alerts'],
            ['name' => 'manage-alerts', 'description' => 'Permission to manage alerts'],
            
            // Laboratory permissions
            ['name' => 'view-laboratory', 'description' => 'Permission to view laboratory'],
            ['name' => 'create-lab-tests', 'description' => 'Permission to create lab tests'],
            ['name' => 'approve-lab-results', 'description' => 'Permission to approve lab results'],
            ['name' => 'quality-control', 'description' => 'Permission to perform quality control'],
            
            // Medical Records permissions
            ['name' => 'view-medical-records', 'description' => 'Permission to view medical records'],
            ['name' => 'create-medical-records', 'description' => 'Permission to create medical records'],
            ['name' => 'edit-medical-records', 'description' => 'Permission to edit medical records'],
            
            // Admin permissions
            ['name' => 'manage-users', 'description' => 'Permission to manage users'],
            ['name' => 'manage-roles', 'description' => 'Permission to manage roles'],
            ['name' => 'manage-permissions', 'description' => 'Permission to manage permissions'],
            ['name' => 'view-audit-logs', 'description' => 'Permission to view audit logs'],
            ['name' => 'system-settings', 'description' => 'Permission to manage system settings'],
            ['name' => 'backup-restore', 'description' => 'Permission to backup and restore data'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission['name']], $permission);
        }
        
        $this->testPermissions = Permission::all();
    }

    /**
     * Create test users with different roles.
     */
    protected function createTestUsers(): void
    {
        $roles = Role::all()->keyBy('slug');

        $this->testUsers = collect([
            'superAdmin' => User::factory()->create([
                'name' => 'Super Admin User',
                'username' => 'superadmin_test_' . time(),
                'role' => 'Super Admin',
                'role_id' => $roles['super-admin']->id,
            ]),
            
            'hospitalAdmin' => User::factory()->create([
                'name' => 'Hospital Admin User',
                'username' => 'hospitaladmin_test_' . time(),
                'role' => 'Hospital Admin',
                'role_id' => $roles['hospital-admin']->id,
            ]),
            
            'doctor' => User::factory()->create([
                'name' => 'Dr. Test Doctor',
                'username' => 'doctor_test_' . time(),
                'role' => 'Doctor',
                'role_id' => $roles['doctor']->id,
            ]),
            
            'nurse' => User::factory()->create([
                'name' => 'Test Nurse',
                'username' => 'nurse_test_' . time(),
                'role' => 'Nurse',
                'role_id' => $roles['nurse']->id,
            ]),
            
            'pharmacyAdmin' => User::factory()->create([
                'name' => 'Pharmacy Admin User',
                'username' => 'pharmacyadmin_test_' . time(),
                'role' => 'Pharmacy Admin',
                'role_id' => $roles['pharmacy-admin']->id,
            ]),
            
            'laboratoryAdmin' => User::factory()->create([
                'name' => 'Laboratory Admin User',
                'username' => 'laboratoryadmin_test_' . time(),
                'role' => 'Laboratory Admin',
                'role_id' => $roles['laboratory-admin']->id,
            ]),
            
            'staff' => User::factory()->create([
                'name' => 'Test Staff',
                'username' => 'staff_test_' . time(),
                'role' => 'Staff',
                'role_id' => $roles['staff']->id,
            ]),
        ]);

        // Assign permissions to test users
        $this->assignTestPermissions();
    }

    /**
     * Assign permissions to test users.
     */
    protected function assignTestPermissions(): void
    {
        $permissions = Permission::all()->pluck('id', 'name');
        $roles = Role::all()->keyBy('slug');

        // Super Admin gets all permissions
        $allPermissionIds = $permissions->values()->toArray();
        $roles['super-admin']->permissions()->attach($allPermissionIds);

        // Hospital Admin gets broad permissions
        $hospitalAdminPermissions = [
            'view-dashboard', 'view-patients', 'create-patients', 'edit-patients',
            'view-doctors', 'view-appointments', 'create-appointments', 'edit-appointments',
            'view-billing', 'create-billing', 'edit-billing', 'process-refunds',
            'view-audit-logs', 'view-medical-records', 'create-medical-records',
            'edit-medical-records', 'manage-users',
        ];
        $roles['hospital-admin']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($hospitalAdminPermissions))
        );

        // Doctor permissions
        $doctorPermissions = [
            'view-dashboard', 'view-patients', 'create-patients', 'edit-patients',
            'view-doctors', 'view-appointments', 'create-appointments', 'edit-appointments',
            'complete-appointments', 'view-laboratory', 'create-lab-tests',
            'view-medical-records', 'create-medical-records', 'edit-medical-records',
        ];
        $roles['doctor']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($doctorPermissions))
        );

        // Nurse permissions
        $nursePermissions = [
            'view-dashboard', 'view-patients', 'view-appointments', 'create-appointments',
            'view-laboratory', 'view-medical-records',
        ];
        $roles['nurse']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($nursePermissions))
        );

        // Pharmacy Admin permissions
        $pharmacyPermissions = [
            'view-dashboard', 'view-pharmacy', 'manage-medicines', 'view-inventory',
            'create-sales', 'view-alerts', 'manage-alerts', 'view-billing',
        ];
        $roles['pharmacy-admin']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($pharmacyPermissions))
        );

        // Laboratory Admin permissions
        $labPermissions = [
            'view-dashboard', 'view-laboratory', 'create-lab-tests', 'approve-lab-results',
            'quality-control', 'view-patients', 'view-appointments',
        ];
        $roles['laboratory-admin']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($labPermissions))
        );

        // Staff permissions
        $staffPermissions = [
            'view-dashboard', 'view-patients', 'create-patients',
            'view-appointments', 'create-appointments', 'view-billing',
        ];
        $roles['staff']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($staffPermissions))
        );
    }

    /**
     * Create test patients.
     */
    protected function createTestPatients(int $count = 10): \Illuminate\Support\Collection
    {
        return $this->testPatients = Patient::factory()->count($count)->create();
    }

    /**
     * Create test doctors.
     */
    protected function createTestDoctors(int $count = 5): \Illuminate\Support\Collection
    {
        $this->testDepartments = Department::factory()->count(5)->create();
        
        return $this->testDoctors = Doctor::factory()
            ->count($count)
            ->sequence(fn () => ['department_id' => $this->testDepartments->random()->id])
            ->create();
    }

    /**
     * Create test departments.
     */
    protected function createTestDepartments(int $count = 5): \Illuminate\Support\Collection
    {
        return $this->testDepartments = Department::factory()->count($count)->create();
    }

    /**
     * Create test appointments.
     */
    protected function createTestAppointments(
        int $count = 15,
        ?Patient $patient = null,
        ?Doctor $doctor = null
    ): \Illuminate\Support\Collection
    {
        $patients = $patient ? collect([$patient]) : ($this->testPatients ?? $this->createTestPatients());
        $doctors = $doctor ? collect([$doctor]) : ($this->testDoctors ?? $this->createTestDoctors());

        return $this->testAppointments = Appointment::factory()
            ->count($count)
            ->sequence(fn () => [
                'patient_id' => $patients->random()->id,
                'doctor_id' => $doctors->random()->id,
            ])
            ->create();
    }

    /**
     * Create test bills with items.
     */
    protected function createTestBills(int $count = 10): \Illuminate\Support\Collection
    {
        $patients = $this->testPatients ?? $this->createTestPatients();

        return $this->testBills = Bill::factory()
            ->count($count)
            ->sequence(fn () => ['patient_id' => $patients->random()->id])
            ->has(BillItem::factory()->count(3), 'items')
            ->create();
    }

    /**
     * Create test medicines.
     */
    protected function createTestMedicines(int $count = 20): \Illuminate\Support\Collection
    {
        $categories = MedicineCategory::factory()->count(5)->create();
        
        return $this->testMedicines = Medicine::factory()
            ->count($count)
            ->sequence(fn () => ['category_id' => $categories->random()->id])
            ->create();
    }

    /**
     * Create test lab tests.
     */
    protected function createTestLabTests(int $count = 10): \Illuminate\Support\Collection
    {
        $patients = $this->testPatients ?? $this->createTestPatients();
        $doctors = $this->testDoctors ?? $this->createTestDoctors();

        return $this->testLabTests = LabTest::factory()
            ->count($count)
            ->sequence(fn () => [
                'patient_id' => $patients->random()->id,
                'ordered_by' => $doctors->random()->id,
            ])
            ->has(LabTestResult::factory(), 'result')
            ->create();
    }

    /**
     * Create a complete patient visit scenario.
     */
    protected function createCompletePatientVisit(): array
    {
        $patient = Patient::factory()->create();
        $department = Department::factory()->create();
        $doctor = Doctor::factory()->create(['department_id' => $department->id]);
        $medicine = Medicine::factory()->create();
        $category = MedicineCategory::factory()->create();

        // Create appointment
        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'completed',
        ]);

        // Create medical record
        $medicalRecord = MedicalRecord::factory()->create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
        ]);

        // Create prescription
        $prescription = Prescription::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_id' => $appointment->id,
        ]);

        PrescriptionItem::factory()->create([
            'prescription_id' => $prescription->id,
            'medicine_id' => $medicine->id,
            'quantity' => 30,
        ]);

        // Create bill
        $bill = Bill::factory()->create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
        ]);

        BillItem::factory()->create([
            'bill_id' => $bill->id,
            'description' => 'Consultation Fee',
            'quantity' => 1,
            'unit_price' => 200.00,
        ]);

        // Create payment
        $payment = Payment::factory()->create([
            'bill_id' => $bill->id,
            'amount' => $bill->total_amount,
            'status' => 'completed',
        ]);

        return compact(
            'patient', 'department', 'doctor', 'medicine', 'category',
            'appointment', 'medicalRecord', 'prescription', 'bill', 'payment'
        );
    }

    /**
     * Get test user by key.
     */
    protected function getTestUser(string $key): ?User
    {
        return $this->testUsers[$key] ?? null;
    }

    /**
     * Get all test users.
     */
    protected function getAllTestUsers(): \Illuminate\Support\Collection
    {
        return $this->testUsers ?? collect([]);
    }

    /**
     * Clean up specific test data.
     */
    protected function cleanupTestData(array $modelsToClean = []): void
    {
        $defaultModels = [
            Payment::class,
            BillRefund::class,
            BillItem::class,
            Bill::class,
            PrescriptionItem::class,
            Prescription::class,
            LabTestResult::class,
            LabTestRequest::class,
            LabTest::class,
            MedicineAlert::class,
            SaleItem::class,
            Sale::class,
            Medicine::class,
            MedicineCategory::class,
            Appointment::class,
            MedicalRecord::class,
            ClinicalAssessment::class,
            Doctor::class,
            Patient::class,
            DepartmentService::class,
            Department::class,
            AuditLog::class,
            RolePermission::class,
            UserPermission::class,
            Permission::class,
            Role::class,
            User::class,
        ];

        $models = empty($modelsToClean) ? $defaultModels : $modelsToClean;

        foreach ($models as $model) {
            $model::query()->delete();
        }
        
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Queue::flush();
    }
}
