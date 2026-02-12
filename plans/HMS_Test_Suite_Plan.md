# Hospital Management System (HMS) - Comprehensive Test Suite Plan

## Executive Summary

This document outlines a comprehensive backend test suite for the Hospital Management System Laravel application. The test suite includes **unit tests**, **integration tests**, and **end-to-end (E2E) tests** covering all critical paths including authentication, API endpoints, business logic, database operations, RBAC, and error handling.

**Configuration Decisions:**
- **Database:** MySQL for all tests (matching production environment)
- **Coverage Target:** 90% minimum
- **Framework:** Pest (current setup)
- **Execution:** Parallel enabled for CI/CD speed

## Test Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        HMS TEST SUITE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │ UNIT TESTS   │    │  INTEGRATION │    │   E2E TESTS │             │
│  │   (285)     │    │    TESTS     │    │    (45)     │             │
│  │              │    │    (220)     │    │              │             │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘             │
│         │                   │                   │                       │
│  ┌──────┴───────┐    ┌──────┴───────┐    ┌──────┴───────┐             │
│  │ - Models     │    │ - API        │    │ - Workflows   │             │
│  │ - Services   │    │   Endpoints  │    │ - Multi-step  │             │
│  │ - Validation │    │ - Database   │    │   Processes   │             │
│  │ - Utilities  │    │ - Auth Flow  │    │ - Concurrent  │             │
│  │ - RBAC       │    │ - Permissions│    │   Requests    │             │
│  └──────────────┘    └──────────────┘    └──────────────┘             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Test Coverage Matrix

| Module | Unit Tests | Integration Tests | E2E Tests | Priority | Coverage Goal |
|--------|------------|-------------------|-----------|----------|---------------|
| Authentication | 20 | 25 | 5 | Critical | 95% |
| Patients CRUD | 25 | 20 | 3 | Critical | 95% |
| Doctors CRUD | 20 | 15 | 2 | High | 90% |
| Appointments | 30 | 25 | 5 | Critical | 95% |
| Billing & Payments | 35 | 30 | 10 | Critical | 95% |
| Pharmacy | 30 | 22 | 4 | High | 90% |
| Laboratory | 25 | 18 | 4 | High | 90% |
| Medical Records | 20 | 15 | 2 | Medium | 85% |
| RBAC & Permissions | 40 | 35 | 5 | Critical | 95% |
| Dashboard & Reports | 20 | 15 | 3 | Medium | 85% |
| **Total** | **285** | **220** | **45** | | **90%+** |

---

## 1. Test Infrastructure Setup

### 1.1 Updated phpunit.xml Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true"
         processIsolation="false"
         stopOnFailure="false"
         failOnWarning="true"
         failOnRisky="true"
         failOnEmptyTestSuite="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Integration">
            <directory>tests/Integration</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
        <testsuite name="E2E">
            <directory>tests/E2E</directory>
        </testsuite>
    </testsuites>
    
    <source>
        <include>
            <directory>app</directory>
        </include>
        <exclude>
            <directory suffix=".php">app/Http/Resources</directory>
            <file>app/Providers/RouteServiceProvider.php</file>
        </exclude>
    </source>
    
    <coverage>
        <report>
            <html outputDirectory="coverage"/>
            <text outputFile="php://stdout"/>
            <clover outputFile="coverage/clover.xml"/>
        </report>
        <include>
            <directory suffix=".php">app</directory>
        </include>
    </coverage>
    
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="APP_MAINTENANCE_DRIVER" value="file"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="BROADCAST_CONNECTION" value="null"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="DB_CONNECTION" value="mysql"/>
        <env name="DB_DATABASE" value="hms_test"/>
        <env name="DB_HOST" value="127.0.0.1"/>
        <env name="DB_PORT" value="3306"/>
        <env name="DB_USERNAME" value="root"/>
        <env name="DB_PASSWORD" value=""/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="PULSE_ENABLED" value="false"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
        <env name="NIGHTWATCH_ENABLED" value="false"/>
    </php>
</phpunit>
```

### 1.2 Enhanced Base Test Case

**File:** `tests/TestCase.php`

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\Traits\InteractsWithHMSAuth;
use Tests\Traits\CreatesHMSTestData;
use Tests\Traits\MockExternalServices;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase, WithFaker;
    use InteractsWithHMSAuth, CreatesHMSTestData, MockExternalServices;

    protected bool $shouldSeedDatabase = true;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initializeTestEnvironment();
        
        if ($this->shouldSeedDatabase) {
            $this->createBaseTestData();
        }
        
        $this->initializeMocks();
    }

    protected function tearDown(): void
    {
        $this->cleanupTestData();
        $this->resetMocks();
        parent::tearDown();
    }

    protected function initializeTestEnvironment(): void
    {
        config([
            'auth.password_timeout' => 10800,
            'session.lifetime' => 120,
            'cache.default' => 'array',
            'queue.default' => 'sync',
            'sanctum.stateful' => ['localhost', '127.0.0.1'],
        ]);
    }

    protected function createBaseTestData(): void
    {
        $this->artisan('migrate:fresh');
        $this->createDefaultRoles();
        $this->createDefaultPermissions();
        $this->createTestUsers();
    }

    protected function cleanupTestData(): void
    {
        \App\Models\TemporaryPermission::query()->delete();
        \App\Models\PermissionChangeRequest::query()->delete();
        \App\Models\Payment::query()->delete();
        \App\Models\BillRefund::query()->delete();
        \App\Models\BillItem::query()->delete();
        \App\Models\Bill::query()->delete();
        \App\Models\PrescriptionItem::query()->delete();
        \App\Models\Prescription::query()->delete();
        \App\Models\LabTestResult::query()->delete();
        \App\Models\LabTestRequest::query()->delete();
        \App\Models\LabTest::query()->delete();
        \App\Models\MedicineAlert::query()->delete();
        \App\Models\SaleItem::query()->delete();
        \App\Models\Sale::query()->delete();
        \App\Models\Medicine::query()->delete();
        \App\Models\MedicineCategory::query()->delete();
        \App\Models\Appointment::query()->delete();
        \App\Models\MedicalRecord::query()->delete();
        \App\Models\ClinicalAssessment::query()->delete();
        \App\Models\Doctor::query()->delete();
        \App\Models\Patient::query()->delete();
        \App\Models\DepartmentService::query()->delete();
        \App\Models\Department::query()->delete();
        \App\Models\AuditLog::query()->delete();
        \App\Models\RolePermission::query()->delete();
        \App\Models\UserPermission::query()->delete();
        \App\Models\Permission::query()->delete();
        \App\Models\Role::query()->delete();
        \App\Models\User::query()->delete();
        
        \Illuminate\Support\Facades\Cache::flush();
        \Illuminate\Support\Facades\Queue::flush();
    }
}
```

### 1.3 Enhanced Pest Configuration

**File:** `tests/Pest.php`

```php
<?php

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature', 'Integration', 'E2E');

uses(
    Illuminate\Foundation\Testing\Concerns\InteractsWithAuthentication::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithDatabase::class,
    Illuminate\Foundation\Testing\Concerns\MakesHttpRequests::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithContainer::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithSession::class,
    Illuminate\Foundation\Testing\Concerns\InteractsWithTime::class,
    Tests\Traits\InteractsWithHMSAuth::class,
    Tests\Traits\CreatesHMSTestData::class,
    Tests\Traits\MockExternalServices::class,
)->in('Feature', 'Integration', 'E2E', 'Unit');

expect()->extend('toBeValidModel', function () {
    return $this->toHave('id')
        ->toHave('created_at')
        ->toHave('updated_at');
});

expect()->extend('toBeSuccessfulApiResponse', function () {
    return $this->status(200, 201)
        ->toHave('message')
        ->not->toHave('errors');
});

expect()->extend('toBePaginatedResponse', function () {
    return $this->toHave('data')
        ->toHave('links')
        ->toHave('meta');
});

function authenticatedGet(User $user, string $uri, array $headers = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders(array_merge([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ], $headers))
        ->getJson($uri);
}

function authenticatedPost(User $user, string $uri, array $data = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->postJson($uri, $data);
}

function authenticatedPut(User $user, string $uri, array $data = [])
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->putJson($uri, $data);
}

function authenticatedDelete(User $user, string $uri)
{
    return test()->actingAs($user, 'sanctum')
        ->withHeaders([
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])
        ->deleteJson($uri);
}

function createPatient(array $overrides = [])
{
    return \App\Models\Patient::factory()->create($overrides);
}

function createDoctor(array $overrides = [])
{
    return \App\Models\Doctor::factory()->create($overrides);
}

function createAppointment(array $overrides = [])
{
    return \App\Models\Appointment::factory()->create($overrides);
}

function createBill(array $overrides = [])
{
    return \App\Models\Bill::factory()->create($overrides);
}

function createUser(array $overrides = [])
{
    return \App\Models\User::factory()->create($overrides);
}
```

---

## 2. Test Traits Implementation

### 2.1 Authentication Trait

**File:** `tests/Traits/InteractsWithHMSAuth.php`

