<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Permission;
use App\Models\PermissionDependency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionDependencyTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_validates_permission_dependencies_correctly()
    {
        // Create permissions
        $parentPermission = Permission::create([
            'name' => 'view-users',
            'description' => 'Can view users',
        ]);

        $childPermission = Permission::create([
            'name' => 'edit-users',
            'description' => 'Can edit users',
        ]);

        $independentPermission = Permission::create([
            'name' => 'view-reports',
            'description' => 'Can view reports',
        ]);

        // Create user
        $user = User::factory()->create(['role' => 'Reception Admin']);

        // Test without dependencies - should pass
        $errors = $user->validatePermissionDependencies([$parentPermission->id]);
        $this->assertEmpty($errors);

        // Create dependency: edit-users requires view-users
        PermissionDependency::create([
            'permission_id' => $childPermission->id,
            'depends_on_permission_id' => $parentPermission->id,
        ]);

        // Test with dependency satisfied
        $errors = $user->validatePermissionDependencies([$parentPermission->id, $childPermission->id]);
        $this->assertEmpty($errors);

        // Test with dependency not satisfied
        $errors = $user->validatePermissionDependencies([$childPermission->id]);
        $this->assertNotEmpty($errors);
        $this->assertStringContains('edit-users', $errors[0]);
        $this->assertStringContains('view-users', $errors[0]);
    }

    /** @test */
    public function it_handles_multiple_dependencies()
    {
        // Create permissions
        $permissionA = Permission::create(['name' => 'permission-a']);
        $permissionB = Permission::create(['name' => 'permission-b']);
        $permissionC = Permission::create(['name' => 'permission-c']);
        $permissionD = Permission::create(['name' => 'permission-d']);

        // Create dependencies: permission-c requires both A and B
        PermissionDependency::create([
            'permission_id' => $permissionC->id,
            'depends_on_permission_id' => $permissionA->id,
        ]);

        PermissionDependency::create([
            'permission_id' => $permissionC->id,
            'depends_on_permission_id' => $permissionB->id,
        ]);

        // Create user
        $user = User::factory()->create();

        // Test with all dependencies satisfied
        $errors = $user->validatePermissionDependencies([$permissionA->id, $permissionB->id, $permissionC->id]);
        $this->assertEmpty($errors);

        // Test with one dependency missing
        $errors = $user->validatePermissionDependencies([$permissionA->id, $permissionC->id]);
        $this->assertCount(1, $errors);

        // Test with both dependencies missing
        $errors = $user->validatePermissionDependencies([$permissionC->id]);
        $this->assertCount(2, $errors);
    }

    /** @test */
    public function it_handles_nested_dependencies()
    {
        // Create permissions
        $basePermission = Permission::create(['name' => 'base-permission']);
        $middlePermission = Permission::create(['name' => 'middle-permission']);
        $topPermission = Permission::create(['name' => 'top-permission']);

        // Create nested dependencies: top requires middle, middle requires base
        PermissionDependency::create([
            'permission_id' => $middlePermission->id,
            'depends_on_permission_id' => $basePermission->id,
        ]);

        PermissionDependency::create([
            'permission_id' => $topPermission->id,
            'depends_on_permission_id' => $middlePermission->id,
        ]);

        $user = User::factory()->create();

        // Test with all nested dependencies satisfied
        $errors = $user->validatePermissionDependencies([$basePermission->id, $middlePermission->id, $topPermission->id]);
        $this->assertEmpty($errors);

        // Test with intermediate dependency missing
        $errors = $user->validatePermissionDependencies([$basePermission->id, $topPermission->id]);
        $this->assertNotEmpty($errors);
        $this->assertStringContains('top-permission', $errors[0]);
        $this->assertStringContains('middle-permission', $errors[0]);
    }

    /** @test */
    public function it_returns_empty_array_when_no_dependencies_exist()
    {
        $permission = Permission::create(['name' => 'independent-permission']);
        $user = User::factory()->create();

        $errors = $user->validatePermissionDependencies([$permission->id]);
        $this->assertEmpty($errors);
    }

    /** @test */
    public function it_handles_empty_permission_array()
    {
        $user = User::factory()->create();

        $errors = $user->validatePermissionDependencies([]);
        $this->assertEmpty($errors);
    }
}
