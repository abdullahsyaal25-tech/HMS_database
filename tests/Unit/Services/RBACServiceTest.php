<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Services\RBACService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->rbacService = new RBACService();
    $this->role = Role::factory()->create();
    $this->permission = Permission::factory()->create();
    $this->user = User::factory()->create();
});

describe('hasRole', function () {
    it('should return true when user has the role', function () {
        $this->user->role()->associate($this->role)->save();

        $hasRole = $this->rbacService->hasRole($this->user, $this->role->name);

        expect($hasRole)->toBeTrue();
    });

    it('should return false when user does not have the role', function () {
        $hasRole = $this->rbacService->hasRole($this->user, $this->role->name);

        expect($hasRole)->toBeFalse();
    });
});

describe('hasPermission', function () {
    it('should return true when user has direct permission', function () {
        $this->user->permissions()->attach($this->permission);

        $hasPermission = $this->rbacService->hasPermission($this->user, $this->permission->name);

        expect($hasPermission)->toBeTrue();
    });

    it('should return true when user has permission through role', function () {
        $this->role->permissions()->attach($this->permission);
        $this->user->role()->associate($this->role)->save();

        $hasPermission = $this->rbacService->hasPermission($this->user, $this->permission->name);

        expect($hasPermission)->toBeTrue();
    });

    it('should return false when user lacks permission', function () {
        $hasPermission = $this->rbacService->hasPermission($this->user, 'nonexistent_permission');

        expect($hasPermission)->toBeFalse();
    });
});

describe('givePermissionTo', function () {
    it('should attach permission to user', function () {
        $this->rbacService->givePermissionTo($this->user, $this->permission->name);

        expect($this->user->fresh()->permissions->contains($this->permission))->toBeTrue();
    });
});

describe('revokePermissionFrom', function () {
    it('should detach permission from user', function () {
        $this->user->permissions()->attach($this->permission);

        $this->rbacService->revokePermissionFrom($this->user, $this->permission->name);

        expect($this->user->fresh()->permissions->contains($this->permission))->toBeFalse();
    });
});

describe('syncPermissions', function () {
    it('should replace all user permissions', function () {
        $permission1 = Permission::factory()->create();
        $permission2 = Permission::factory()->create();

        $this->user->permissions()->attach($permission1);

        $this->rbacService->syncPermissions($this->user, [$permission2->name]);

        expect($this->user->fresh()->permissions->count())->toBe(1);
        expect($this->user->fresh()->permissions->contains($permission2))->toBeTrue();
    });
});

describe('assignRole', function () {
    it('should associate role with user', function () {
        $this->rbacService->assignRole($this->user, $this->role->name);

        expect($this->user->fresh()->role->id)->toBe($this->role->id);
    });
});

describe('removeRole', function () {
    it('should disassociate role from user', function () {
        $this->user->role()->associate($this->role)->save();

        $this->rbacService->removeRole($this->user);

        expect($this->user->fresh()->role)->toBeNull();
    });
});

describe('roleHasPermission', function () {
    it('should return true when role has permission', function () {
        $this->role->permissions()->attach($this->permission);

        $hasPermission = $this->rbacService->roleHasPermission($this->role, $this->permission->name);

        expect($hasPermission)->toBeTrue();
    });

    it('should return false when role lacks permission', function () {
        $hasPermission = $this->rbacService->roleHasPermission($this->role, 'nonexistent');

        expect($hasPermission)->toBeFalse();
    });
});

describe('checkAccess', function () {
    it('should allow access when user has permission', function () {
        $this->user->permissions()->attach($this->permission);

        $hasAccess = $this->rbacService->checkAccess($this->user, $this->permission->name);

        expect($hasAccess)->toBeTrue();
    });

    it('should deny access when user lacks permission', function () {
        $hasAccess = $this->rbacService->checkAccess($this->user, $this->permission->name);

        expect($hasAccess)->toBeFalse();
    });
});
