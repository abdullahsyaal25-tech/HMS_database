<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Patient;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Bill>
 */
class BillFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['draft', 'pending', 'partial', 'paid', 'voided'];
        
        return [
            'patient_id' => Patient::factory(),
            'bill_number' => 'BILL' . str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT),
            'total_amount' => $this->faker->randomFloat(2, 100, 5000),
            'paid_amount' => 0,
            'status' => 'draft',
            'due_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
    
    /**
     * Indicate that the bill is paid.
     */
    public function paid(): static
    {
        return $this->state(function (array $attributes) {
            $total = $attributes['total_amount'] ?? $this->faker->randomFloat(2, 100, 5000);
            return [
                'status' => 'paid',
                'paid_amount' => $total,
            ];
        });
    }
    
    /**
     * Indicate that the bill is partially paid.
     */
    public function partial(): static
    {
        return $this->state(function (array $attributes) {
            $total = $attributes['total_amount'] ?? $this->faker->randomFloat(2, 100, 5000);
            return [
                'status' => 'partial',
                'paid_amount' => $total / 2,
            ];
        });
    }
    
    /**
     * Indicate that the bill is voided.
     */
    public function voided(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'voided',
        ]);
    }
}
