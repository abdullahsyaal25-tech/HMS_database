<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PharmacyPermissionsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $pharmacyUser;
    private Role $pharmacyRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        $permissions = [
            ['name' => 'view-pharmacy', 'description' => 'View pharmacy'],
            ['name' => 'create-medicines', 'description' => 'Create medicines'],
            ['name' => 'edit-medicines', 'description' => 'Edit medicines'],
            ['name' => 'view-medicines', 'description' => 'View medicines'],
            ['name' => 'create-sales', 'description' => 'Create sales'],
            ['name' => 'view-sales', 'description' => 'View sales'],
            ['name' => 'manage-permissions', 'description' => 'Manage permissions'],
            ['name' => 'view-users', 'description' => 'View users'],
        ];

        foreach ($permissions as $perm) {
            Permission::create($perm);
        }

        // Create pharmacy role with unique name to avoid conflicts
        $this->pharmacyRole = Role::firstOrCreate(
            ['name' => 'Test Pharmacy Admin'],
            ['description' => 'Pharmacy Administrator for Testing']
        );

        // Assign pharmacy permissions to role
        $pharmacyPermissions = Permission::whereIn('name', [
            'view-pharmacy',
            'create-medicines',
            'edit-medicines',
            'view-medicines',
            'create-sales',
            'view-sales'
        ])->pluck('id')->toArray();

        $this->pharmacyRole->permissions()->sync($pharmacyPermissions);

        // Create admin user (super admin)
        $this->admin = User::factory()->create([
            'role' => 'super-admin',
            'name' => 'Super Admin',
        ]);

        // Create pharmacy user
        $this->pharmacyUser = User::factory()->create([
            'role' => 'user',
            'role_id' => $this->pharmacyRole->id,
            'name' => 'Pharmacy Admin User',
        ]);
    }

    /**
     * Test that pharmacy user has correct permissions loaded.
     */
    public function test_pharmacy_user_has_correct_role(): void
    {
        $this->assertEquals($this->pharmacyRole->id, $this->pharmacyUser->role_id);
        $this->assertEquals('Test Pharmacy Admin', $this->pharmacyUser->role->name);
    }

    /**
     * Test that pharmacy role has the expected permissions.
     */
    public function test_pharmacy_role_has_expected_permissions(): void
    {
        $permissions = $this->pharmacyRole->permissions->pluck('name')->toArray();

        $this->assertContains('view-pharmacy', $permissions);
        $this->assertContains('create-medicines', $permissions);
        $this->assertContains('edit-medicines', $permissions);
        $this->assertContains('view-medicines', $permissions);
        $this->assertContains('create-sales', $permissions);
        $this->assertContains('view-sales', $permissions);
    }

    /**
     * Test that super admin can access permissions management page.
     */
    public function test_super_admin_can_access_permissions_page(): void
    {
        $response = $this->actingAs($this->admin)
            ->get('/admin/permissions');

        $response->assertStatus(200);
    }

    /**
     * Test updating role permissions via PUT request (the original failing scenario).
     */
    public function test_super_admin_can_update_role_permissions(): void
    {
        $newPermissions = Permission::whereIn('name', [
            'view-pharmacy',
            'view-medicines',
            'view-sales'
        ])->pluck('id')->toArray();

        $response = $this->actingAs($this->admin)
            ->put("/admin/permissions/roles/{$this->pharmacyRole->id}", [
                'permissions' => $newPermissions
            ]);

        $response->assertStatus(302); // Redirect after successful update

        // Verify permissions were updated
        $this->pharmacyRole->refresh();
        $updatedPermissions = $this->pharmacyRole->permissions->pluck('id')->toArray();

        $this->assertEquals($newPermissions, $updatedPermissions);
    }

    /**
     * Test that the RBACService validatePermissionDependencies method exists and works.
     */
    public function test_rbac_service_validate_permission_dependencies_method_exists(): void
    {
        $rbacService = app(\App\Services\RBACService::class);

        $this->assertTrue(method_exists($rbacService, 'validatePermissionDependencies'));

        // Test that it returns empty array (no validation errors)
        $result = $rbacService->validatePermissionDependencies([1, 2, 3]);
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    /**
     * Test that pharmacy user can access pharmacy routes.
     */
    public function test_pharmacy_user_can_access_pharmacy_routes(): void
    {
        // Note: This would require the CheckPermission middleware to work correctly
        // The middleware should allow pharmacy users to access pharmacy routes
        $response = $this->actingAs($this->pharmacyUser)
            ->get('/pharmacy/sales');

        // Should not get 403 forbidden
        $this->assertNotEquals(403, $response->getStatusCode());
    }

    /**
     * Test permission dependency validation with empty permissions array.
     */
    public function test_permission_save_with_empty_permissions(): void
    {
        $response = $this->actingAs($this->admin)
            ->put("/admin/permissions/roles/{$this->pharmacyRole->id}", [
                'permissions' => []
            ]);

        $response->assertStatus(302);

        $this->pharmacyRole->refresh();
        $this->assertCount(0, $this->pharmacyRole->permissions);
    }

    /**
     * Test that the request expects JSON response when Accept header is set.
     */
    public function test_permissions_update_returns_json_when_requested(): void
    {
        $newPermissions = Permission::pluck('id')->toArray();

        $response = $this->actingAs($this->admin)
            ->withHeaders([
                'Accept' => 'application/json',
                'X-Requested-With' => 'XMLHttpRequest'
            ])
            ->put("/admin/permissions/roles/{$this->pharmacyRole->id}", [
                'permissions' => $newPermissions
            ]);

        // With proper headers, should return JSON
        $response->assertHeader('Content-Type', 'application/json');
    }
}
