<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Creating Hospital Admin User ===\n\n";

// Check if hospital_admin already exists
$existing = User::where('username', 'hospital_admin')->first();
if ($existing) {
    echo "User 'hospital_admin' already exists!\n";
    echo "ID: {$existing->id}\n";
    echo "Name: {$existing->name}\n";
    echo "\nReset password? (Run with --reset flag to reset password)\n";
    
    if (in_array('--reset', $argv)) {
        $existing->password = Hash::make('hospital123');
        $existing->save();
        echo "✅ Password reset to: hospital123\n";
    }
    exit;
}

try {
    $user = User::create([
        'name' => 'Hospital Administrator',
        'username' => 'hospital_admin',
        'email' => 'hospital_admin@hospital.com',
        'password' => Hash::make('hospital123'),
        'role' => 'super-admin',
        'role_id' => 1,
    ]);
    
    echo "✅ Hospital Admin user created successfully!\n\n";
    echo "Login Credentials:\n";
    echo str_repeat('-', 40) . "\n";
    echo "Username: hospital_admin\n";
    echo "Password: hospital123\n";
    echo "Role: Super Admin\n";
    echo "\n";
    echo "IMPORTANT: Change the password after first login!\n";
    
} catch (Exception $e) {
    echo "❌ Error creating user: " . $e->getMessage() . "\n";
}

echo "\n=== Complete ===\n";
