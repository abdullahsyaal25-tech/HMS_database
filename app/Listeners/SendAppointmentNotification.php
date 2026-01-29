<?php

namespace App\Listeners;

use App\Events\AppointmentCreated;
use App\Models\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendAppointmentNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(AppointmentCreated $event): void
    {
        try {
            // Create notification for patient
            Notification::create([
                'user_id' => $event->appointment->patient->user_id,
                'type' => 'appointment_created',
                'title' => 'New Appointment Scheduled',
                'message' => "Your appointment {$event->appointment->appointment_id} has been scheduled for {$event->appointment->appointment_date}",
                'data' => json_encode([
                    'appointment_id' => $event->appointment->appointment_id,
                    'patient_id' => $event->appointment->patient_id,
                    'doctor_id' => $event->appointment->doctor_id,
                    'appointment_date' => $event->appointment->appointment_date,
                    'status' => $event->appointment->status,
                ]),
                'priority' => 'normal',
                'read_at' => null,
            ]);

            // Create notification for doctor
            Notification::create([
                'user_id' => $event->appointment->doctor->user_id,
                'type' => 'appointment_assigned',
                'title' => 'New Patient Appointment',
                'message' => "You have a new appointment {$event->appointment->appointment_id} with {$event->appointment->patient->name} on {$event->appointment->appointment_date}",
                'data' => json_encode([
                    'appointment_id' => $event->appointment->appointment_id,
                    'patient_id' => $event->appointment->patient_id,
                    'doctor_id' => $event->appointment->doctor_id,
                    'appointment_date' => $event->appointment->appointment_date,
                    'status' => $event->appointment->status,
                ]),
                'priority' => 'normal',
                'read_at' => null,
            ]);

            Log::info('Appointment notifications created successfully', [
                'appointment_id' => $event->appointment->appointment_id,
                'patient_user_id' => $event->appointment->patient->user_id,
                'doctor_user_id' => $event->appointment->doctor->user_id,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create appointment notifications', [
                'error' => $e->getMessage(),
                'appointment_id' => $event->appointment->appointment_id,
            ]);
        }
    }
}