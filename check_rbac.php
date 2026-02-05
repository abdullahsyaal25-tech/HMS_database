<?php
// Check RBAC data
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Roles:\n";
foreach (\App\Models\Role::select('id','name','slug','priority')->orderBy('priority','desc')->get() as $r) {
    echo "  {$r->id}. {$r->name} ({$r->slug}) - Priority: {$r->priority}\n";
}

echo "\nUsers:\n";
foreach (\App\Models\User::all() as $u) {
    $role = \App\Models\Role::find($u->role_id);
    echo "  {$u->id}. {$u->name} - Email: {$u->email} - Role: " . ($role?->name ?? 'NONE') . "\n";
}
