<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

echo "=== Login Diagnostic ===\n\n";

// Check if users exist
$userCount = User::count();
echo "Total users in database: {$userCount}\n\n";

if ($userCount === 0) {
    echo "❌ CRITICAL: No users exist in the database!\n";
    echo "This is why you cannot login.\n\n";
    
    echo "Creating default admin user...\n";
    
    try {
        $admin = User::create([
            'name' => 'Super Admin',
            'username' => 'admin',
            'email' => 'admin@hospital.com',
            'password' => Hash::make('password'),
            'role' => 'super-admin',
            'role_id' => 1,
        ]);
        
        echo "✅ Default admin user created!\n";
        echo "Username: admin\n";
        echo "Password: password\n";
        echo "Role: Super Admin\n\n";
        
        echo "IMPORTANT: Change the password after first login!\n";
        
    } catch (Exception $e) {
        echo "❌ Failed to create admin user: " . $e->getMessage() . "\n";
    }
} else {
    echo "Users in database:\n";
    echo str_repeat('-', 80) . "\n";
    printf("%-5s %-20s %-20s %-15s %-10s\n", "ID", "Name", "Username", "Role", "Role ID");
    echo str_repeat('-', 80) . "\n";
    
    $users = User::select('id', 'name', 'username', 'role', 'role_id')->get();
    foreach ($users as $user) {
        printf("%-5d %-20s %-20s %-15s %-10s\n", 
            $user->id, 
            substr($user->name, 0, 20), 
            substr($user->username, 0, 20), 
            $user->role, 
            $user->role_id ?? 'null');
    }
    
    echo "\n✅ Users exist. If you can't login, check:\n";
    echo "1. Username spelling\n";
    echo "2. Password correctness\n";
    echo "3. Check laravel.log for login errors\n";
}

echo "\n=== Check Complete ===\n";
