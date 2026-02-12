<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Department;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Doctor>
 */
class DoctorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $specializations = [
            'General Medicine',
            'Cardiology',
            'Dermatology',
            'Neurology',
            'Orthopedics',
            'Pediatrics',
            'Psychiatry',
            'Surgery',
        ];
        
        return [
            'doctor_id' => 'DOC' . str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => 'Dr. ' . $this->faker->name(),
            'specialization' => $this->faker->randomElement($specializations),
            'phone' => $this->faker->numerify('##########'),
            'department_id' => null,
            'is_available' => true,
        ];
    }
    
    /**
     * Indicate that the doctor is unavailable.
     */
    public function unavailable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_available' => false,
        ]);
    }
}
