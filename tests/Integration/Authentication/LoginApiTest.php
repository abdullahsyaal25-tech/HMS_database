<?php

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
    ]);
});

describe('POST /api/v1/auth/login', function () {
    it('should authenticate user with valid credentials', function () {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    });

    it('should reject invalid credentials', function () {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401);
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    });

    it('should validate email format', function () {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'invalid-email',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });

    it('should rate limit login attempts', function () {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'test@example.com',
                'password' => 'wrong_password',
            ]);
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'test@example.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(429);
    });
});

describe('POST /api/v1/auth/logout', function () {
    it('should logout authenticated user', function () {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(200);
    });

    it('should reject unauthenticated logout', function () {
        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertStatus(401);
    });
});

describe('GET /api/v1/auth/user', function () {
    it('should return authenticated user', function () {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/auth/user');

        $response->assertStatus(200)
            ->assertJson(['id' => $this->user->id]);
    });

    it('should reject unauthenticated request', function () {
        $response = $this->getJson('/api/v1/auth/user');

        $response->assertStatus(401);
    });
});

describe('POST /api/v1/auth/refresh', function () {
    it('should refresh token for authenticated user', function () {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/auth/refresh');

        $response->assertStatus(200)
            ->assertJsonStructure(['token']);
    });
});
