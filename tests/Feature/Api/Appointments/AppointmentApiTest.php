<?php

use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'doctor']);
    $this->patient = Patient::factory()->create();
    $this->doctor = Doctor::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/appointments', function () {
    it('should return paginated appointments', function () {
        Appointment::factory()->count(15)->create();

        $response = $this->getJson('/api/v1/appointments');

        $response->assertStatus(200)->assertJsonStructure(['data', 'links', 'meta']);
    });

    it('should filter appointments by status', function () {
        Appointment::factory()->create(['status' => 'scheduled']);
        Appointment::factory()->create(['status' => 'completed']);

        $response = $this->getJson('/api/v1/appointments?status=scheduled');

        $response->assertStatus(200);
        collect($response->json('data'))->each(fn($apt) => expect($apt['status'])->toBe('scheduled'));
    });
});

describe('POST /api/v1/appointments', function () {
    it('should create new appointment', function () {
        $appointmentData = [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'type' => 'consultation',
        ];

        $response = $this->postJson('/api/v1/appointments', $appointmentData);

        $response->assertStatus(201);
        expect(Appointment::where('patient_id', $this->patient->id)->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/appointments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id', 'doctor_id', 'appointment_date', 'start_time']);
    });

    it('should validate appointment date is not in the past', function () {
        $appointmentData = Appointment::factory()->make(['appointment_date' => '2020-01-01'])->toArray();

        $response = $this->postJson('/api/v1/appointments', $appointmentData);

        $response->assertStatus(422)->assertJsonValidationErrors(['appointment_date']);
    });
});

describe('PUT /api/v1/appointments/{id}/cancel', function () {
    it('should cancel scheduled appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $response = $this->putJson("/api/v1/appointments/{$appointment->id}/cancel", ['reason' => 'Patient request']);

        $response->assertStatus(200);
        expect($appointment->fresh()->status)->toBe('cancelled');
    });

    it('should not cancel completed appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'completed']);

        $response = $this->putJson("/api/v1/appointments/{$appointment->id}/cancel", ['reason' => 'Test']);

        $response->assertStatus(422);
    });
});

describe('PUT /api/v1/appointments/{id}/complete', function () {
    it('should complete scheduled appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $response = $this->putJson("/api/v1/appointments/{$appointment->id}/complete");

        $response->assertStatus(200);
        expect($appointment->fresh()->status)->toBe('completed');
    });
});
