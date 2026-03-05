<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\LabTestRequest;
use App\Models\LabTestResult;
use App\Models\Patient;
use App\Models\LabTest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Lab Admin Permissions Test
 * 
 * This test validates the permission logic for Lab Admin role.
 * 
 * Expected Lab Admin Permissions:
 * - ALLOW: create lab results, view all lab requests
 * - DENY: create lab requests
 * 
 * ISSUES FOUND (see findings below):
 * 1. Permission name mismatch between PermissionSeeder and Controllers/Routes
 * 2. Missing permissions for Lab Admin in RolePermissionMappingSeeder
 * 3. Inconsistent permission checks within LabTestRequestController
 */
class LabAdminPermissionsTest extends TestCase
{
    use RefreshDatabase;

    protected User $labAdmin;
    protected Role $labAdminRole;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Seed the database
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionMappingSeeder::class);
        
        // Get or create Laboratory Admin role
        $this->labAdminRole = Role::firstOrCreate(
            ['slug' => 'laboratory-admin'],
            [
                'name' => 'Laboratory Admin',
                'description' => 'Specialized administrator for laboratory operations'
            ]
        );
        
        // Create Lab Admin user
        $this->labAdmin = User::factory()->create([
            'name' => 'Test Lab Admin',
            'email' => 'labadmin@test.com',
            'role_id' => $this->labAdminRole->id,
        ]);
    }

    /**
     * =======================================================================
     * FINDING #1: Permission Name Mismatch
     * =======================================================================
     * 
     * PermissionSeeder.php defines these lab permissions:
     * - view-lab-requests (line 572)
     * - create-lab-requests (line 581)
     * - process-lab-requests (line 590)
     * - cancel-lab-requests (line 599)
     * - view-lab-results (line 608)
     * - enter-lab-results (line 617)
     * 
     * BUT Controllers and Routes expect DIFFERENT names:
     * - view-lab-test-requests (LabTestRequestController line 36, routes/hospital.php line 204)
     * - create-lab-test-requests (LabTestRequestController lines 158, 182)
     * - edit-lab-test-requests (LabTestRequestController line 256, routes line 212)
     * - delete-lab-test-requests (routes line 218)
     * - create-lab-test-results (LabTestResultController lines 162, 252)
     * 
     * This causes permission checks to ALWAYS FAIL because the checked 
     * permissions don't exist in the database!
     */
    public function test_permission_name_mismatch(): void
    {
        // These permissions exist in PermissionSeeder (lines 572-624)
        $existingPermissions = [
            'view-lab-requests',
            'create-lab-requests', 
            'process-lab-requests',
            'cancel-lab-requests',
            'view-lab-results',
            'enter-lab-results',
            'validate-lab-results',
        ];
        
        foreach ($existingPermissions as $permName) {
            $this->assertDatabaseHas('permissions', ['name' => $permName],
                "Permission '$permName' should exist in database"
            );
        }
        
        // These permissions are CHECKED in controllers but DON'T EXIST in PermissionSeeder
        $nonExistentPermissions = [
            'view-lab-test-requests',
            'create-lab-test-requests',
            'edit-lab-test-requests',
            'delete-lab-test-requests',
            'create-lab-test-results',
        ];
        
        foreach ($nonExistentPermissions as $permName) {
            $this->assertDatabaseMissing('permissions', ['name' => $permName],
                "Permission '$permName' should NOT exist in database - THIS IS THE BUG!"
            );
        }
    }

    /**
     * =======================================================================
     * FINDING #2: Lab Admin Role Missing Critical Permissions
     * =======================================================================
     * 
     * RolePermissionMappingSeeder.php (lines 62-67) assigns these to lab-admin:
     * - view-dashboard
     * - view-patients
     * - view-laboratory, create-lab-tests, edit-lab-tests, delete-lab-tests
     * - view-reports
     * 
     * MISSING permissions that Lab Admin SHOULD have:
     * - view-lab-requests (to view lab requests)
     * - enter-lab-results (to create lab results)
     * - process-lab-requests (to process requests)
     */
    public function test_lab_admin_missing_required_permissions(): void
    {
        $requiredPermissions = [
            'view-lab-requests',      // Should ALLOW: view all lab requests
            'enter-lab-results',      // Should ALLOW: create lab results
            'process-lab-requests',   // Should ALLOW: process lab requests
        ];
        
        $this->labAdmin->refresh();
        $effectivePermissions = $this->labAdmin->getEffectivePermissions();
        
        foreach ($requiredPermissions as $permName) {
            $this->assertContains(
                $permName,
                $effectivePermissions,
                "Lab Admin SHOULD have permission: $permName"
            );
        }
    }

    /**
     * =======================================================================
     * FINDING #3: Inconsistent Permission Check in LabTestRequestController
     * =======================================================================
     * 
     * LabTestRequestController.php has INCONSISTENT permission names:
     * - Line 256: checks 'edit-lab-test-requests'
     * - Line 291: checks 'edit-lab-requests' (DIFFERENT!)
     * 
     * This inconsistency can lead to unexpected access control behavior.
     */
    public function test_inconsistent_permission_check_in_controller(): void
    {
        // Read the controller file to verify the inconsistency
        $controllerContent = file_get_contents(
            app_path('Http/Controllers/Laboratory/LabTestRequestController.php')
        );
        
        // Line 256 checks: 'edit-lab-test-requests'
        $this->assertStringContainsString(
            "hasPermission('edit-lab-test-requests')",
            $controllerContent,
            "Line 256 should check 'edit-lab-test-requests'"
        );
        
        // Line 291 checks: 'edit-lab-requests' (WRONG - should be consistent)
        $this->assertStringContainsString(
            "hasPermission('edit-lab-requests')",
            $controllerContent,
            "Line 291 checks 'edit-lab-requests' - THIS IS INCONSISTENT with line 256!"
        );
    }

    /**
     * =======================================================================
     * FINDING #4: RBACSeeder Uses Non-Existent Permissions
     * =======================================================================
     * 
     * RBACSeeder.php (lines 347-355) assigns permissions to lab-admin that 
     * don't exist in PermissionSeeder:
     * - process-test-results
     * - create-lab-results
     * - edit-lab-results
     * - manage-lab-materials
     * 
     * These permissions won't be assigned because they don't exist!
     */
    public function test_rbacseeder_uses_nonexistent_permissions(): void
    {
        $rbacPermissions = [
            'process-test-results',
            'create-lab-results',
            'edit-lab-results',
            'manage-lab-materials',
        ];
        
        foreach ($rbacPermissions as $permName) {
            $this->assertDatabaseMissing('permissions', ['name' => $permName],
                "RBACSeeder assigns '$permName' but it doesn't exist in PermissionSeeder!"
            );
        }
    }

    /**
     * =======================================================================
     * FINDING #5: Default Laboratory Admin Permissions in PermissionsController
     * =======================================================================
     * 
     * PermissionsController.php (line 241) defines default permissions:
     * 'Laboratory Admin' => [
     *     'view-laboratory', 
     *     'view-lab-test-requests',  <-- DOESN'T EXIST (should be 'view-lab-requests')
     *     'process-lab-test-requests', <-- DOESN'T EXIST (should be 'process-lab-requests')
     *     'view-lab-tests'
     * ]
     */
    public function test_permissionscontroller_default_uses_wrong_names(): void
    {
        $controllerContent = file_get_contents(
            app_path('Http/Controllers/Admin/PermissionsController.php')
        );
        
        // These are the WRONG permission names used in the controller
        $wrongNames = [
            'view-lab-test-requests',
            'process-lab-test-requests',
        ];
        
        foreach ($wrongNames as $permName) {
            $this->assertStringContainsString(
                $permName,
                $controllerContent,
                "PermissionsController uses '$permName' which doesn't exist in PermissionSeeder"
            );
        }
    }

    /**
     * =======================================================================
     * INTEGRATION TEST: Lab Admin Cannot Access Lab Test Requests
     * =======================================================================
     * 
     * This test demonstrates the actual failure scenario from laravel.log:
     * - User 'lab_admin' (role_id: 6) tries to access /laboratory/lab-test-requests
     * - Permission denied because 'view-lab-test-requests' doesn't exist
     */
    public function test_lab_admin_cannot_access_lab_test_requests_due_to_missing_permission(): void
    {
        $this->actingAs($this->labAdmin);
        
        // The route checks for 'view-lab-test-requests' (routes/hospital.php line 204)
        // But this permission doesn't exist in the database
        $response = $this->get('/laboratory/lab-test-requests');
        
        // Should fail with 403 because user doesn't have 'view-lab-test-requests'
        // (which doesn't exist anyway)
        $response->assertStatus(403);
    }

    /**
     * =======================================================================
     * INTEGRATION TEST: Lab Admin Cannot Create Lab Results
     * =======================================================================
     * 
     * LabTestResultController checks for 'create-lab-test-results' (lines 162, 252)
     * but this permission doesn't exist in PermissionSeeder.
     * The closest match is 'enter-lab-results' (line 617).
     */
    public function test_lab_admin_cannot_create_lab_results_due_to_permission_mismatch(): void
    {
        $this->actingAs($this->labAdmin);
        
        // First verify the user has 'enter-lab-results' (from PermissionSeeder)
        $this->assertTrue(
            Permission::where('name', 'enter-lab-results')->exists(),
            "Permission 'enter-lab-results' should exist"
        );
        
        // But the controller checks for 'create-lab-test-results' which doesn't exist
        $this->assertFalse(
            Permission::where('name', 'create-lab-test-results')->exists(),
            "Permission 'create-lab-test-results' should NOT exist (THIS IS THE BUG)"
        );
        
        $response = $this->get('/laboratory/lab-test-results/create');
        
        // Should fail because 'create-lab-test-results' doesn't exist
        // and user doesn't have it
        $response->assertStatus(403);
    }

    /**
     * =======================================================================
     * RECOMMENDED FIXES
     * =======================================================================
     * 
     * 1. STANDARDIZE permission names across all files:
     *    - Option A: Update PermissionSeeder to use 'view-lab-test-requests' format
     *    - Option B: Update Controllers/Routes to use 'view-lab-requests' format
     * 
     * 2. FIX LabTestRequestController line 291:
     *    - Change 'edit-lab-requests' to 'edit-lab-test-requests' for consistency
     * 
     * 3. UPDATE RolePermissionMappingSeeder (lines 62-67):
     *    - Add 'view-lab-requests' for viewing lab requests
     *    - Add 'enter-lab-results' for creating lab results
     *    - Add 'process-lab-requests' for processing requests
     * 
     * 4. UPDATE RBACSeeder (lines 347-355):
     *    - Replace non-existent permissions with correct ones from PermissionSeeder
     * 
     * 5. UPDATE PermissionsController (line 241):
     *    - Fix default Laboratory Admin permissions to use correct names
     */
    public function test_recommended_permission_mapping_for_lab_admin(): void
    {
        // These are the permissions Lab Admin SHOULD have based on requirements:
        // - ALLOW: create lab results, view all lab requests
        // - DENY: create lab requests
        
        $shouldHave = [
            'view-laboratory',        // Basic lab access
            'view-lab-requests',      // View all lab requests (ALLOWED)
            'process-lab-requests',   // Process lab requests (ALLOWED)
            'enter-lab-results',      // Create lab results (ALLOWED)
            'view-lab-results',       // View lab results (ALLOWED)
        ];
        
        $shouldNotHave = [
            'create-lab-requests',    // Create lab requests (DENIED - doctors only)
        ];
        
        // Verify these permissions exist in the database
        foreach ($shouldHave as $permName) {
            $this->assertDatabaseHas('permissions', ['name' => $permName],
                "Permission '$permName' should exist for Lab Admin assignment"
            );
        }
        
        // Verify denied permission exists
        $this->assertDatabaseHas('permissions', ['name' => 'create-lab-requests'],
            "Permission 'create-lab-requests' should exist but NOT be assigned to Lab Admin"
        );
    }
}