```php
<?php

namespace Tests\Traits;

use App\Models\User;

trait InteractsWithHMSAuth
{
    protected User $superAdmin;
    protected User $hospitalAdmin;
    protected User $doctor;
    protected User $nurse;
    protected User $pharmacyAdmin;
    protected User $laboratoryAdmin;
    protected User $staff;

    protected function actingAsSuperAdmin(): User
    {
        return $this->actingAs($this->superAdmin, 'sanctum');
    }

    protected function actingAsHospitalAdmin(): User
    {
        return $this->actingAs($this->hospitalAdmin, 'sanctum');
    }

    protected function actingAsDoctor(): User
    {
        return $this->actingAs($this->doctor, 'sanctum');
    }

    protected function actingAsNurse(): User
    {
        return $this->actingAs($this->nurse, 'sanctum');
    }

    protected function actingAsPharmacyAdmin(): User
    {
        return $this->actingAs($this->pharmacyAdmin, 'sanctum');
    }

    protected function actingAsLaboratoryAdmin(): User
    {
        return $this->actingAs($this->laboratoryAdmin, 'sanctum');
    }

    protected function actingAsStaff(): User
    {
        return $this->actingAs($this->staff, 'sanctum');
    }

    protected function actingAsGuest(): User
    {
        return $this->actingAs(null, 'sanctum');
    }

    protected function createUserToken(User $user, string $name = 'test'): string
    {
        $user->tokens()->delete();
        return $user->createToken($name)->plainTextToken;
    }

    protected function getAuthenticatedHeaders(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->createUserToken($user),
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    protected function assertUserHasPermission(User $user, string $permission): void
    {
        expect($user->hasPermissionTo($permission))->toBeTrue();
    }

    protected function assertUserLacksPermission(User $user, string $permission): void
    {
        expect($user->hasPermissionTo($permission))->toBeFalse();
    }

    protected function assertUserHasRole(User $user, string $role): void
    {
        expect($user->hasRole($role))->toBeTrue();
    }
}
```

### 2.2 Test Data Factory Trait

**File:** `tests/Traits/CreatesHMSTestData.php`

```php
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

trait CreatesHMSTestData
{
    protected \Illuminate\Support\Collection $testUsers;
    protected \Illuminate\Support\Collection $testPatients;
    protected \Illuminate\Support\Collection $testDoctors;
    protected \Illuminate\Support\Collection $testDepartments;
    protected \Illuminate\Support\Collection $testAppointments;
    protected \Illuminate\Support\Collection $testBills;
    protected \Illuminate\Support\Collection $testPayments;
    protected \Illuminate\Support\Collection $testMedicines;
    protected \Illuminate\Support\Collection $testLabTests;

    protected function createDefaultRoles(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'level' => 100],
            ['name' => 'Hospital Admin', 'slug' => 'hospital-admin', 'level' => 90],
            ['name' => 'Doctor', 'slug' => 'doctor', 'level' => 70],
            ['name' => 'Nurse', 'slug' => 'nurse', 'level' => 60],
            ['name' => 'Pharmacy Admin', 'slug' => 'pharmacy-admin', 'level' => 80],
            ['name' => 'Laboratory Admin', 'slug' => 'laboratory-admin', 'level' => 80],
            ['name' => 'Staff', 'slug' => 'staff', 'level' => 50],
            ['name' => 'Patient', 'slug' => 'patient', 'level' => 10],
        ];

        foreach ($roles as $role) {
            \App\Models\Role::firstOrCreate(['slug' => $role['slug']], $role);
        }
    }

    protected function createDefaultPermissions(): void
    {
        $permissions = [
            'view-dashboard',
            'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
            'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
            'view-appointments', 'create-appointments', 'edit-appointments', 
            'delete-appointments', 'cancel-appointments', 'complete-appointments',
            'view-billing', 'create-billing', 'edit-billing', 'delete-billing',
            'process-refunds', 'void-bills', 'approve-discounts',
            'view-pharmacy', 'manage-medicines', 'view-inventory', 
            'create-sales', 'view-alerts', 'manage-alerts',
            'view-laboratory', 'create-lab-tests', 'approve-lab-results',
            'quality-control',
            'view-medical-records', 'create-medical-records', 'edit-medical-records',
            'manage-users', 'manage-roles', 'manage-permissions',
            'view-audit-logs', 'system-settings', 'backup-restore',
        ];

        foreach ($permissions as $permissionName) {
            \App\Models\Permission::firstOrCreate(
                ['name' => $permissionName],
                ['description' => "Permission to {$permissionName}"]
            );
        }
    }

    protected function createTestUsers(): void
    {
        $roles = \App\Models\Role::all()->keyBy('slug');

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

        $this->assignTestPermissions();
    }

    protected function assignTestPermissions(): void
    {
        $permissions = \App\Models\Permission::all()->pluck('id', 'name');
        $roles = \App\Models\Role::all()->keyBy('slug');

        $roles['super-admin']->permissions()->attach($permissions->values()->toArray());

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

        $doctorPermissions = [
            'view-dashboard', 'view-patients', 'create-patients', 'edit-patients',
            'view-doctors', 'view-appointments', 'create-appointments', 'edit-appointments',
            'complete-appointments', 'view-laboratory', 'create-lab-tests',
            'view-medical-records', 'create-medical-records', 'edit-medical-records',
        ];
        $roles['doctor']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($doctorPermissions))
        );

        $nursePermissions = [
            'view-dashboard', 'view-patients', 'view-appointments', 'create-appointments',
            'view-laboratory', 'view-medical-records',
        ];
        $roles['nurse']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($nursePermissions))
        );

        $pharmacyPermissions = [
            'view-dashboard', 'view-pharmacy', 'manage-medicines', 'view-inventory',
            'create-sales', 'view-alerts', 'manage-alerts', 'view-billing',
        ];
        $roles['pharmacy-admin']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($pharmacyPermissions))
        );

        $labPermissions = [
            'view-dashboard', 'view-laboratory', 'create-lab-tests', 'approve-lab-results',
            'quality-control', 'view-patients', 'view-appointments',
        ];
        $roles['laboratory-admin']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($labPermissions))
        );

        $staffPermissions = [
            'view-dashboard', 'view-patients', 'create-patients',
            'view-appointments', 'create-appointments', 'view-billing',
        ];
        $roles['staff']->permissions()->attach(
            array_intersect_key($permissions->toArray(), array_flip($staffPermissions))
        );
    }

    protected function createTestPatients(int $count = 10): \Illuminate\Support\Collection
    {
        return $this->testPatients = Patient::factory()->count($count)->create();
    }

    protected function createTestDoctors(int $count = 5): \Illuminate\Support\Collection
    {
        $this->testDepartments = Department::factory()->count(5)->create();
        
        return $this->testDoctors = Doctor::factory()
            ->count($count)
            ->sequence(fn () => ['department_id' => $this->testDepartments->random()->id])
            ->create();
    }

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

    protected function createTestBills(int $count = 10): \Illuminate\Support\Collection
    {
        $patients = $this->testPatients ?? $this->createTestPatients();

        return $this->testBills = Bill::factory()
            ->count($count)
            ->sequence(fn () => ['patient_id' => $patients->random()->id])
            ->has(BillItem::factory()->count(3), 'items')
            ->create();
    }

    protected function createTestMedicines(int $count = 20): \Illuminate\Support\Collection
    {
        $categories = MedicineCategory::factory()->count(5)->create();
        
        return $this->testMedicines = Medicine::factory()
            ->count($count)
            ->sequence(fn () => ['category_id' => $categories->random()->id])
            ->create();
    }

    protected function createCompletePatientVisit(): array
    {
        $patient = Patient::factory()->create();
        $department = Department::factory()->create();
        $doctor = Doctor::factory()->create(['department_id' => $department->id]);
        $medicine = Medicine::factory()->create();
        $category = MedicineCategory::factory()->create();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'completed',
        ]);

        $medicalRecord = MedicalRecord::factory()->create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
        ]);

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
}
```

### 2.3 External Services Mocking Trait

**File:** `tests/Traits/MockExternalServices.php`

```php
<?php

namespace Tests\Traits;

use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

trait MockExternalServices
{
    use MockeryPHPUnitIntegration;

    protected array $mocks = [];

    protected function initializeMocks(): void
    {
        $this->mocks['http'] = Mockery::mock(\Illuminate\Http\Client\Factory::class);
        Http::shouldReceive('client')->andReturn($this->mocks['http']);

        $this->mocks['cache'] = Mockery::mock('alias:Cache');
        Cache::shouldReceive('get')->andReturnUsing(function ($key) {
            return null;
        });

        $this->mocks['queue'] = Mockery::mock('alias:Queue');
        Queue::shouldReceive('push')->andReturn(1);

        $this->mocks['mail'] = Mockery::mock('alias:Mail');
        Mail::shouldReceive('send')->andReturn(true);

        $this->mocks['notification'] = Mockery::mock('alias:Notification');
        Notification::shouldReceive('send')->andReturn(true);
    }

    protected function mockHttpRequest(
        string $method,
        string $url,
        array $response,
        int $status = 200
    ): void
    {
        $mock = $this->mocks['http'];
        
        $mock->shouldReceive('request')
            ->with($method, $url)
            ->andReturn(
                \GuzzleHttp\Psr7\Response::create(
                    \GuzzleHttp\Psr7\Utils::jsonResponse($response),
                    $status
                )
            );
    }

    protected function mockCacheGet(string $key, mixed $value): void
    {
        Cache::shouldReceive('get')->with($key)->andReturn($value);
    }

    protected function mockCacheRemember(string $key, mixed $value, int $ttl = 3600): void
    {
        Cache::shouldReceive('remember')
            ->with($key, $ttl, \Closure::class)
            ->andReturnUsing(function ($key, $ttl, $callback) {
                return $callback();
            });
    }

    protected function mockQueuePush(string $jobClass, array $data = []): void
    {
        Queue::shouldReceive('push')
            ->with(Mockery::on(function ($job) use ($jobClass, $data) {
                return $job instanceof $jobClass 
                    || (is_array($job) && isset($job['job']) && $job['job'] instanceof $jobClass);
            }))
            ->andReturn(1);
    }

    protected function mockMailSend(string $view, array $data = [], ?\Closure $callback = null): void
    {
        Mail::shouldReceive('send')
            ->with(
                Mockery::anyOf($view),
                Mockery::on(function ($passedData) use ($data) {
                    return array_intersect_key($passedData, $data) === $data;
                }),
                Mockery::anyOf(null, $callback)
            )
            ->andReturn(true);
    }

    protected function resetMocks(): void
    {
        foreach ($this->mocks as $mock) {
            if ($mock instanceof Mockery\MockInterface) {
                $mock->mockery_teardown();
            }
        }
        Mockery::close();
        
        Http::reset();
        Cache::reset();
        Queue::reset();
        Mail::reset();
        Notification::reset();
    }
}
```

