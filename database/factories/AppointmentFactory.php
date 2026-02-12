<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Patient;
use App\Models\Doctor;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['scheduled', 'completed', 'cancelled', 'no_show'];
        $appointmentDate = $this->faker->dateTimeBetween('now', '+30 days');
        
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'appointment_date' => $appointmentDate->format('Y-m-d'),
            'appointment_time' => $this->faker->time('H:i:s'),
            'status' => 'scheduled',
            'notes' => $this->faker->optional()->sentence(),
            'reason' => $this->faker->optional()->sentence(),
        ];
    }
    
    /**
     * Indicate that the appointment is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
    
    /**
     * Indicate that the appointment is cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
    
    /**
     * Indicate that the appointment is in the past.
     */
    public function past(): static
    {
        return $this->state(fn (array $attributes) => [
            'appointment_date' => $this->faker->dateTimeBetween('-30 days', '-1 day')->format('Y-m-d'),
        ]);
    }
}
