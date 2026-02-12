<?php

use App\Models\User;
use App\Models\Patient;
use App\Models\LabTest;
use App\Models\LabTestRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'laboratory']);
    $this->patient = Patient::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/lab-tests', function () {
    it('should return paginated lab tests', function () {
        LabTest::factory()->count(20)->create();

        $response = $this->getJson('/api/v1/lab-tests');

        $response->assertStatus(200)->assertJsonStructure(['data', 'links', 'meta']);
    });

    it('should filter lab tests by status', function () {
        LabTest::factory()->create(['status' => 'pending']);
        LabTest::factory()->create(['status' => 'completed']);

        $response = $this->getJson('/api/v1/lab-tests?status=pending');

        $response->assertStatus(200);
        collect($response->json('data'))->each(fn($test) => expect($test['status'])->toBe('pending'));
    });
});

describe('POST /api/v1/lab-tests', function () {
    it('should create new lab test', function () {
        $testData = [
            'name' => 'Thyroid Profile',
            'category' => 'biochemistry',
            'sample_type' => 'blood',
            'turnaround_time' => 24,
            'price' => 150.00,
        ];

        $response = $this->postJson('/api/v1/lab-tests', $testData);

        $response->assertStatus(201);
        expect(LabTest::where('name', 'Thyroid Profile')->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/lab-tests', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['name', 'category', 'sample_type']);
    });
});

describe('POST /api/v1/lab-test-requests', function () {
    it('should create lab test request', function () {
        $test = LabTest::factory()->create();

        $requestData = [
            'patient_id' => $this->patient->id,
            'lab_test_id' => $test->id,
            'requested_by' => $this->user->id,
            'priority' => 'normal',
        ];

        $response = $this->postJson('/api/v1/lab-test-requests', $requestData);

        $response->assertStatus(201);
        expect(LabTestRequest::where('patient_id', $this->patient->id)->exists())->toBeTrue();
    });

    it('should validate patient exists', function () {
        $test = LabTest::factory()->create();

        $response = $this->postJson('/api/v1/lab-test-requests', [
            'patient_id' => 99999,
            'lab_test_id' => $test->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['patient_id']);
    });
});