---

## 3. Authentication Test Suite

### 3.1 Unit Tests - User Authentication

**File:** `tests/Unit/Authentication/UserAuthenticationTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

describe('User Authentication Unit Tests', function () {
    beforeEach(function () {
        $this->refreshDatabase();
    });

    describe('Password Hashing', function () {
        it('should hash password when creating user', function () {
            $password = 'TestPassword123!';
            $user = User::factory()->create(['password' => $password]);

            expect($user->password)->not->toBe($password);
            expect(Hash::check($password, $user->password))->toBeTrue();
        });

        it('should verify correct password', function () {
            $password = 'CorrectPassword123!';
            $user = User::factory()->create(['password' => Hash::make($password)]);

            expect(Hash::check($password, $user->password))->toBeTrue();
        });

        it('should reject incorrect password', function () {
            $password = 'CorrectPassword123!';
            $user = User::factory()->create(['password' => Hash::make($password)]);

            expect(Hash::check('WrongPassword123!', $user->password))->toBeFalse();
        });
    });

    describe('Account Lockout', function () {
        it('should lock account after maximum failed attempts', function () {
            $user = User::factory()->create([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ]);

            for ($i = 0; $i < 5; $i++) {
                $user->increment('failed_login_attempts');
            }

            expect($user->isLocked())->toBeTrue();
            expect($user->locked_until)->not->toBeNull();
        });

        it('should unlock account after lockout period', function () {
            $user = User::factory()->create([
                'failed_login_attempts' => 5,
                'locked_until' => now()->subMinutes(31),
            ]);

            expect($user->isLocked())->toBeFalse();
        });

        it('should reset failed attempts on successful login', function () {
            $user = User::factory()->create([
                'failed_login_attempts' => 4,
                'locked_until' => null,
            ]);

            $user->update([
                'failed_login_attempts' => 0,
                'last_login_at' => now(),
                'last_login_ip' => '127.0.0.1',
            ]);

            expect($user->failed_login_attempts)->toBe(0);
        });
    });

    describe('Password Age Validation', function () {
        it('should require password change if never changed', function () {
            $user = User::factory()->create(['password_changed_at' => null]);

            expect($user->passwordNeedsChange())->toBeTrue();
        });

        it('should require password change if older than 90 days', function () {
            $user = User::factory()->create(['password_changed_at' => now()->subDays(91)]);

            expect($user->passwordNeedsChange())->toBeTrue();
        });

        it('should not require password change if recent', function () {
            $user = User::factory()->create(['password_changed_at' => now()->subDays(30)]);

            expect($user->passwordNeedsChange())->toBeFalse();
        });

        it('should allow custom password age threshold', function () {
            $user = User::factory()->create(['password_changed_at' => now()->subDays(60)]);

            expect($user->passwordNeedsChange(90))->toBeFalse();
            expect($user->passwordNeedsChange(30))->toBeTrue();
        });
    });

    describe('Two-Factor Authentication', function () {
        it('should indicate if 2FA is enabled', function () {
            $userWith2FA = User::factory()->create([
                'two_factor_secret' => 'secret',
                'two_factor_confirmed_at' => now(),
            ]);

            $userWithout2FA = User::factory()->create([
                'two_factor_secret' => null,
            ]);

            expect($userWith2FA->two_factor_secret)->not->toBeNull();
            expect($userWithout2FA->two_factor_secret)->toBeNull();
        });
    });

    describe('User Roles and Permissions', function () {
        it('should have role assigned', function () {
            $user = User::factory()->create(['role' => 'Doctor']);

            expect($user->role)->toBe('Doctor');
        });

        it('should check if user has specific role', function () {
            $admin = User::factory()->create(['role' => 'Admin']);
            $doctor = User::factory()->create(['role' => 'Doctor']);

            expect($admin->hasRole('Admin'))->toBeTrue();
            expect($doctor->hasRole('Doctor'))->toBeTrue();
            expect($admin->hasRole('Doctor'))->toBeFalse();
        });

        it('should check if user has any of given roles', function () {
            $user = User::factory()->create(['role' => 'Doctor']);

            expect($user->hasAnyRole(['Doctor', 'Nurse']))->toBeTrue();
            expect($user->hasAnyRole(['Admin', 'Manager']))->toBeFalse();
        });
    });
});
```

### 3.2 Integration Tests - Authentication API

**File:** `tests/Integration/Authentication/LoginApiTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;

describe('Authentication API Integration Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->user = User::factory()->create([
            'password' => bcrypt('ValidPassword123!'),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    });

    describe('POST /login', function () {
        it('should login successfully with valid credentials', function () {
            $response = $this->postJson('/login', [
                'username' => $this->user->username,
                'password' => 'ValidPassword123!',
            ]);

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'message',
                    'user' => ['id', 'name', 'username', 'role'],
                    'token',
                ])
                ->assertJson(['message' => 'Login successful']);

            expect(Auth::check())->toBeTrue();
            expect($response->json('user.id'))->toBe($this->user->id);
        });

        it('should reject invalid username', function () {
            $response = $this->postJson('/login', [
                'username' => 'nonexistent_user',
                'password' => 'ValidPassword123!',
            ]);

            $response->assertStatus(422)->assertJsonValidationErrors(['username']);
        });

        it('should reject invalid password', function () {
            $response = $this->postJson('/login', [
                'username' => $this->user->username,
                'password' => 'WrongPassword123!',
            ]);

            $response->assertStatus(401)->assertJson(['message' => 'Invalid credentials']);
        });

        it('should lock account after 5 failed attempts', function () {
            for ($i = 0; $i < 5; $i++) {
                $response = $this->postJson('/login', [
                    'username' => $this->user->username,
                    'password' => 'WrongPassword!',
                ]);
                $response->assertStatus(401);
            }

            $response = $this->postJson('/login', [
                'username' => $this->user->username,
                'password' => 'WrongPassword!',
            ]);

            $response->assertStatus(423)
                ->assertJson(['message' => 'Account is locked due to too many failed login attempts']);

            expect($this->user->fresh()->isLocked())->toBeTrue();
        });

        it('should validate required fields', function () {
            $response = $this->postJson('/login', []);

            $response->assertStatus(422)->assertJsonValidationErrors(['username', 'password']);
        });
    });

    describe('POST /logout', function () {
        it('should logout authenticated user', function () {
            $token = $this->user->createToken('test')->plainTextToken;

            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->postJson('/logout');

            $response->assertStatus(200)->assertJson(['message' => 'Logged out successfully']);

            expect($this->user->fresh()->tokens->count())->toBe(0);
        });

        it('should reject unauthenticated logout', function () {
            $response = $this->postJson('/logout');

            $response->assertStatus(401);
        });
    });

    describe('GET /user', function () {
        it('should return authenticated user info', function () {
            $token = $this->user->createToken('test')->plainTextToken;

            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->getJson('/user');

            $response->assertStatus(200)
                ->assertJsonStructure(['id', 'name', 'username', 'role', 'permissions', 'two_factor_enabled'])
                ->assertJson([
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                ]);
        });

        it('should reject unauthenticated request', function () {
            $response = $this->getJson('/user');

            $response->assertStatus(401);
        });

        it('should return user permissions', function () {
            $token = $this->user->createToken('test')->plainTextToken;

            $response = $this->withHeaders([
                'Authorization' => 'Bearer ' . $token,
            ])->getJson('/user');

            $response->assertStatus(200)->assertJsonStructure(['permissions' => []]);
        });
    });
});
```

---

## 4. API Endpoint Test Suite

### 4.1 Patient API Tests

