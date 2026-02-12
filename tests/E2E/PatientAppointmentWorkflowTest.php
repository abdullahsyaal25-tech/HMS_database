<?php

use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Bill;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->adminUser = User::factory()->create(['role' => 'admin']);
    $this->doctorUser = User::factory()->create(['role' => 'doctor']);
    $this->doctor = Doctor::factory()->create(['user_id' => $this->doctorUser->id]);
});

describe('Complete Patient Journey', function () {
    it('should handle complete patient registration to appointment workflow', function () {
        Sanctum::actingAs($this->adminUser);

        // Step 1: Register new patient
        $patientResponse = $this->postJson('/api/v1/patients', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'date_of_birth' => '1985-05-15',
            'gender' => 'male',
            'phone' => '+1234567890',
        ]);

        $patientResponse->assertStatus(201);
        $patientId = $patientResponse->json('id');

        // Step 2: Create appointment for patient
        $appointmentResponse = $this->postJson('/api/v1/appointments', [
            'patient_id' => $patientId,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => now()->addDays(3)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
        ]);

        $appointmentResponse->assertStatus(201);
        $appointmentId = $appointmentResponse->json('id');

        // Step 3: Complete appointment
        $this->putJson("/api/v1/appointments/{$appointmentId}/complete");

        // Step 4: Create bill
        $billResponse = $this->postJson('/api/v1/bills', [
            'patient_id' => $patientId,
            'billing_date' => now()->format('Y-m-d'),
            'items' => [
                ['description' => 'Consultation', 'quantity' => 1, 'unit_price' => 150.00],
            ],
        ]);

        $billResponse->assertStatus(201);
        $billId = $billResponse->json('id');

        // Step 5: Process payment
        $this->postJson("/api/v1/bills/{$billId}/payment", [
            'amount' => 150.00,
            'payment_method' => 'credit_card',
        ]);

        // Verify complete workflow
        expect(Bill::find($billId)->status)->toBe('paid');
        expect(Appointment::find($appointmentId)->status)->toBe('completed');
    });

    it('should handle appointment cancellation and refund workflow', function () {
        Sanctum::actingAs($this->adminUser);

        $patient = Patient::factory()->create();
        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'status' => 'scheduled',
        ]);

        $bill = Bill::factory()->create([
            'patient_id' => $patient->id,
            'total_amount' => 150.00,
            'paid_amount' => 150.00,
            'status' => 'paid',
        ]);

        // Cancel appointment
        $this->putJson("/api/v1/appointments/{$appointment->id}/cancel", [
            'reason' => 'Patient requested cancellation',
        ]);

        // Refund payment
        $this->postJson("/api/v1/bills/{$bill->id}/refund", [
            'amount' => 150.00,
            'reason' => 'Appointment cancelled',
        ]);

        expect($bill->fresh()->status)->toBe('refunded');
        expect($appointment->fresh()->status)->toBe('cancelled');
    });
});
