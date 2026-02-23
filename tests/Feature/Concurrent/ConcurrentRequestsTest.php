<?php

use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Medicine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'doctor']);
    $this->doctor = Doctor::factory()->create();
    $this->patient = Patient::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('Appointment Slot Reservation', function () {
    it('should only allow one appointment for the same slot', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        // First booking should succeed
        $firstResponse = $this->postJson('/api/v1/appointments', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
        ]);

        expect($firstResponse->status())->toBe(201);

        // Second booking for same slot should fail
        $patient2 = Patient::factory()->create();
        $secondResponse = $this->postJson('/api/v1/appointments', [
            'patient_id' => $patient2->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
        ]);

        $secondResponse->assertStatus(422);
    });
});

describe('Stock Update Race Conditions', function () {
    it('should handle concurrent stock deductions correctly', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 10]);

        // Deduct 5 twice - should work
        $this->putJson("/api/v1/medicines/{$medicine->id}/stock", [
            'quantity' => 5,
            'type' => 'deduct',
        ]);

        $this->putJson("/api/v1/medicines/{$medicine->id}/stock", [
            'quantity' => 5,
            'type' => 'deduct',
        ]);

        expect($medicine->fresh()->stock_quantity)->toBe(0);
    });

    it('should prevent stock from going negative', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 5]);

        // Try to deduct more than available
        $response = $this->putJson("/api/v1/medicines/{$medicine->id}/stock", [
            'quantity' => 10,
            'type' => 'deduct',
        ]);

        $response->assertStatus(422);
        expect($medicine->fresh()->stock_quantity)->toBe(5);
    });
});
