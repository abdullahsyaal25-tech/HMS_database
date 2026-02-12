<?php

namespace Tests\Traits;

use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait InteractsWithHMSAuth
{
    /**
     * Test users with different roles.
     */
    protected User $superAdmin;
    protected User $hospitalAdmin;
    protected User $doctor;
    protected User $nurse;
    protected User $pharmacyAdmin;
    protected User $laboratoryAdmin;
    protected User $staff;

    /**
     * Authenticate as super admin.
     */
    protected function actingAsSuperAdmin(): User
    {
        return $this->actingAs($this->superAdmin, 'sanctum');
    }

    /**
     * Authenticate as hospital admin.
     */
    protected function actingAsHospitalAdmin(): User
    {
        return $this->actingAs($this->hospitalAdmin, 'sanctum');
    }

    /**
     * Authenticate as doctor.
     */
    protected function actingAsDoctor(): User
    {
        return $this->actingAs($this->doctor, 'sanctum');
    }

    /**
     * Authenticate as nurse.
     */
    protected function actingAsNurse(): User
    {
        return $this->actingAs($this->nurse, 'sanctum');
    }

    /**
     * Authenticate as pharmacy admin.
     */
    protected function actingAsPharmacyAdmin(): User
    {
        return $this->actingAs($this->pharmacyAdmin, 'sanctum');
    }

    /**
     * Authenticate as laboratory admin.
     */
    protected function actingAsLaboratoryAdmin(): User
    {
        return $this->actingAs($this->laboratoryAdmin, 'sanctum');
    }

    /**
     * Authenticate as staff member.
     */
    protected function actingAsStaff(): User
    {
        return $this->actingAs($this->staff, 'sanctum');
    }

    /**
     * Make request as unauthenticated user (no authentication).
     * Note: Use this instead of actingAsGuest to avoid conflict with Laravel's method.
     */
    protected function asUnauthenticated(): static
    {
        return $this;
    }

    /**
     * Create Sanctum token for user.
     */
    protected function createUserToken(User $user, string $name = 'test'): string
    {
        // Revoke existing tokens for clean test
        $user->tokens()->delete();
        return $user->createToken($name)->plainTextToken;
    }

    /**
     * Get authenticated headers with token.
     */
    protected function getAuthenticatedHeaders(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->createUserToken($user),
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];
    }

    /**
     * Assert user has specific permission.
     */
    protected function assertUserHasPermission(User $user, string $permission): void
    {
        expect($user->hasPermissionTo($permission))->toBeTrue();
    }

    /**
     * Assert user lacks specific permission.
     */
    protected function assertUserLacksPermission(User $user, string $permission): void
    {
        expect($user->hasPermissionTo($permission))->toBeFalse();
    }

    /**
     * Assert user has specific role.
     */
    protected function assertUserHasRole(User $user, string $role): void
    {
        expect($user->hasRole($role))->toBeTrue();
    }

    /**
     * Simulate concurrent user logins.
     */
    protected function simulateConcurrentLogins(int $count): array
    {
        $results = [];
        
        for ($i = 0; $i < $count; $i++) {
            $user = \App\Models\User::factory()->create([
                'password' => bcrypt('Password123!'),
            ]);
            
            $results[] = $this->postJson('/login', [
                'username' => $user->username,
                'password' => 'Password123!',
            ]);
        }
        
        return $results;
    }

    /**
     * Create multiple users with different roles.
     */
    protected function createUsersForRoleTesting(): array
    {
        return [
            'superAdmin' => \App\Models\User::factory()->create(['role' => 'Super Admin']),
            'hospitalAdmin' => \App\Models\User::factory()->create(['role' => 'Hospital Admin']),
            'doctor' => \App\Models\User::factory()->create(['role' => 'Doctor']),
            'nurse' => \App\Models\User::factory()->create(['role' => 'Nurse']),
            'pharmacyAdmin' => \App\Models\User::factory()->create(['role' => 'Pharmacy Admin']),
            'laboratoryAdmin' => \App\Models\User::factory()->create(['role' => 'Laboratory Admin']),
            'staff' => \App\Models\User::factory()->create(['role' => 'Staff']),
        ];
    }

    /**
     * Get user by role for testing.
     */
    protected function getUserByRole(string $role): ?User
    {
        return match ($role) {
            'superAdmin' => $this->superAdmin ?? null,
            'hospitalAdmin' => $this->hospitalAdmin ?? null,
            'doctor' => $this->doctor ?? null,
            'nurse' => $this->nurse ?? null,
            'pharmacyAdmin' => $this->pharmacyAdmin ?? null,
            'laboratoryAdmin' => $this->laboratoryAdmin ?? null,
            'staff' => $this->staff ?? null,
            default => null,
        };
    }
}
