<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Find Super Admin role
$superAdminRole = App\Models\Role::where('slug', 'super-admin')->first();
if (!$superAdminRole) {
    echo "ERROR: Super Admin role not found!\n";
    exit(1);
}
echo "Super Admin Role ID: " . $superAdminRole->id . "\n";

// Find the user
$user = App\Models\User::where('username', 'hospital_admin')->first();
if (!$user) {
    echo "ERROR: User hospital_admin not found!\n";
    exit(1);
}
echo "Current User Role: " . $user->role . "\n";
echo "Current Role ID: " . $user->role_id . "\n";

// Update user to Super Admin
$user->role = 'Super Admin';
$user->role_id = $superAdminRole->id;
$user->save();

echo "Updated User Role: " . $user->role . "\n";
echo "Updated Role ID: " . $user->role_id . "\n";
echo "Is Super Admin Now: " . ($user->isSuperAdmin() ? 'YES' : 'NO') . "\n";
echo "\nSUCCESS: User hospital_admin is now a Super Admin!\n";
