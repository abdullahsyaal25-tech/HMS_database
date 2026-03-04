<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Hospital Admin User Check ===\n\n";

// Check for hospital_admin user
$user = User::where('username', 'hospital_admin')
    ->orWhere('username', 'admin')
    ->orWhere('role', 'hospital_admin')
    ->first();

if (!$user) {
    echo "❌ No hospital_admin user found.\n\n";
    echo "All users in database:\n";
    echo str_repeat('-', 80) . "\n";
    
    $users = User::select('id', 'name', 'username', 'role')->get();
    if ($users->isEmpty()) {
        echo "  (no users found)\n";
    } else {
        foreach ($users as $u) {
            echo "  ID: {$u->id}, Username: {$u->username}, Role: {$u->role}\n";
        }
    }
    
    echo "\nCreating hospital_admin user...\n";
    
    try {
        $newUser = User::create([
            'name' => 'Hospital Administrator',
            'username' => 'hospital_admin',
            'email' => 'admin@hospital.com',
            'password' => Hash::make('hospital123'),
            'role' => 'super-admin',
            'role_id' => 1,
        ]);
        
        echo "✅ hospital_admin user created!\n";
        echo "Username: hospital_admin\n";
        echo "Password: hospital123\n";
        echo "Role: Super Admin\n";
        
    } catch (Exception $e) {
        echo "❌ Failed to create user: " . $e->getMessage() . "\n";
    }
} else {
    echo "✅ User found:\n";
    echo str_repeat('-', 50) . "\n";
    echo "ID:       {$user->id}\n";
    echo "Name:     {$user->name}\n";
    echo "Username: {$user->username}\n";
    echo "Email:    {$user->email}\n";
    echo "Role:     {$user->role}\n";
    echo "Role ID:  {$user->role_id}\n";
    echo "\n";
    
    // Show password hint (we can't show the actual password)
    echo "Password is stored securely (hashed).\n";
    echo "If you forgot the password, I can reset it.\n";
}

echo "\n=== Check Complete ===\n";
