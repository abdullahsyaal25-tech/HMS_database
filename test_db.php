<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
use App\Models\User;
use App\Models\Permission;

$u = User::find(7);
echo "User: " . $u->name . "\n";
echo "Role: " . $u->role . "\n";
echo "Has permission via hasPermission(): " . ($u->hasPermission('view-doctors') ? 'yes' : 'no') . "\n";
echo "\nAll permissions from database:\n";
$perms = Permission::all();
foreach ($perms as $p) {
    echo "- " . $p->name . "\n";
}
