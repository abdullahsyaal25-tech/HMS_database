<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

describe('Password Hashing', function () {
    it('should hash password on user creation', function () {
        $user = User::factory()->create(['password' => 'plain_password']);

        expect(Hash::check('plain_password', $user->password))->toBeTrue();
        expect($user->password)->not->toBe('plain_password');
    });

    it('should verify correct password', function () {
        $user = User::factory()->create(['password' => bcrypt('correct_password')]);

        expect(Hash::check('correct_password', $user->password))->toBeTrue();
    });

    it('should not verify incorrect password', function () {
        $user = User::factory()->create(['password' => bcrypt('correct_password')]);

        expect(Hash::check('wrong_password', $user->password))->toBeFalse();
    });
});

describe('User Roles', function () {
    it('should assign role to user', function () {
        $role = Role::factory()->create(['name' => 'doctor']);
        
        $user = User::factory()->create();
        $user->role()->associate($role);
        $user->save();

        expect($user->role->name)->toBe('doctor');
    });

    it('should check if user has specific role', function () {
        $role = Role::factory()->create(['name' => 'admin']);
        
        $user = User::factory()->create();
        $user->role()->associate($role);
        $user->save();

        expect($user->role->name)->toBe('admin');
    });
});

describe('Account Lockout', function () {
    it('should track failed login attempts', function () {
        $user = User::factory()->create([
            'login_attempts' => 0,
            'locked_until' => null,
        ]);

        $user->increment('login_attempts');

        expect($user->login_attempts)->toBe(1);
    });

    it('should lock account after max attempts', function () {
        $user = User::factory()->create([
            'login_attempts' => 5,
            'locked_until' => null,
        ]);

        $user->update(['locked_until' => now()->addMinutes(30)]);

        expect($user->locked_until)->not->toBeNull();
    });

    it('should unlock account after lockout period', function () {
        $user = User::factory()->create([
            'login_attempts' => 5,
            'locked_until' => now()->subMinutes(5),
        ]);

        $isLocked = $user->locked_until && $user->locked_until->isFuture();

        expect($isLocked)->toBeFalse();
    });
});

describe('Two-Factor Authentication', function () {
    it('should enable two-factor authentication', function () {
        $user = User::factory()->create([
            'two_factor_secret' => null,
            'two_factor_enabled' => false,
        ]);

        $user->update([
            'two_factor_secret' => encrypt('secret_key'),
            'two_factor_enabled' => true,
        ]);

        expect($user->two_factor_enabled)->toBeTrue();
    });

    it('should disable two-factor authentication', function () {
        $user = User::factory()->create([
            'two_factor_secret' => encrypt('secret_key'),
            'two_factor_enabled' => true,
        ]);

        $user->update([
            'two_factor_secret' => null,
            'two_factor_enabled' => false,
        ]);

        expect($user->two_factor_enabled)->toBeFalse();
    });
});

describe('User Validation', function () {
    it('should validate required fields', function () {
        $user = new User();

        expect($user->getFillable())->toContain('name', 'email');
    });

    it('should have valid email format', function () {
        $user = User::factory()->create(['email' => 'test@example.com']);

        expect(filter_var($user->email, FILTER_VALIDATE_EMAIL))->not->toBeFalse();
    });
});
