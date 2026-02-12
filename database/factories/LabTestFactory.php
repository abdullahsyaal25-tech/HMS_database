<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Patient;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LabTest>
 */
class LabTestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        $testTypes = [
            'Complete Blood Count (CBC)',
            'Blood Glucose',
            'Lipid Profile',
            'Liver Function Test',
            'Kidney Function Test',
            'Thyroid Function Test',
            'Urinalysis',
            'X-Ray',
            'MRI',
            'CT Scan',
        ];
        
        return [
            'patient_id' => Patient::factory(),
            'test_name' => $this->faker->randomElement($testTypes),
            'test_code' => strtoupper($this->faker->lexify('???')),
            'status' => 'pending',
            'result' => null,
            'reference_range' => $this->faker->optional()->sentence(),
            'notes' => $this->faker->optional()->sentence(),
            'requested_at' => now(),
            'completed_at' => null,
        ];
    }
    
    /**
     * Indicate that the lab test is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'result' => $this->faker->randomElement(['Normal', 'Abnormal', 'Positive', 'Negative']),
            'completed_at' => now(),
        ]);
    }
    
    /**
     * Indicate that the lab test is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }
}
