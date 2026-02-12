<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Patient>
 */
class PatientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $genders = ['Male', 'Female'];
        $bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        
        return [
            'patient_id' => 'PAT' . str_pad((string) random_int(1, 99999), 5, '0', STR_PAD_LEFT),
            'first_name' => $this->faker->firstName(),
            'father_name' => $this->faker->lastName(),
            'gender' => $this->faker->randomElement($genders),
            'phone' => $this->faker->numerify('##########'),
            'age' => $this->faker->numberBetween(1, 100),
            'blood_group' => $this->faker->randomElement($bloodGroups),
            'address' => [
                'street' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
            ],
        ];
    }
}
