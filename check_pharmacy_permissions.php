<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;

echo "=== Pharmacy Admin Permissions Check ===\n\n";

// Find pharmacy admin user
$user = User::where('username', 'like', '%pharmacy%')
    ->orWhere('name', 'like', '%Pharmacy%')
    ->orWhere('role', 'pharmacy')
    ->first();

if (!$user) {
    echo "No pharmacy user found by username/role.\n\n";
    
    // Check roles table
    echo "Available Roles:\n";
    echo str_repeat('-', 50) . "\n";
    $roles = Role::select('id', 'name')->get();
    if ($roles->isEmpty()) {
        echo "  (no roles found)\n";
    } else {
        foreach ($roles as $role) {
            echo "  Role ID: {$role->id} - {$role->name}\n";
        }
    }
    echo "\n";
    
    // Check Pharmacy Admin role permissions specifically
    echo "Pharmacy Admin Role (ID: 5) Permissions:\n";
    echo str_repeat('-', 50) . "\n";
    $pharmacyRole = Role::with('permissions')->find(5);
    if ($pharmacyRole) {
        $perms = $pharmacyRole->permissions;
        if ($perms->isEmpty()) {
            echo "  (no permissions assigned via permissions relationship)\n";
        } else {
            foreach ($perms as $perm) {
                echo "  ✓ {$perm->name} (ID: {$perm->id})\n";
            }
        }
        
        // Also check role_permissions table directly
        echo "\n  Checking role_permissions table directly:\n";
        $directPerms = \DB::table('role_permissions')->where('role', 'Pharmacy Admin')->get();
        if ($directPerms->isEmpty()) {
            echo "    (no entries in role_permissions table for 'Pharmacy Admin')\n";
        } else {
            foreach ($directPerms as $rp) {
                $perm = Permission::find($rp->permission_id);
                $permName = $perm ? $perm->name : 'unknown';
                echo "    RoleID:{$rp->role_id} -> PermissionID:{$rp->permission_id} ({$permName})\n";
            }
        }
    } else {
        echo "  Pharmacy Admin role not found!\n";
    }
    echo "\n";
    
    // Show all available permissions
    echo "All Available Permissions:\n";
    echo str_repeat('-', 50) . "\n";
    $allPerms = Permission::select('id', 'name', 'description')->get();
    if ($allPerms->isEmpty()) {
        echo "  (no permissions found in database)\n";
    } else {
        foreach ($allPerms as $perm) {
            echo "  ID {$perm->id}: {$perm->name}\n";
        }
    }
    echo "\n";
    
    echo "RECOMMENDED Pharmacy Admin Permissions:\n";
    echo str_repeat('-', 50) . "\n";
    $recommended = [
        'view-pharmacy',
        'create-medicines',
        'edit-medicines', 
        'view-medicines',
        'create-sales',
        'view-sales',
        'delete-medicines',
        'view-expired-medicines',
        'view-low-stock-medicines',
        'create-suppliers',
        'view-suppliers',
        'create-purchases',
        'view-purchases',
    ];
    foreach ($recommended as $permName) {
        $exists = Permission::where('name', $permName)->exists();
        $status = $exists ? '✓ exists' : '✗ missing';
        echo "  {$permName} - {$status}\n";
    }
    echo "\n";
    
    echo "Checking all users...\n\n";
    $users = User::select('id', 'name', 'username', 'role', 'role_id')->get();
    
    echo "All Users:\n";
    echo str_repeat('-', 80) . "\n";
    printf("%-5s %-20s %-20s %-15s %-10s\n", "ID", "Name", "Username", "Role", "Role ID");
    echo str_repeat('-', 80) . "\n";
    
    foreach ($users as $u) {
        printf("%-5d %-20s %-20s %-15s %-10s\n", 
            $u->id, 
            substr($u->name, 0, 20), 
            substr($u->username, 0, 20), 
            $u->role, 
            $u->role_id ?? 'null');
    }
    echo "\n";
    exit;
}

echo "Pharmacy User Found:\n";
echo str_repeat('-', 50) . "\n";
echo "ID:        " . $user->id . "\n";
echo "Name:      " . $user->name . "\n";
echo "Username:  " . $user->username . "\n";
echo "Role:      " . $user->role . "\n";
echo "Role ID:   " . ($user->role_id ?? 'null') . "\n";
echo "\n";

if ($user->role_id) {
    $role = Role::find($user->role_id);
    if ($role) {
        echo "Role Details:\n";
        echo str_repeat('-', 50) . "\n";
        echo "Role Name: " . $role->name . "\n";
        echo "Role ID:   " . $role->id . "\n";
        echo "\n";
        
        echo "Role Permissions (" . $role->permissions->count() . " total):\n";
        echo str_repeat('-', 50) . "\n";
        foreach ($role->permissions as $perm) {
            echo "  ✓ " . $perm->name . "\n";
        }
    } else {
        echo "WARNING: Role ID " . $user->role_id . " not found in roles table!\n";
    }
} else {
    echo "User has no role_id assigned.\n";
}

echo "\n";
echo "Direct User-Specific Permissions:\n";
echo str_repeat('-', 50) . "\n";
$directPerms = $user->userPermissions()->with('permission')->get();
if ($directPerms->isEmpty()) {
    echo "  (none - user inherits all permissions from role)\n";
} else {
    foreach ($directPerms as $up) {
        $status = $up->allowed ? '✓' : '✗';
        $permName = $up->permission ? $up->permission->name : 'unknown';
        echo "  {$status} {$permName} (allowed: " . ($up->allowed ? 'yes' : 'no') . ")\n";
    }
}

echo "\n";
echo "=== Check Complete ===\n";