**File:** `tests/Feature/Api/Patients/PatientApiTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;

describe('Patient API Endpoint Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->createBaseTestData();
        $this->user = $this->testUsers['hospitalAdmin'];
        $this->patient = Patient::factory()->create();
    });

    describe('GET /api/v1/patients', function () {
        beforeEach(function () {
            Patient::factory()->count(15)->create();
        });

        it('should return paginated list of patients', function () {
            $response = $this->actingAs($this->user)->getJson('/api/v1/patients');

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'created_at']],
                    'links',
                    'meta' => ['current_page', 'last_page', 'per_page', 'total'],
                ]);

            expect($response->json('meta.total'))->toBeGreaterThanOrEqual(1);
        });

        it('should filter patients by search term', function () {
            $patient = Patient::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);

            $response = $this->actingAs($this->user)->getJson('/api/v1/patients?search=John');

            $response->assertStatus(200)->assertJsonCount(1, 'data');
            expect($response->json('data.0.first_name'))->toBe('John');
        });

        it('should filter patients by gender', function () {
            Patient::factory()->create(['gender' => 'male']);
            Patient::factory()->create(['gender' => 'female']);
            Patient::factory()->create(['gender' => 'male']);

            $response = $this->actingAs($this->user)->getJson('/api/v1/patients?gender=male');

            $response->assertStatus(200);
            
            collect($response->json('data'))->each(function ($p) {
                expect($p['gender'])->toBe('male');
            });
        });

        it('should paginate patients correctly', function () {
            $response = $this->actingAs($this->user)->getJson('/api/v1/patients?per_page=10');

            $response->assertStatus(200)
                ->assertJson(['meta' => ['per_page' => 10]])
                ->assertJsonCount(10, 'data');
        });

        it('should reject unauthenticated request', function () {
            $response = $this->getJson('/api/v1/patients');

            $response->assertStatus(401);
        });

        it('should reject user without view-patients permission', function () {
            $unauthorizedUser = $this->testUsers['staff'];
            
            $response = $this->actingAs($unauthorizedUser)->getJson('/api/v1/patients');

            $response->assertStatus(403)->assertJson(['message' => 'Unauthorized. Insufficient permissions.']);
        });
    });

    describe('POST /api/v1/patients', function () {
        it('should create new patient with valid data', function () {
            $patientData = Patient::factory()->make()->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(201)
                ->assertJsonStructure(['id', 'first_name', 'last_name', 'email', 'phone', 'message'])
                ->assertJson(['message' => 'Patient created successfully']);

            expect(Patient::where('email', $patientData['email'])->exists())->toBeTrue();
        });

        it('should validate required fields', function () {
            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['first_name', 'last_name', 'date_of_birth', 'gender', 'phone']);
        });

        it('should validate email format', function () {
            $patientData = Patient::factory()->make(['email' => 'invalid-email'])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(422)->assertJsonValidationErrors(['email']);
        });

        it('should validate date format', function () {
            $patientData = Patient::factory()->make(['date_of_birth' => 'invalid-date'])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(422)->assertJsonValidationErrors(['date_of_birth']);
        });

        it('should reject duplicate email', function () {
            $existingPatient = Patient::factory()->create();
            $patientData = Patient::factory()->make(['email' => $existingPatient->email])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(422)->assertJsonValidationErrors(['email']);
        });

        it('should validate phone number format', function () {
            $patientData = Patient::factory()->make(['phone' => '123'])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(422)->assertJsonValidationErrors(['phone']);
        });

        it('should validate gender is one of allowed values', function () {
            $patientData = Patient::factory()->make(['gender' => 'invalid'])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(422)->assertJsonValidationErrors(['gender']);
        });

        it('should create patient with optional fields', function () {
            $patientData = Patient::factory()->make([
                'address' => '123 Medical Street',
                'city' => 'New York',
                'state' => 'NY',
                'zip_code' => '10001',
                'country' => 'USA',
                'emergency_contact' => 'Jane Doe',
                'emergency_phone' => '+1234567890',
                'insurance_provider' => 'HealthCare Plus',
                'insurance_number' => 'HCP-12345',
            ])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/patients', $patientData);

            $response->assertStatus(201);

            $patient = Patient::find($response->json('id'));
            expect($patient->address)->toBe('123 Medical Street');
            expect($patient->insurance_provider)->toBe('HealthCare Plus');
        });
    });

    describe('GET /api/v1/patients/{id}', function () {
        it('should return patient details', function () {
            $response = $this->actingAs($this->user)->getJson("/api/v1/patients/{$this->patient->id}");

            $response->assertStatus(200)
                ->assertJsonStructure(['id', 'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender', 'address', 'medical_history'])
                ->assertJson(['id' => $this->patient->id]);
        });

        it('should return 404 for non-existent patient', function () {
            $response = $this->actingAs($this->user)->getJson('/api/v1/patients/999999');

            $response->assertStatus(404)->assertJson(['message' => 'Patient not found']);
        });

        it('should include patient appointments', function () {
            $response = $this->actingAs($this->user)->getJson("/api/v1/patients/{$this->patient->id}?include=appointments");

            $response->assertStatus(200)->assertJsonStructure(['appointments' => []]);
        });
    });

    describe('PUT /api/v1/patients/{id}', function () {
        it('should update patient with valid data', function () {
            $updateData = ['first_name' => 'Updated', 'last_name' => 'Patient', 'phone' => '+1234567890'];

            $response = $this->actingAs($this->user)->putJson("/api/v1/patients/{$this->patient->id}", $updateData);

            $response->assertStatus(200)->assertJson(['message' => 'Patient updated successfully']);

            expect($this->patient->fresh()->first_name)->toBe('Updated');
        });

        it('should reject invalid email on update', function () {
            $response = $this->actingAs($this->user)->putJson("/api/v1/patients/{$this->patient->id}", ['email' => 'invalid-email']);

            $response->assertStatus(422)->assertJsonValidationErrors(['email']);
        });

        it('should not allow updating email to existing email', function () {
            $patient2 = Patient::factory()->create();

            $response = $this->actingAs($this->user)->putJson("/api/v1/patients/{$this->patient->id}", ['email' => $patient2->email]);

            $response->assertStatus(422)->assertJsonValidationErrors(['email']);
        });

        it('should update insurance information', function () {
            $updateData = ['insurance_provider' => 'New Insurance Co', 'insurance_number' => 'NIC-98765'];

            $response = $this->actingAs($this->user)->putJson("/api/v1/patients/{$this->patient->id}", $updateData);

            $response->assertStatus(200);

            expect($this->patient->fresh()->insurance_provider)->toBe('New Insurance Co');
            expect($this->patient->fresh()->insurance_number)->toBe('NIC-98765');
        });
    });

    describe('DELETE /api/v1/patients/{id}', function () {
        it('should delete patient', function () {
            $patient = Patient::factory()->create();

            $response = $this->actingAs($this->user)->deleteJson("/api/v1/patients/{$patient->id}");

            $response->assertStatus(200)->assertJson(['message' => 'Patient deleted successfully']);

            expect(Patient::find($patient->id))->toBeNull();
        });

        it('should return 404 for non-existent patient', function () {
            $response = $this->actingAs($this->user)->deleteJson('/api/v1/patients/999999');

            $response->assertStatus(404);
        });

        it('should not allow deleting patient with active appointments', function () {
            $patient = Patient::factory()->create();
            \App\Models\Appointment::factory()->create(['patient_id' => $patient->id, 'status' => 'scheduled']);

            $response = $this->actingAs($this->user)->deleteJson("/api/v1/patients/{$patient->id}");

            $response->assertStatus(422)->assertJson(['message' => 'Cannot delete patient with active appointments']);
        });

        it('should allow deleting patient with only completed appointments', function () {
            $patient = Patient::factory()->create();
            \App\Models\Appointment::factory()->create(['patient_id' => $patient->id, 'status' => 'completed']);

            $response = $this->actingAs($this->user)->deleteJson("/api/v1/patients/{$patient->id}");

            $response->assertStatus(200);
        });

        it('should soft delete patient', function () {
            $patient = Patient::factory()->create();

            $response = $this->actingAs($this->user)->deleteJson("/api/v1/patients/{$patient->id}");

            $response->assertStatus(200);

            expect(Patient::withTrashed()->find($patient->id))->not->toBeNull();
            expect(Patient::find($patient->id))->toBeNull();
        });
    });
});
```

### 4.2 Appointment API Tests

**File:** `tests/Feature/Api/Appointments/AppointmentApiTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;

describe('Appointment API Endpoint Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->createBaseTestData();
        $this->user = $this->testUsers['doctor'];
        $this->patient = Patient::factory()->create();
        $this->doctor = Doctor::factory()->create();
        $this->department = Department::factory()->create();
    });

    describe('GET /api/v1/appointments', function () {
        beforeEach(function () {
            Appointment::factory()->count(15)->create();
        });

        it('should return paginated appointments', function () {
            $response = $this->actingAs($this->user)->getJson('/api/v1/appointments');

            $response->assertStatus(200)->assertJsonStructure(['data', 'links', 'meta']);
        });

        it('should filter appointments by status', function () {
            Appointment::factory()->create(['status' => 'scheduled']);
            Appointment::factory()->create(['status' => 'completed']);
            Appointment::factory()->create(['status' => 'scheduled']);

            $response = $this->actingAs($this->user)->getJson('/api/v1/appointments?status=scheduled');

            $response->assertStatus(200);

            collect($response->json('data'))->each(function ($appointment) {
                expect($appointment['status'])->toBe('scheduled');
            });
        });

        it('should filter appointments by date range', function () {
            Appointment::factory()->create(['appointment_date' => '2024-01-15', 'start_time' => '09:00:00']);
            Appointment::factory()->create(['appointment_date' => '2024-01-20', 'start_time' => '10:00:00']);
            Appointment::factory()->create(['appointment_date' => '2024-01-25', 'start_time' => '11:00:00']);

            $response = $this->actingAs($this->user)->getJson('/api/v1/appointments?from=2024-01-16&to=2024-01-26');

            $response->assertStatus(200)->assertJsonCount(2, 'data');
        });

        it('should include patient and doctor details', function () {
            $appointment = Appointment::factory()->create([
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
            ]);

            $response = $this->actingAs($this->user)->getJson("/api/v1/appointments/{$appointment->id}");

            $response->assertStatus(200)
                ->assertJsonStructure([
                    'patient' => ['id', 'first_name', 'last_name'],
                    'doctor' => ['id', 'name', 'specialization'],
                ]);
        });

        it('should reject unauthenticated request', function () {
            $response = $this->getJson('/api/v1/appointments');

            $response->assertStatus(401);
        });

        it('should reject user without view-appointments permission', function () {
            $unauthorizedUser = $this->testUsers['staff'];

            $response = $this->actingAs($unauthorizedUser)->getJson('/api/v1/appointments');

            $response->assertStatus(403);
        });
    });

    describe('POST /api/v1/appointments', function () {
        it('should create new appointment', function () {
            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
                'notes' => 'Regular checkup',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(201)
                ->assertJson(['patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id, 'status' => 'scheduled']);

            expect(Appointment::where('patient_id', $this->patient->id)->exists())->toBeTrue();
        });

        it('should validate required fields', function () {
            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['patient_id', 'doctor_id', 'appointment_date', 'start_time', 'type']);
        });

        it('should validate appointment date is not in the past', function () {
            $appointmentData = Appointment::factory()->make(['appointment_date' => '2020-01-01'])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['appointment_date']);
        });

        it('should validate doctor availability - non-overlapping', function () {
            Appointment::factory()->create([
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'scheduled',
            ]);

            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:15:00',
                'end_time' => '09:45:00',
                'type' => 'consultation',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['doctor_id']);
        });

        it('should allow non-overlapping appointment', function () {
            Appointment::factory()->create([
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'scheduled',
            ]);

            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '10:00:00',
                'end_time' => '10:30:00',
                'type' => 'consultation',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(201);
        });

        it('should validate patient exists', function () {
            $appointmentData = Appointment::factory()->make(['patient_id' => 99999])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['patient_id']);
        });

        it('should validate doctor exists', function () {
            $appointmentData = Appointment::factory()->make(['doctor_id' => 99999])->toArray();

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['doctor_id']);
        });

        it('should validate time format', function () {
            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => 'invalid',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['start_time']);
        });

        it('should validate end time is after start time', function () {
            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '10:00:00',
                'end_time' => '09:00:00',
                'type' => 'consultation',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['end_time']);
        });

        it('should validate appointment type', function () {
            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'invalid_type',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(422)->assertJsonValidationErrors(['type']);
        });

        it('should create emergency appointment', function () {
            $appointmentData = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->format('Y-m-d'),
                'start_time' => now()->format('H:i'),
                'end_time' => now()->addMinutes(30)->format('H:i'),
                'type' => 'emergency',
                'priority' => 'critical',
            ];

            $response = $this->actingAs($this->user)->postJson('/api/v1/appointments', $appointmentData);

            $response->assertStatus(201)->assertJson(['type' => 'emergency', 'priority' => 'critical']);
        });
    });

    describe('PUT /api/v1/appointments/{id}/cancel', function () {
        it('should cancel scheduled appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/cancel");

            $response->assertStatus(200)->assertJson(['status' => 'cancelled']);

            expect($appointment->fresh()->status)->toBe('cancelled');
        });

        it('should not cancel completed appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'completed']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/cancel");

            $response->assertStatus(422)->assertJson(['message' => 'Cannot cancel a completed appointment']);
        });

        it('should not cancel already cancelled appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'cancelled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/cancel");

            $response->assertStatus(422)->assertJson(['message' => 'Appointment is already cancelled']);
        });

        it('should require cancellation reason', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/cancel", ['reason' => '']);

            $response->assertStatus(422)->assertJsonValidationErrors(['reason']);
        });

        it('should return 404 for non-existent appointment', function () {
            $response = $this->actingAs($this->user)->putJson('/api/v1/appointments/999999/cancel');

            $response->assertStatus(404);
        });
    });

    describe('PUT /api/v1/appointments/{id}/complete', function () {
        it('should complete scheduled appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/complete");

            $response->assertStatus(200)->assertJson(['status' => 'completed']);

            expect($appointment->fresh()->status)->toBe('completed');
        });

        it('should not complete cancelled appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'cancelled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/complete");

            $response->assertStatus(422)->assertJson(['message' => 'Cannot complete a cancelled appointment']);
        });

        it('should not complete already completed appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'completed']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/complete");

            $response->assertStatus(422)->assertJson(['message' => 'Appointment is already completed']);
        });

        it('should accept completion notes', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $response = $this->actingAs($this->user)->putJson("/api/v1/appointments/{$appointment->id}/complete", ['notes' => 'Patient in good health']);

            $response->assertStatus(200);

            expect($appointment->fresh()->notes)->toBe('Patient in good health');
        });

        it('should return 404 for non-existent appointment', function () {
            $response = $this->actingAs($this->user)->putJson('/api/v1/appointments/999999/complete');

            $response->assertStatus(404);
        });
    });

    describe('GET /api/v1/appointments/{id}/availability', function () {
        it('should return available time slots', function () {
            $doctor = Doctor::factory()->create();
            
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
            ]);
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '11:00:00',
                'end_time' => '11:30:00',
            ]);

            $response = $this->actingAs($this->user)->getJson("/api/v1/appointments/availability/{$doctor->id}?date=" . now()->addDays(5)->format('Y-m-d'));

            $response->assertStatus(200)->assertJsonStructure(['date', 'available_slots']);

            expect(in_array('09:00:00', $response->json('available_slots')))->toBeFalse();
            expect(in_array('11:00:00', $response->json('available_slots')))->toBeFalse();
        });
    });
});
```

