<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

echo "=== DATABASE CONTENT CHECK ===\n\n";

echo "1. USERS (" . User::count() . " total):\n";
echo str_repeat('-', 80) . "\n";
$users = User::select('id', 'name', 'username', 'role', 'role_id')->get();
if ($users->isEmpty()) {
    echo "   (no users)\n";
} else {
    foreach ($users as $u) {
        echo "   ID:{$u->id} | {$u->username} | {$u->name} | Role:{$u->role} | RoleID:" . ($u->role_id ?? 'null') . "\n";
    }
}
echo "\n";

echo "2. ROLES (" . Role::count() . " total):\n";
echo str_repeat('-', 80) . "\n";
$roles = Role::select('id', 'name')->get();
if ($roles->isEmpty()) {
    echo "   (no roles)\n";
} else {
    foreach ($roles as $r) {
        $permCount = $r->permissions()->count();
        echo "   ID:{$r->id} | {$r->name} | Permissions: {$permCount}\n";
    }
}
echo "\n";

echo "3. PERMISSIONS (" . Permission::count() . " total):\n";
echo str_repeat('-', 80) . "\n";
$perms = Permission::select('id', 'name', 'category')->orderBy('category')->get();
if ($perms->isEmpty()) {
    echo "   (no permissions)\n";
} else {
    $currentCat = '';
    foreach ($perms as $p) {
        if ($p->category != $currentCat) {
            $currentCat = $p->category;
            echo "\n   [{$currentCat}]:\n";
        }
        echo "      ID:{$p->id} | {$p->name}\n";
    }
}
echo "\n";

echo "4. ROLE_PERMISSIONS:\n";
echo str_repeat('-', 80) . "\n";
$rolePerms = \DB::table('role_permissions')->get();
if ($rolePerms->isEmpty()) {
    echo "   (no role-permission assignments)\n";
} else {
    foreach ($rolePerms as $rp) {
        $role = Role::find($rp->role_id);
        $perm = Permission::find($rp->permission_id);
        $roleName = $role ? $role->name : 'unknown';
        $permName = $perm ? $perm->name : 'unknown';
        echo "   {$roleName} -> {$permName}\n";
    }
}
echo "\n";

echo "=== SUMMARY ===\n";
echo "Users: " . User::count() . " | Roles: " . Role::count() . " | Permissions: " . Permission::count() . "\n";
echo "\n";

// Check which users can login
$adminUser = User::where('username', 'admin')->first();
$hospitalUser = User::where('username', 'hospital_admin')->first();

echo "LOGIN CREDENTIALS:\n";
if ($adminUser) {
    echo "   ✅ admin / password (the first user we created)\n";
}
if ($hospitalUser) {
    echo "   ✅ hospital_admin / hospital123\n";
} else {
    echo "   ❌ hospital_admin does not exist\n";
    echo "      The 'admin' user IS your hospital admin!\n";
}

echo "\n=== END ===\n";
