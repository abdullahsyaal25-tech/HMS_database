<?php
require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('username', 'hospital_admin')->first();

echo "User: " . ($user ? $user->name : 'NOT FOUND') . "\n";
echo "Role: " . ($user ? $user->role : 'N/A') . "\n";
echo "Role ID: " . ($user ? $user->role_id : 'N/A') . "\n";
echo "Is Super Admin: " . ($user && $user->isSuperAdmin() ? 'YES' : 'NO') . "\n";

if ($user && $user->roleModel) {
    echo "Role Model Name: " . $user->roleModel->name . "\n";
    echo "Role Model Slug: " . $user->roleModel->slug . "\n";
    echo "Is Super Admin (from role): " . ($user->roleModel->slug === 'super-admin' ? 'YES' : 'NO') . "\n";
}
