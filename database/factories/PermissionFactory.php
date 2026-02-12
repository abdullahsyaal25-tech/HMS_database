<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Permission>
 */
class PermissionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $modules = ['patients', 'appointments', 'bills', 'medicines', 'lab_tests', 'users', 'reports', 'settings'];
        $actions = ['view', 'create', 'update', 'delete', 'export', 'import'];
        
        $module = $this->faker->randomElement($modules);
        $action = $this->faker->randomElement($actions);
        $name = "{$action}_{$module}";
        
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'module' => $module,
            'description' => "Permission to {$action} {$module}",
            'is_active' => true,
        ];
    }
}
