<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Role>
 */
class RoleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roles = [
            'admin' => 'Administrator with full access',
            'doctor' => 'Doctor with patient management access',
            'nurse' => 'Nurse with limited patient access',
            'pharmacist' => 'Pharmacy staff for medicine management',
            'lab_tech' => 'Laboratory technician for lab tests',
            'receptionist' => 'Front desk staff for appointments',
            'accountant' => 'Billing and finance staff',
        ];
        
        $roleName = $this->faker->unique()->randomElement(array_keys($roles));
        
        return [
            'name' => $roleName,
            'slug' => Str::slug($roleName),
            'description' => $roles[$roleName] ?? $this->faker->sentence(),
            'is_active' => true,
        ];
    }
    
    /**
     * Indicate that the role is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