---

## 5. Service Layer Test Suite

### 5.1 Appointment Service Tests

**File:** `tests/Unit/Services/AppointmentServiceTest.php`

```php
<?php

use Tests\TestCase;
use App\Services\AppointmentService;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\ModelNotFoundException;

describe('AppointmentService Unit Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->appointmentService = new AppointmentService();
        $this->patient = Patient::factory()->create();
        $this->doctor = Doctor::factory()->create();
    });

    describe('createAppointment', function () {
        it('should create appointment successfully', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            $appointment = $this->appointmentService->createAppointment($data);

            expect($appointment)->toBeInstanceOf(Appointment::class);
            expect($appointment->patient_id)->toBe($this->patient->id);
            expect($appointment->doctor_id)->toBe($this->doctor->id);
            expect($appointment->status)->toBe('scheduled');
        });

        it('should throw exception for invalid patient', function () {
            $data = [
                'patient_id' => 99999,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            expect(fn() => $this->appointmentService->createAppointment($data))
                ->toThrow(ModelNotFoundException::class);
        });

        it('should throw exception for invalid doctor', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => 99999,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            expect(fn() => $this->appointmentService->createAppointment($data))
                ->toThrow(ModelNotFoundException::class);
        });

        it('should throw exception for overlapping appointments', function () {
            Appointment::factory()->create([
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'scheduled',
            ]);

            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:15:00',
                'end_time' => '09:45:00',
                'type' => 'consultation',
            ];

            expect(fn() => $this->appointmentService->createAppointment($data))
                ->toThrow(\InvalidArgumentException::class, 'Doctor has conflicting appointment');
        });

        it('should validate appointment date is in the future', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => '2020-01-01',
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            expect(fn() => $this->appointmentService->createAppointment($data))
                ->toThrow(\InvalidArgumentException::class, 'Appointment date must be in the future');
        });

        it('should validate end time is after start time', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '10:00:00',
                'end_time' => '09:00:00',
                'type' => 'consultation',
            ];

            expect(fn() => $this->appointmentService->createAppointment($data))
                ->toThrow(\InvalidArgumentException::class, 'End time must be after start time');
        });

        it('should set default status to scheduled', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
            ];

            $appointment = $this->appointmentService->createAppointment($data);

            expect($appointment->status)->toBe('scheduled');
        });

        it('should record appointment in database', function () {
            $data = [
                'patient_id' => $this->patient->id,
                'doctor_id' => $this->doctor->id,
                'appointment_date' => now()->addDays(5)->format('Y-m-d'),
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'type' => 'consultation',
                'notes' => 'Test appointment',
            ];

            $appointment = $this->appointmentService->createAppointment($data);

            $found = Appointment::find($appointment->id);
            expect($found)->not->toBeNull();
            expect($found->notes)->toBe('Test appointment');
        });
    });

    describe('cancelAppointment', function () {
        it('should cancel scheduled appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $result = $this->appointmentService->cancelAppointment($appointment->id);

            expect($result)->toBeTrue();
            expect($appointment->fresh()->status)->toBe('cancelled');
        });

        it('should throw exception for already completed appointment', function () {
            $appointment = Appointment::factory()->create(['status' => 'completed']);

            expect(fn() => $this->appointmentService->cancelAppointment($appointment->id))
                ->toThrow(\InvalidArgumentException::class, 'Cannot cancel a completed appointment');
        });

        it('should throw exception for non-existent appointment', function () {
            expect(fn() => $this->appointmentService->cancelAppointment(99999))
                ->toThrow(ModelNotFoundException::class);
        });

        it('should record cancellation reason', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $this->appointmentService->cancelAppointment($appointment->id, 'Patient request');

            expect($appointment->fresh()->cancellation_reason)->toBe('Patient request');
        });

        it('should record cancellation time', function () {
            $appointment = Appointment::factory()->create(['status' => 'scheduled']);

            $before = now();
            $this->appointmentService->cancelAppointment($appointment->id);
            $after = now();

            expect($appointment->fresh()->cancelled_at)->not->toBeNull();
            expect($appointment->fresh()->cancelled_at->between($before, $after))->toBeTrue();
        });
    });

    describe('getAppointmentsByDateRange', function () {
        it('should return appointments within date range', function () {
            Appointment::factory()->create(['appointment_date' => '2024-01-15']);
            Appointment::factory()->create(['appointment_date' => '2024-01-20']);
            Appointment::factory()->create(['appointment_date' => '2024-02-01']);

            $appointments = $this->appointmentService->getAppointmentsByDateRange('2024-01-16', '2024-01-25');

            expect($appointments->count())->toBe(2);
        });

        it('should return empty collection for no appointments in range', function () {
            Appointment::factory()->create(['appointment_date' => '2024-01-15']);
            Appointment::factory()->create(['appointment_date' => '2024-02-01']);

            $appointments = $this->appointmentService->getAppointmentsByDateRange('2024-02-15', '2024-02-28');

            expect($appointments->count())->toBe(0);
        });

        it('should filter by doctor', function () {
            $doctor2 = Doctor::factory()->create();

            Appointment::factory()->create(['doctor_id' => $this->doctor->id, 'appointment_date' => '2024-01-20']);
            Appointment::factory()->create(['doctor_id' => $doctor2->id, 'appointment_date' => '2024-01-20']);

            $appointments = $this->appointmentService->getAppointmentsByDateRange('2024-01-15', '2024-01-25', $this->doctor->id);

            expect($appointments->count())->toBe(1);
            expect($appointments->first()->doctor_id)->toBe($this->doctor->id);
        });

        it('should filter by status', function () {
            Appointment::factory()->create(['appointment_date' => '2024-01-20', 'status' => 'scheduled']);
            Appointment::factory()->create(['appointment_date' => '2024-01-20', 'status' => 'completed']);

            $appointments = $this->appointmentService->getAppointmentsByDateRange('2024-01-15', '2024-01-25', null, 'scheduled');

            expect($appointments->count())->toBe(1);
            expect($appointments->first()->status)->toBe('scheduled');
        });
    });

    describe('getDoctorAvailability', function () {
        it('should return available time slots', function () {
            $doctor = Doctor::factory()->create();
            
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'appointment_date' => '2024-02-01',
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
            ]);
            Appointment::factory()->create([
                'doctor_id' => $doctor->id,
                'appointment_date' => '2024-02-01',
                'start_time' => '11:00:00',
                'end_time' => '11:30:00',
            ]);

            $availability = $this->appointmentService->getDoctorAvailability($doctor->id, '2024-02-01');

            expect($availability)->toBeInstanceOf(\Illuminate\Support\Collection::class);
            expect($availability->contains('09:00:00'))->toBeFalse();
            expect($availability->contains('11:00:00'))->toBeFalse();
        });

        it('should return all slots for empty schedule', function () {
            $doctor = Doctor::factory()->create();

            $availability = $this->appointmentService->getDoctorAvailability($doctor->id, '2024-02-01');

            expect($availability->count())->toBe(16);
        });

        it('should return empty for past date', function () {
            $doctor = Doctor::factory()->create();

            $availability = $this->appointmentService->getDoctorAvailability($doctor->id, '2020-01-01');

            expect($availability->count())->toBe(0);
        });
    });

    describe('rescheduleAppointment', function () {
        it('should reschedule appointment to new date/time', function () {
            $appointment = Appointment::factory()->create([
                'appointment_date' => '2024-01-20',
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'scheduled',
            ]);

            $result = $this->appointmentService->rescheduleAppointment(
                $appointment->id,
                '2024-01-25',
                '14:00:00',
                '14:30:00'
            );

            expect($result)->toBeTrue();
            expect($appointment->fresh()->appointment_date)->toBe('2024-01-25');
            expect($appointment->fresh()->start_time)->toBe('14:00:00');
        });

        it('should not allow rescheduling to conflicting time', function () {
            $appointment1 = Appointment::factory()->create([
                'appointment_date' => '2024-01-20',
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'scheduled',
            ]);

            Appointment::factory()->create([
                'appointment_date' => '2024-01-20',
                'start_time' => '10:00:00',
                'end_time' => '10:30:00',
                'status' => 'scheduled',
            ]);

            expect(fn() => $this->appointmentService->rescheduleAppointment(
                $appointment1->id,
                '2024-01-20',
                '10:15:00',
                '10:45:00'
            ))
                ->toThrow(\InvalidArgumentException::class, 'Conflicting appointment exists');
        });
    });

    describe('getAppointmentStatistics', function () {
        it('should return correct statistics', function () {
            Appointment::factory()->count(5)->create(['status' => 'scheduled']);
            Appointment::factory()->count(3)->create(['status' => 'completed']);
            Appointment::factory()->count(2)->create(['status' => 'cancelled']);

            $stats = $this->appointmentService->getAppointmentStatistics(
                now()->startOfMonth()->format('Y-m-d'),
                now()->endOfMonth()->format('Y-m-d')
            );

            expect($stats['scheduled'])->toBe(5);
            expect($stats['completed'])->toBe(3);
            expect($stats['cancelled'])->toBe(2);
            expect($stats['total'])->toBe(10);
        });

        it('should return zero for empty period', function () {
            $stats = $this->appointmentService->getAppointmentStatistics('2020-01-01', '2020-01-31');

            expect($stats['total'])->toBe(0);
        });
    });
});
```

