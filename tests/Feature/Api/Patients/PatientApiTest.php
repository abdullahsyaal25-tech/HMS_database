<?php

use App\Models\User;
use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/patients', function () {
    it('should return paginated patients', function () {
        Patient::factory()->count(25)->create();

        $response = $this->getJson('/api/v1/patients');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'links', 'meta']);
    });

    it('should search patients by name', function () {
        Patient::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
        Patient::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

        $response = $this->getJson('/api/v1/patients?search=John');

        $response->assertStatus(200);
        expect(count($response->json('data')))->toBe(1);
    });

    it('should reject unauthenticated request', function () {
        Sanctum::actingAs(null);

        $response = $this->getJson('/api/v1/patients');

        $response->assertStatus(401);
    });
});

describe('POST /api/v1/patients', function () {
    it('should create new patient', function () {
        $patientData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'date_of_birth' => '1990-01-15',
            'gender' => 'male',
            'phone' => '+1234567890',
            'address' => '123 Main St',
        ];

        $response = $this->postJson('/api/v1/patients', $patientData);

        $response->assertStatus(201)
            ->assertJson(['first_name' => 'John']);

        expect(Patient::where('email', 'john.doe@example.com')->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/patients', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'date_of_birth', 'gender']);
    });

    it('should validate unique email', function () {
        Patient::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/patients', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'existing@example.com',
            'date_of_birth' => '1990-01-15',
            'gender' => 'male',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    });
});

describe('GET /api/v1/patients/{id}', function () {
    it('should return patient details', function () {
        $patient = Patient::factory()->create();

        $response = $this->getJson("/api/v1/patients/{$patient->id}");

        $response->assertStatus(200)
            ->assertJson(['id' => $patient->id]);
    });

    it('should return 404 for non-existent patient', function () {
        $response = $this->getJson('/api/v1/patients/999999');

        $response->assertStatus(404);
    });
});

describe('PUT /api/v1/patients/{id}', function () {
    it('should update patient', function () {
        $patient = Patient::factory()->create();

        $response = $this->putJson("/api/v1/patients/{$patient->id}", [
            'first_name' => 'Updated',
            'last_name' => 'Name',
        ]);

        $response->assertStatus(200);
        expect($patient->fresh()->first_name)->toBe('Updated');
    });
});

describe('DELETE /api/v1/patients/{id}', function () {
    it('should delete patient', function () {
        $patient = Patient::factory()->create();

        $response = $this->deleteJson("/api/v1/patients/{$patient->id}");

        $response->assertStatus(204);
        expect(Patient::find($patient->id))->toBeNull();
    });
});
