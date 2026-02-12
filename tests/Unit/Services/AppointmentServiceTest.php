<?php

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Department;
use App\Services\AppointmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->appointmentService = new AppointmentService();
    $this->patient = Patient::factory()->create();
    $this->doctor = Doctor::factory()->create();
    $this->department = Department::factory()->create();
});

describe('isDoctorAvailable', function () {
    it('should return true when doctor has no conflicting appointments', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        $isAvailable = $this->appointmentService->isDoctorAvailable($this->doctor->id, $date, '10:00:00', '10:30:00');

        expect($isAvailable)->toBeTrue();
    });

    it('should return false when doctor has overlapping appointment', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'scheduled',
        ]);

        $isAvailable = $this->appointmentService->isDoctorAvailable($this->doctor->id, $date, '10:15:00', '10:45:00');

        expect($isAvailable)->toBeFalse();
    });

    it('should return true for non-overlapping time slot', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'scheduled',
        ]);

        $isAvailable = $this->appointmentService->isDoctorAvailable($this->doctor->id, $date, '11:00:00', '11:30:00');

        expect($isAvailable)->toBeTrue();
    });

    it('should not consider cancelled appointments', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'cancelled',
        ]);

        $isAvailable = $this->appointmentService->isDoctorAvailable($this->doctor->id, $date, '10:15:00', '10:45:00');

        expect($isAvailable)->toBeTrue();
    });
});

describe('getAvailableSlots', function () {
    it('should return all slots when no appointments exist', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        $slots = $this->appointmentService->getAvailableSlots($this->doctor->id, $date);

        expect(count($slots))->toBeGreaterThan(0);
    });

    it('should exclude booked slots', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => 'scheduled',
        ]);

        $slots = $this->appointmentService->getAvailableSlots($this->doctor->id, $date);

        expect(in_array('09:00:00', $slots))->toBeFalse();
    });
});

describe('createAppointment', function () {
    it('should create appointment successfully', function () {
        $data = [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => now()->addDays(5)->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'type' => 'consultation',
        ];

        $appointment = $this->appointmentService->createAppointment($data);

        expect($appointment->exists)->toBeTrue();
        expect($appointment->status)->toBe('scheduled');
    });

    it('should throw exception for conflicting appointment', function () {
        $date = now()->addDays(5)->format('Y-m-d');

        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'scheduled',
        ]);

        $data = [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_date' => $date,
            'start_time' => '10:15:00',
            'end_time' => '10:45:00',
            'type' => 'consultation',
        ];

        expect(fn() => $this->appointmentService->createAppointment($data))->toThrow(\Exception::class);
    });
});

describe('cancelAppointment', function () {
    it('should cancel scheduled appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $result = $this->appointmentService->cancelAppointment($appointment->id, 'Patient requested');

        expect($result->status)->toBe('cancelled');
    });

    it('should not cancel completed appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'completed']);

        expect(fn() => $this->appointmentService->cancelAppointment($appointment->id, 'Test'))
            ->toThrow(\Exception::class);
    });
});

describe('completeAppointment', function () {
    it('should complete scheduled appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'scheduled']);

        $result = $this->appointmentService->completeAppointment($appointment->id, 'Patient treated');

        expect($result->status)->toBe('completed');
    });

    it('should not complete cancelled appointment', function () {
        $appointment = Appointment::factory()->create(['status' => 'cancelled']);

        expect(fn() => $this->appointmentService->completeAppointment($appointment->id, 'Test'))
            ->toThrow(\Exception::class);
    });
});

describe('getPatientAppointmentHistory', function () {
    it('should return all patient appointments', function () {
        Appointment::factory()->count(5)->create(['patient_id' => $this->patient->id]);

        $history = $this->appointmentService->getPatientAppointmentHistory($this->patient->id);

        expect($history->count())->toBe(5);
    });
});