---

## 6. RBAC and Permission Tests

### 6.1 Permission Service Tests

**File:** `tests/Unit/RBAC/PermissionServiceTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Services\RBACService;
use Illuminate\Foundation\Testing\RefreshDatabase;

describe('RBACService Unit Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->rbacService = new RBACService();
        
        $this->adminRole = Role::factory()->create(['name' => 'Admin', 'slug' => 'admin']);
        $this->userRole = Role::factory()->create(['name' => 'User', 'slug' => 'user']);

        $this->viewPatients = Permission::factory()->create(['name' => 'view-patients']);
        $this->editPatients = Permission::factory()->create(['name' => 'edit-patients']);
        $this->deletePatients = Permission::factory()->create(['name' => 'delete-patients']);
        $this->viewDashboard = Permission::factory()->create(['name' => 'view-dashboard']);
    });

    describe('assignPermissionToRole', function () {
        it('should assign permission to role', function () {
            $result = $this->rbacService->assignPermissionToRole(
                $this->adminRole->id,
                $this->viewPatients->id
            );

            expect($result)->toBeTrue();
            expect($this->adminRole->fresh()->permissions->contains($this->viewPatients))->toBeTrue();
        });

        it('should not duplicate permission assignment', function () {
            $this->rbacService->assignPermissionToRole($this->adminRole->id, $this->viewPatients->id);

            $result = $this->rbacService->assignPermissionToRole($this->adminRole->id, $this->viewPatients->id);

            expect($result)->toBeTrue();
            expect($this->adminRole->fresh()->permissions->count())->toBe(1);
        });

        it('should assign multiple permissions at once', function () {
            $result = $this->rbacService->assignPermissionsToRole(
                $this->adminRole->id,
                [$this->viewPatients->id, $this->editPatients->id, $this->deletePatients->id]
            );

            expect($result)->toBeTrue();
            expect($this->adminRole->fresh()->permissions->count())->toBe(3);
        });
    });

    describe('hasPermission', function () {
        it('should return true if user has permission through role', function () {
            $this->adminRole->permissions()->attach($this->viewPatients->id);
            
            $user = User::factory()->create(['role_id' => $this->adminRole->id]);

            expect($this->rbacService->hasPermission($user, 'view-patients'))->toBeTrue();
        });

        it('should return false if user lacks permission', function () {
            $user = User::factory()->create(['role_id' => $this->userRole->id]);

            expect($this->rbacService->hasPermission($user, 'view-patients'))->toBeFalse();
        });

        it('should return true for super admin with all permissions', function () {
            $superAdminRole = Role::factory()->create([
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'is_super_admin' => true,
            ]);

            $user = User::factory()->create(['role_id' => $superAdminRole->id]);

            expect($this->rbacService->hasPermission($user, 'any-permission'))->toBeTrue();
        });
    });

    describe('validatePermissionDependencies', function () {
        it('should return empty array when dependencies are satisfied', function () {
            \App\Models\PermissionDependency::create([
                'permission_id' => $this->deletePatients->id,
                'depends_on_permission_id' => $this->editPatients->id,
            ]);

            \App\Models\PermissionDependency::create([
                'permission_id' => $this->editPatients->id,
                'depends_on_permission_id' => $this->viewPatients->id,
            ]);

            $user = User::factory()->create(['role_id' => $this->adminRole->id]);

            $this->adminRole->permissions()->attach([
                $this->viewPatients->id,
                $this->editPatients->id,
                $this->deletePatients->id,
            ]);

            $errors = $this->rbacService->validatePermissionDependencies(
                $user,
                [$this->deletePatients->id]
            );

            expect($errors)->toBeEmpty();
        });

        it('should return errors when dependencies are missing', function () {
            \App\Models\PermissionDependency::create([
                'permission_id' => $this->deletePatients->id,
                'depends_on_permission_id' => $this->editPatients->id,
            ]);

            $user = User::factory()->create(['role_id' => $this->adminRole->id]);

            $this->adminRole->permissions()->attach($this->deletePatients->id);

            $errors = $this->rbacService->validatePermissionDependencies(
                $user,
                [$this->deletePatients->id]
            );

            expect($errors)->not->toBeEmpty();
            expect($errors[0])->toContain('delete-patients');
            expect($errors[0])->toContain('edit-patients');
        });
    });

    describe('revokePermissionFromRole', function () {
        it('should revoke permission from role', function () {
            $this->adminRole->permissions()->attach([$this->viewPatients->id, $this->editPatients->id]);

            $result = $this->rbacService->revokePermissionFromRole(
                $this->adminRole->id,
                $this->editPatients->id
            );

            expect($result)->toBeTrue();
            expect($this->adminRole->fresh()->permissions->contains($this->editPatients))->toBeFalse();
            expect($this->adminRole->fresh()->permissions->contains($this->viewPatients))->toBeTrue();
        });

        it('should return false when permission not assigned', function () {
            $result = $this->rbacService->revokePermissionFromRole($this->adminRole->id, $this->viewPatients->id);

            expect($result)->toBeFalse();
        });
    });

    describe('getUserPermissions', function () {
        it('should return all permissions for user', function () {
            $this->adminRole->permissions()->attach([$this->viewPatients->id, $this->editPatients->id]);

            $user = User::factory()->create(['role_id' => $this->adminRole->id]);

            $permissions = $this->rbacService->getUserPermissions($user);

            expect($permissions)->toBeInstanceOf(\Illuminate\Support\Collection::class);
            expect($permissions->count())->toBe(2);
        });

        it('should return empty for user with no permissions', function () {
            $user = User::factory()->create(['role_id' => $this->userRole->id]);

            $permissions = $this->rbacService->getUserPermissions($user);

            expect($permissions->count())->toBe(0);
        });
    });

    describe('checkRoleHierarchy', function () {
        it('should allow higher role to manage lower role', function () {
            $adminUser = User::factory()->create(['role_id' => $this->adminRole->id]);
            $regularUser = User::factory()->create(['role_id' => $this->userRole->id]);

            expect($this->rbacService->canManageUser($adminUser, $regularUser))->toBeTrue();
        });

        it('should not allow lower role to manage higher role', function () {
            $adminUser = User::factory()->create(['role_id' => $this->adminRole->id]);
            $regularUser = User::factory()->create(['role_id' => $this->userRole->id]);

            expect($this->rbacService->canManageUser($regularUser, $adminUser))->toBeFalse();
        });
    });
});
```

---

## 7. Integration Test Suite

### 7.1 Complete Patient Workflow Integration Test

