<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AppointmentCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Appointment $appointment;
    public array $notificationData;

    /**
     * Create a new event instance.
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
        $this->notificationData = [
            'id' => $appointment->id,
            'type' => 'appointment_created',
            'title' => 'New Appointment Scheduled',
            'message' => "Appointment {$appointment->appointment_id} has been scheduled for {$appointment->appointment_date}",
            'patient_name' => $appointment->patient->name ?? 'Unknown',
            'doctor_name' => $appointment->doctor->name ?? 'Unknown',
            'appointment_date' => $appointment->appointment_date,
            'created_at' => now()->toIso8601String(),
            'priority' => 'normal'
        ];
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->appointment->patient->user_id),
            new PrivateChannel('user.' . $this->appointment->doctor->user_id),
            new Channel('appointments'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return $this->notificationData;
    }

    /**
     * Get the broadcast event name.
     */
    public function broadcastAs(): string
    {
        return 'appointment.created';
    }
}