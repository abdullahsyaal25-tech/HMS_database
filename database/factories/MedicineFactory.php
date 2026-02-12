<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Medicine>
 */
class MedicineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops'];
        $units = ['mg', 'ml', 'g', 'units'];
        
        return [
            'name' => $this->faker->word() . ' ' . $this->faker->randomElement(['500mg', '250mg', '100mg', '10ml']),
            'generic_name' => $this->faker->word(),
            'brand_name' => $this->faker->company(),
            'dosage_form' => $this->faker->randomElement($dosageForms),
            'strength' => $this->faker->randomNumber(2) . $this->faker->randomElement($units),
            'unit' => $this->faker->randomElement($units),
            'stock_quantity' => $this->faker->numberBetween(0, 1000),
            'reorder_level' => $this->faker->numberBetween(10, 50),
            'price' => $this->faker->randomFloat(2, 5, 500),
            'expiry_date' => $this->faker->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
            'manufacturer' => $this->faker->company(),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
    
    /**
     * Indicate that the medicine is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }
    
    /**
     * Indicate that the medicine is low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 5,
            'reorder_level' => 10,
        ]);
    }
}