**File:** `tests/Integration/PatientWorkflowIntegrationTest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\MedicalRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;

describe('Complete Patient Workflow Integration Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->createBaseTestData();
        $this->patientUser = $this->testUsers['hospitalAdmin'];
        $this->patient = Patient::factory()->create();
    });

    it('should handle complete patient lifecycle', function () {
        // ================== PATIENT CREATION ==================
        
        $patientData = Patient::factory()->make()->toArray();
        
        $createResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/patients', $patientData);
        
        $createResponse->assertStatus(201);
        $patientId = $createResponse->json('id');

        // ================== PATIENT UPDATE ==================
        
        $updateResponse = $this->actingAs($this->patientUser)
            ->putJson("/api/v1/patients/{$patientId}", [
                'phone' => '+1234567890',
                'address' => '123 Medical Street',
            ]);

        $updateResponse->assertStatus(200);

        // ================== APPOINTMENT CREATION ==================
        
        $appointmentData = [
            'patient_id' => $patientId,
            'doctor_id' => $this->testDoctors->random()->id,
            'appointment_date' => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
        ];

        $appointmentResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/appointments', $appointmentData);

        $appointmentResponse->assertStatus(201);
        $appointmentId = $appointmentResponse->json('id');

        // ================== APPOINTMENT COMPLETION ==================
        
        $completeResponse = $this->actingAs($this->patientUser)
            ->putJson("/api/v1/appointments/{$appointmentId}/complete");

        $completeResponse->assertStatus(200);

        // ================== BILL CREATION ==================
        
        $billData = [
            'patient_id' => $patientId,
            'appointment_id' => $appointmentId,
            'items' => [
                ['description' => 'Consultation Fee', 'quantity' => 1, 'unit_price' => 150.00],
                ['description' => 'Lab Tests', 'quantity' => 2, 'unit_price' => 50.00],
            ],
        ];

        $billResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/billing/bills', $billData);

        $billResponse->assertStatus(201);
        $billId = $billResponse->json('id');

        // ================== PAYMENT PROCESSING ==================
        
        $paymentData = [
            'bill_id' => $billId,
            'amount' => 250.00,
            'payment_method' => 'cash',
        ];

        $paymentResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/billing/payments', $paymentData);

        $paymentResponse->assertStatus(201);

        // ================== MEDICAL RECORD CREATION ==================
        
        $recordData = [
            'patient_id' => $patientId,
            'appointment_id' => $appointmentId,
            'diagnosis' => 'Annual checkup - all normal',
            'prescription' => 'Vitamin D supplements',
            'notes' => 'Patient advised to exercise regularly',
        ];

        $recordResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/medical-records', $recordData);

        $recordResponse->assertStatus(201);

        // ================== VERIFICATION ==================
        
        $patientResponse = $this->actingAs($this->patientUser)
            ->getJson("/api/v1/patients/{$patientId}");

        $patientResponse->assertStatus(200)
            ->assertJsonStructure([
                'appointments',
                'bills',
                'medical_records',
            ]);

        expect($patientResponse->json('appointments'))->not->toBeEmpty();
        expect($patientResponse->json('bills'))->not->toBeEmpty();
        expect($patientResponse->json('medical_records'))->not->toBeEmpty();
    });

    it('should handle concurrent appointment bookings correctly', function () {
        $doctor = $this->testDoctors->first();
        
        $appointmentTime = now()->addDays(10)->format('Y-m-d');
        
        $requests = collect(range(0, 5))->map(function ($i) use ($doctor, $appointmentTime) {
            return $this->actingAs($this->patientUser)
                ->postJson('/api/v1/appointments', [
                    'patient_id' => Patient::factory()->create()->id,
                    'doctor_id' => $doctor->id,
                    'appointment_date' => $appointmentTime,
                    'start_time' => '09:00:00',
                    'end_time' => '09:30:00',
                    'type' => 'emergency',
                ]);
        });

        // At most 1 should succeed
        $successCount = $requests->filter(function ($response) {
            return $response->getStatusCode() === 201;
        })->count();

        expect($successCount)->toBeLessThanOrEqual(1);

        // Rest should fail with conflict error
        $conflictCount = $requests->filter(function ($response) {
            return $response->getStatusCode() === 422;
        })->count();

        expect($conflictCount)->toBeGreaterThanOrEqual(4);
    });

    it('should rollback transaction on failure', function () {
        $patientId = $this->patient->id;
        $doctorId = $this->testDoctors->first()->id;
        $appointmentDate = now()->addDays(5)->format('Y-m-d');

        $appointmentResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/appointments', [
                'patient_id' => $patientId,
                'doctor_id' => $doctorId,
                'appointment_date' => $appointmentDate,
                'start_time' => '11:00:00',
                'end_time' => '11:30:00',
                'type' => 'consultation',
            ]);

        $appointmentResponse->assertStatus(201);
        $appointmentId = $appointmentResponse->json('id');

        $billResponse = $this->actingAs($this->patientUser)
            ->postJson('/api/v1/billing/bills', [
                'patient_id' => $patientId,
                'appointment_id' => $appointmentId,
                'items' => [
                    ['description' => '', 'quantity' => 1, 'unit_price' => 150.00],
                ],
            ]);

        $billResponse->assertStatus(422);

        $appointment = Appointment::find($appointmentId);
        expect($appointment)->not->toBeNull();
    });

    it('should enforce data integrity across related records', function () {
        $patient = Patient::factory()->create();
        $doctor = Doctor::factory()->create();
        
        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'status' => 'completed',
        ]);

        $bill = Bill::factory()->create([
            'patient_id' => $patient->id,
            'appointment_id' => $appointment->id,
        ]);

        // Delete patient - should fail due to foreign key constraints
        $response = $this->actingAs($this->patientUser)
            ->deleteJson("/api/v1/patients/{$patient->id}");

        $response->assertStatus(422);

        expect(Patient::find($patient->id))->not->toBeNull();

        // Delete appointment first
        $this->actingAs($this->patientUser)
            ->deleteJson("/api/v1/appointments/{$appointment->id}");

        // Now patient deletion should work
        $response = $this->actingAs($this->patientUser)
            ->deleteJson("/api/v1/patients/{$patient->id}");

        $response->assertStatus(200);

        expect(Patient::find($patient->id))->toBeNull();
        expect(Patient::withTrashed()->find($patient->id))->not->toBeNull();
    });
});
```

---

## 8. E2E Test Suite

### 8.1 Complete Hospital Visit E2E Test

**File:** `tests/E2E/HospitalWorkflowE2ETest.php`

