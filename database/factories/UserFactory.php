<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Define a pool of real names based on the default users in the seeder
        $realNames = [
            'Hospital Admin',
            'Pharmacy Admin',
            'Laboratory Admin',
            'Dr. John Doe',
            'Test User',
            'Sample Admin',
            'System User',
            'Healthcare Staff',
            'Medical Professional',
            'Nurse Specialist',
            'Medical Technician',
            'Healthcare Administrator',
            'Dr. Jane Smith',
            'Dr. Michael Johnson',
            'Dr. Sarah Williams'
        ];
        
        // Define a pool of usernames based on the default users
        $realUsernames = [
            'admin',
            'pharmacy',
            'laboratory',
            'doctor',
            'staff',
            'user',
            'nurse',
            'tech',
            'admin_hospital',
            'staff_hospital',
            'doctor_hospital',
            'nurse_hospital'
        ];
        
        // Use predefined real names and usernames with unique suffix
        $name = $this->getRandomElement($realNames);
        $username = $this->getRandomElement($realUsernames) . '_' . Str::random(8);
        
        return [
            'name' => $name,
            'username' => $username,
            'password' => static::$password ??= 'password', // Will be automatically hashed by model cast
            'role' => $this->getRandomRole(),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null, // Set to null by default
            'two_factor_recovery_codes' => null, // Set to null by default
            'two_factor_confirmed_at' => null, // Set to null by default
        ];
    }
    
    /**
     * Get a random element from an array
     *
     * @param array $array
     * @return mixed
     */
    private function getRandomElement(array $array)
    {
        return $array[array_rand($array)];
    }
    
    /**
     * Get a random role
     *
     * @return string
     */
    private function getRandomRole(): string
    {
        $roles = ['user', 'Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'doctor', 'nurse', 'staff'];
        return $this->getRandomElement($roles);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            // No email verification needed as email is removed
        ]);
    }

    /**
     * Indicate that the model does not have two-factor authentication configured.
     */
    public function withoutTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }
}
