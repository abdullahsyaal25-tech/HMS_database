<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Services\RBACService;
use App\Services\MfaEnforcementService;
use App\Services\SessionTimeoutService;
use App\Services\PrivilegeEscalationDetector;
use App\Services\PermissionEscalationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Comprehensive RBAC Test Suite
 * 
 * Tests validate:
 * - Role hierarchy and permissions
 * - MFA enforcement
 * - Session timeout policies
 * - Privilege escalation prevention
 * - Audit logging
 */
class RBACTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Run seeders
        $this->seed(\Database\Seeders\AdminRoleSeeder::class);
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    /**
     * Test that Super Admin role has all permissions.
     */
    public function test_super_admin_has_all_permissions(): void
    {
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $this->assertNotNull($superAdminRole, 'Super Admin role should exist');
        
        $allPermissions = Permission::count();
        $superAdminPermissions = $superAdminRole->permissions()->count();
        
        $this->assertEquals($allPermissions, $superAdminPermissions, 
            'Super Admin should have all permissions');
        
        $this->assertTrue($superAdminRole->is_super_admin, 
            'Super Admin should have is_super_admin flag');
        
        $this->assertEquals(100, $superAdminRole->priority, 
            'Super Admin should have priority 100');
    }

    /**
     * Test that module admins have restricted permissions.
     */
    public function test_module_admin_restrictions(): void
    {
        $pharmacyAdminRole = Role::where('slug', 'pharmacy-admin')->first();
        $billingAdminRole = Role::where('slug', 'billing-admin')->first();
        
        $this->assertNotNull($pharmacyAdminRole, 'Pharmacy Admin role should exist');
        $this->assertNotNull($billingAdminRole, 'Billing Admin role should exist');
        
        $pharmacyPermissions = $pharmacyAdminRole->permissions()->pluck('name')->toArray();
        $billingPermissions = $billingAdminRole->permissions()->pluck('name')->toArray();
        
        // Pharmacy admin should NOT have billing permissions
        $billingPerms = array_filter($billingPermissions, fn($p) => str_starts_with($p, 'billing.'));
        $this->assertEmpty($billingPerms, 'Pharmacy Admin should not have billing permissions');
        
        // Billing admin should NOT have pharmacy permissions
        $pharmacyPerms = array_filter($pharmacyPermissions, fn($p) => str_starts_with($p, 'pharmacy.'));
        $this->assertEmpty($pharmacyPerms, 'Billing Admin should not have pharmacy permissions');
    }

    /**
     * Test permission check denies unauthorized access.
     */
    public function test_permission_check_denies_unauthorized(): void
    {
        $receptionRole = Role::where('slug', 'reception-admin')->first();
        $this->assertNotNull($receptionRole);
        
        $receptionPermissions = $receptionRole->permissions()->pluck('name')->toArray();
        
        // Should not have system-level permissions
        $systemPerms = ['system.configure', 'security.audit_log', 'users.manage_roles'];
        foreach ($systemPerms as $perm) {
            $this->assertNotContains($perm, $receptionPermissions, 
                "Reception Admin should not have {$perm}");
        }
    }

    /**
     * Test role hierarchy inheritance.
     */
    public function test_role_hierarchy_inheritance(): void
    {
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $subSuperAdminRole = Role::where('slug', 'sub-super-admin')->first();
        
        $this->assertNotNull($subSuperAdminRole);
        $this->assertEquals($superAdminRole->id, $subSuperAdminRole->parent_role_id,
            'Sub Super Admin should have Super Admin as parent');
        
        // Super Admin should have more permissions
        $superAdminPerms = $superAdminRole->permissions()->count();
        $subSuperAdminPerms = $subSuperAdminRole->permissions()->count();
        
        $this->assertGreaterThan($subSuperAdminPerms, $superAdminPerms,
            'Super Admin should have more permissions than Sub Super Admin');
    }

    /**
     * Test MFA enforcement for privileged roles.
     */
    public function test_mfa_enforcement(): void
    {
        $mfaService = new MfaEnforcementService();
        
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $hospitalAdminRole = Role::where('slug', 'hospital-admin')->first();
        $staffRole = Role::where('slug', 'staff')->first();
        
        $this->assertTrue($mfaService->isMfaRequiredForRole($superAdminRole->id),
            'Super Admin should require MFA');
        
        $this->assertTrue($mfaService->isMfaRequiredForRole($hospitalAdminRole->id),
            'Hospital Admin should require MFA');
        
        $this->assertFalse($mfaService->isMfaRequiredForRole($staffRole->id),
            'Staff should not require MFA');
    }

    /**
     * Test session timeout policies.
     */
    public function test_session_timeout_enforcement(): void
    {
        $sessionService = new SessionTimeoutService();
        
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $hospitalAdminRole = Role::where('slug', 'hospital-admin')->first();
        $staffRole = Role::where('slug', 'staff')->first();
        $viewerRole = Role::where('slug', 'viewer')->first();
        
        $this->assertEquals(15, $sessionService->getTimeoutForRole($superAdminRole->id),
            'Super Admin should have 15-minute timeout');
        
        $this->assertEquals(30, $sessionService->getTimeoutForRole($hospitalAdminRole->id),
            'Hospital Admin should have 30-minute timeout');
        
        $this->assertEquals(60, $sessionService->getTimeoutForRole($staffRole->id),
            'Staff should have 60-minute timeout');
        
        $this->assertEquals(240, $sessionService->getTimeoutForRole($viewerRole->id),
            'Viewer should have 240-minute timeout');
    }

    /**
     * Test privilege escalation prevention.
     */
    public function test_privilege_escalation_prevention(): void
    {
        $detector = new PrivilegeEscalationDetector();
        
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $hospitalAdminRole = Role::where('slug', 'hospital-admin')->first();
        
        // Hospital Admin should not be able to assign Super Admin role
        $result = $detector->detectUnauthorizedRoleChanges(
            $hospitalAdminRole->id,
            1, // target user ID
            $superAdminRole->id
        );
        
        $this->assertNotEmpty($result, 
            'Hospital Admin should not be able to assign Super Admin role');
    }

    /**
     * Test that permission change requests are tracked.
     */
    public function test_permission_change_request_tracking(): void
    {
        $escalationService = new PermissionEscalationService();
        
        // Create a request
        $request = $escalationService->createEscalationRequest(
            1, // requester ID
            ['users.manage_roles'],
            'Temporary access needed for audit',
            24 // hours
        );
        
        $this->assertNotNull($request, 'Escalation request should be created');
        $this->assertEquals('pending', $request->status,
            'New request should have pending status');
    }

    /**
     * Test module-specific admin restrictions.
     */
    public function test_module_specific_admin_boundaries(): void
    {
        $labAdminRole = Role::where('slug', 'laboratory-admin')->first();
        $pharmacyAdminRole = Role::where('slug', 'pharmacy-admin')->first();
        
        $labPermissions = $labAdminRole->permissions()->pluck('name')->toArray();
        $pharmacyPermissions = $pharmacyAdminRole->permissions()->pluck('name')->toArray();
        
        // Lab admin should not have pharmacy inventory permissions
        $pharmacyInventoryPerms = array_filter($pharmacyPermissions, 
            fn($p) => str_contains($p, 'inventory') || str_contains($p, 'medicine'));
        
        $labHasPharmacyAccess = array_filter($labPermissions,
            fn($p) => str_contains($p, 'pharmacy') || str_contains($p, 'inventory') || str_contains($p, 'medicine'));
        
        $this->assertEmpty($labHasPharmacyAccess, 
            'Laboratory Admin should not have pharmacy permissions');
    }

    /**
     * Test staff role has limited permissions.
     */
    public function test_staff_role_limited_permissions(): void
    {
        $staffRole = Role::where('slug', 'staff')->first();
        $this->assertNotNull($staffRole);
        
        $staffPermissions = $staffRole->permissions()->pluck('name')->toArray();
        
        // Staff should not have management permissions
        $managementPerms = ['users.manage_roles', 'users.manage_permissions', 'system.configure'];
        foreach ($managementPerms as $perm) {
            $this->assertNotContains($perm, $staffPermissions,
                "Staff should not have {$perm}");
        }
        
        // Staff should have lower priority
        $hospitalAdminRole = Role::where('slug', 'hospital-admin')->first();
        $this->assertLessThan($hospitalAdminRole->priority, $staffRole->priority,
            'Staff should have lower priority than Hospital Admin');
    }

    /**
     * Test viewer role is read-only.
     */
    public function test_viewer_role_read_only(): void
    {
        $viewerRole = Role::where('slug', 'viewer')->first();
        $this->assertNotNull($viewerRole);
        
        $viewerPermissions = $viewerRole->permissions()->pluck('name')->toArray();
        
        // Viewer should not have create, update, or delete permissions
        $writePerms = array_filter($viewerPermissions, fn($p) => 
            str_contains($p, '.create') || 
            str_contains($p, '.update') || 
            str_contains($p, '.delete') ||
            str_contains($p, '.manage') ||
            str_contains($p, '.approve')
        );
        
        $this->assertEmpty($writePerms, 'Viewer should not have write permissions');
    }

    /**
     * Test role-specific limitations are applied.
     */
    public function test_role_specific_limitations(): void
    {
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        $viewerRole = Role::where('slug', 'viewer')->first();
        
        $this->assertNotEmpty($superAdminRole->module_access,
            'Super Admin should have module access defined');
        
        $this->assertContains('*', $superAdminRole->module_access ?? [],
            'Super Admin should have wildcard module access');
        
        $this->assertContains('*', $superAdminRole->data_visibility_scope ?? [],
            'Super Admin should have wildcard data visibility');
    }
}