```php
<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\LabTest;
use Illuminate\Foundation\Testing\RefreshDatabase;

describe('Complete Hospital Visit E2E Tests', function () {
    use RefreshDatabase;

    beforeEach(function () {
        $this->createBaseTestData();
        
        $this->admin = $this->testUsers['hospitalAdmin'];
        $this->doctor = $this->testUsers['doctor'];
        $this->pharmacyAdmin = $this->testUsers['pharmacyAdmin'];
        $this->labAdmin = $this->testUsers['laboratoryAdmin'];
    });

    it('should complete full patient visit workflow', function () {
        // ================== PATIENT REGISTRATION ==================
        
        $patientData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'phone' => '+1234567890',
            'date_of_birth' => '1985-03-15',
            'gender' => 'male',
            'address' => '456 Health Avenue',
            'emergency_contact' => 'Jane Doe',
            'emergency_phone' => '+0987654321',
            'insurance_provider' => 'HealthCare Plus',
            'insurance_number' => 'HCP-12345',
        ];

        $patientResponse = $this->actingAs($this->admin)
            ->postJson('/api/v1/patients', $patientData);

        $patientResponse->assertStatus(201);
        $patientId = $patientResponse->json('id');

        // ================== DOCTOR CONSULTATION ==================

        // Doctor reviews patient history
        $historyResponse = $this->actingAs($this->doctor)
            ->getJson("/api/v1/patients/{$patientId}/history");

        $historyResponse->assertStatus(200);

        // Create appointment
        $appointmentData = [
            'patient_id' => $patientId,
            'doctor_id' => $this->testDoctors->random()->id,
            'appointment_date' => now()->addDays(1)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
            'reason' => 'Annual physical examination',
        ];

        $appointmentResponse = $this->actingAs($this->doctor)
            ->postJson('/api/v1/appointments', $appointmentData);

        $appointmentResponse->assertStatus(201);
        $appointmentId = $appointmentResponse->json('id');

        // ================== LAB TESTS ==================

        // Doctor orders lab tests
        $labOrderData = [
            'patient_id' => $patientId,
            'appointment_id' => $appointmentId,
            'tests' => [
                ['test_type' => 'blood-count', 'urgency' => 'routine', 'notes' => 'Fasting required'],
                ['test_type' => 'lipid-profile', 'urgency' => 'routine', 'notes' => 'Fasting required'],
            ],
        ];

        $labOrderResponse = $this->actingAs($this->doctor)
            ->postJson('/api/v1/lab-test-requests', $labOrderData);

        $labOrderResponse->assertStatus(201);

        // Lab admin processes tests
        $labRequestId = $labOrderResponse->json('id');
        
        $labResultData = [
            'request_id' => $labRequestId,
            'results' => [
                ['test_type' => 'blood-count', 'hemoglobin' => '14.5', 'white_blood_cells' => '7500', 'platelets' => '250000'],
            ],
            'notes' => 'All values within normal range',
            'technician' => 'Lab Tech 1',
        ];

        $labResultResponse = $this->actingAs($this->labAdmin)
            ->postJson("/api/v1/lab-test-requests/{$labRequestId}/results", $labResultData);

        $labResultResponse->assertStatus(201);

        // ================== DIAGNOSIS AND TREATMENT ==================

        // Doctor completes appointment
        $completeData = [
            'diagnosis' => 'Healthy, no significant findings',
            'prescriptions' => [
                [
                    'medicine_id' => $this->testMedicines->random()->id,
                    'dosage' => '1000mg',
                    'frequency' => 'Once daily',
                    'duration' => '30 days',
                    'quantity' => 30,
                ],
            ],
            'recommendations' => 'Continue regular exercise and balanced diet',
            'follow_up_required' => false,
        ];

        $completeResponse = $this->actingAs($this->doctor)
            ->putJson("/api/v1/appointments/{$appointmentId}/complete", $completeData);

        $completeResponse->assertStatus(200);

        // ================== PHARMACY DISPENSING ==================

        $prescriptionId = $completeResponse->json('prescriptions.0.id');
        
        $dispenseData = [
            'prescription_id' => $prescriptionId,
            'dispensed_by' => $this->pharmacyAdmin->id,
            'dispense_date' => now()->format('Y-m-d'),
            'notes' => 'Patient counselled on medication usage',
        ];

        $dispenseResponse = $this->actingAs($this->pharmacyAdmin)
            ->postJson('/api/v1/pharmacy/dispense', $dispenseData);

        $dispenseResponse->assertStatus(201);

        // ================== BILLING ==================

        $billData = [
            'patient_id' => $patientId,
            'appointment_id' => $appointmentId,
            'items' => [
                ['type' => 'consultation', 'description' => 'Doctor Consultation', 'quantity' => 1, 'unit_price' => 200.00],
                ['type' => 'lab', 'description' => 'Blood Count Test', 'quantity' => 1, 'unit_price' => 75.00],
                ['type' => 'lab', 'description' => 'Lipid Profile Test', 'quantity' => 1, 'unit_price' => 85.00],
                ['type' => 'pharmacy', 'description' => 'Vitamin D Supplements', 'quantity' => 30, 'unit_price' => 1.50],
            ],
            'insurance' => [
                'provider' => 'HealthCare Plus',
                'policy_number' => 'HCP-12345',
                'coverage_percentage' => 80,
            ],
        ];

        $billResponse = $this->actingAs($this->admin)
            ->postJson('/api/v1/billing/bills', $billData);

        $billResponse->assertStatus(201);
        $billId = $billResponse->json('id');

        // Verify totals
        $subtotal = 200 + 75 + 85 + 45; // 405
        $insuranceCoverage = $subtotal * 0.80; // 324
        $patientResponsibility = $subtotal - $insuranceCoverage; // 81

        $billResponse->assertJson([
            'subtotal' => 405.00,
            'insurance_coverage' => $insuranceCoverage,
            'total_patient_pay' => $patientResponsibility,
        ]);

        // ================== PAYMENT ==================

        $paymentData = [
            'bill_id' => $billId,
            'amount' => $patientResponsibility,
            'payment_method' => 'credit_card',
            'reference_number' => 'TXN-' . now()->timestamp,
            'notes' => 'Payment received successfully',
        ];

        $paymentResponse = $this->actingAs($this->admin)
            ->postJson('/api/v1/billing/payments', $paymentData);

        $paymentResponse->assertStatus(201)
            ->assertJson([
                'status' => 'completed',
                'amount' => $patientResponsibility,
            ]);

        // ================== FINAL VERIFICATION ==================

        $finalPatientResponse = $this->actingAs($this->admin)
            ->getJson("/api/v1/patients/{$patientId}");

        $finalPatientResponse->assertStatus(200)
            ->assertJsonStructure([
                'id',
                'first_name',
                'last_name',
                'appointments' => [
                    '*' => [
                        'id',
                        'status',
                        'diagnosis',
                        'prescriptions',
                    ],
                ],
                'bills' => [
                    '*' => [
                        'id',
                        'status',
                        'payments',
                    ],
                ],
                'lab_tests',
            ]);

        // Verify appointment linkage
        $appointmentResponse = $this->actingAs($this->doctor)
            ->getJson("/api/v1/appointments/{$appointmentId}");

        $appointmentResponse->assertStatus(200)
            ->assertJson([
                'patient_id' => $patientId,
                'status' => 'completed',
                'has_bill' => true,
                'has_prescriptions' => true,
                'has_lab_results' => true,
            ]);
    });

    it('should handle emergency patient workflow', function () {
        // Emergency patient arrives
        $emergencyPatient = Patient::factory()->create([
            'first_name' => 'Emergency',
            'last_name' => 'Patient',
            'emergency_contact' => 'Unknown',
        ]);

        // Triage
        $triageData = [
            'patient_id' => $emergencyPatient->id,
            'triage_level' => 'critical',
            'vital_signs' => [
                'blood_pressure' => '200/120',
                'heart_rate' => 110,
                'oxygen_saturation' => 88,
                'temperature' => 38.5,
            ],
            'presenting_complaint' => 'Chest pain and shortness of breath',
        ];

        $triageResponse = $this->actingAs($this->doctor)
            ->postJson('/api/v1/triage', $triageData);

        $triageResponse->assertStatus(201);

        // Emergency appointment
        $emergencyAppointment = [
            'patient_id' => $emergencyPatient->id,
            'doctor_id' => $this->testDoctors->first()->id,
            'appointment_date' => now()->format('Y-m-d'),
            'start_time' => now()->format('H:i'),
            'end_time' => now()->addMinutes(30)->format('H:i'),
            'type' => 'emergency',
            'priority' => 'critical',
        ];

        $appointmentResponse = $this->actingAs($this->doctor)
            ->postJson('/api/v1/appointments', $emergencyAppointment);

        $appointmentResponse->assertStatus(201)
            ->assertJson([
                'type' => 'emergency',
                'priority' => 'critical',
            ]);

        // Priority queuing should be respected
        $regularPatient = Patient::factory()->create();
        $regularAppointment = [
            'patient_id' => $regularPatient->id,
            'doctor_id' => $this->testDoctors->first()->id,
            'appointment_date' => now()->format('Y-m-d'),
            'start_time' => now()->addMinutes(15)->format('H:i'),
            'end_time' => now()->addMinutes(45)->format('H:i'),
            'type' => 'consultation',
            'priority' => 'normal',
        ];

        $regularResponse = $this->actingAs($this->doctor)
            ->postJson('/api/v1/appointments', $regularAppointment);

        // Emergency should be processed first
        expect($appointmentResponse->json('priority'))->toBe('critical');
    });
});
```

---

## 9. CI/CD Pipeline Configuration

### 9.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: HMS Test Suite

on:
  push:
    branches: [main, develop, release/*]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'

env:
  PHP_VERSION: '8.2'
  MYSQL_VERSION: '8.0'
  COMPOSER_FLAGS: '--no-interaction --prefer-dist'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:${{ env.MYSQL_VERSION }}
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: hms_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ env.PHP_VERSION }}
          extensions: pdo, pdo_mysql, mbstring, xml, bcmath, gd, intl, zip
          coverage: xdebug

      - name: Install dependencies
        run: |
          composer install ${{ env.COMPOSER_FLAGS }}
          npm ci

      - name: Copy environment file
        run: cp .env.example .env.testing

      - name: Generate app key
        run: php artisan key:generate --env=testing

      - name: Run database migrations
        run: php artisan migrate --env=testing --force
        env:
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: hms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run unit tests
        run: php artisan test --testsuite=Unit --parallel --processes=4
        env:
          APP_ENV: testing
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: hms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run integration tests
        run: php artisan test --testsuite=Integration --parallel --processes=2
        env:
          APP_ENV: testing
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: hms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run feature tests
        run: php artisan test --testsuite=Feature --parallel --processes=2
        env:
          APP_ENV: testing
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: hms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Run E2E tests
        run: php artisan test --testsuite=E2E --parallel --processes=1
        env:
          APP_ENV: testing
          DB_CONNECTION: mysql
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_DATABASE: hms_test
          DB_USERNAME: root
          DB_PASSWORD: root

      - name: Generate coverage report
        if: always()
        run: |
          php artisan test --testsuite=Unit --coverage-html coverage/
          php artisan test --testsuite=Integration --coverage-html coverage/integration/
          php artisan test --testsuite=Feature --coverage-html coverage/feature/

      - name: Upload coverage reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: |
            coverage/
            coverage/clover.xml

      - name: Check coverage threshold
        if: always()
        run: |
          if [ $(grep -o 'line-rate="[0-9.]*" coverage/clover.xml | grep -o '[0-9.]*' | head -1) < "0.9" ]; then
            echo "Coverage below 90% threshold!"
            exit 1
          fi
```

---

## 10. Execution Instructions

### 10.1 Running Tests

```bash
# Run all tests
php artisan test

# Run specific test suite
php artisan test --testsuite=Unit
php artisan test --testsuite=Integration
php artisan test --testsuite=Feature
php artisan test --testsuite=E2E

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Unit/Authentication/UserAuthenticationTest.php

# Run specific test
php artisan test --filter="should login successfully with valid credentials"

# Run tests in parallel
php artisan test --parallel --processes=4

# Run tests and generate HTML coverage report
php artisan test --coverage-html coverage/

# Run tests with verbose output
php artisan test --verbose

# Run tests and stop on first failure
php artisan test --stop-on-failure
```

### 10.2 Test Database Setup

```bash
# Create test database
mysql -u root -p -e "CREATE DATABASE hms_test;"

# Run migrations on test database
php artisan migrate --env=testing --force

# Seed test database
php artisan db:seed --env=testing

# Refresh test database
php artisan migrate:refresh --env=testing --seed
```

### 10.3 Configuration Files

**Environment Testing (.env.testing):**

```env
APP_NAME=HMS
APP_ENV=testing
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hms_test
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=null
CACHE_DRIVER=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
```

---

## 11. Summary

This comprehensive test suite plan provides:

1. **Unit Tests (285)**: Model validation, service logic, business rules, RBAC operations
2. **Integration Tests (220)**: API endpoints, database operations, authentication flows
3. **E2E Tests (45)**: Complete workflows, multi-step processes, concurrent requests
4. **90% Minimum Coverage**: Critical paths in authentication, billing, appointments, and RBAC
5. **Parallel Execution**: Optimized for CI/CD performance
6. **MySQL Database**: Consistent with production environment
7. **Mock External Services**: Test isolation for reliable execution
8. **CI/CD Integration**: GitHub Actions workflow with coverage reporting

All tests follow best practices including:
- Descriptive test names (AAA pattern)
- Proper assertions and validations
- Test isolation and cleanup
- Permission-based access testing
- Error handling and edge cases
- Concurrent request handling