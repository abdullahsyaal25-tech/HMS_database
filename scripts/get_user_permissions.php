<?php

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\UserPermission;

if ($argc < 2) {
    echo "Usage: php get_user_permissions.php <user_id>\n";
    exit(1);
}

$userId = $argv[1];

if (!is_numeric($userId)) {
    echo "Error: User ID must be numeric\n";
    exit(1);
}

$user = User::find($userId);

if (!$user) {
    echo "Error: User with ID {$userId} not found\n";
    exit(1);
}

echo "Active permissions for user: {$user->name} (ID: {$user->id}, Role: {$user->role})\n\n";

$userPermissions = UserPermission::where('user_id', $userId)
    ->where('allowed', true)
    ->with('permission')
    ->get();

if ($userPermissions->isEmpty()) {
    echo "No active permissions assigned to this user.\n";
} else {
    echo "Active Permissions:\n";
    echo str_repeat('-', 50) . "\n";
    foreach ($userPermissions as $userPermission) {
        $permission = $userPermission->permission;
        echo sprintf("%-25s | %s\n", $permission->name, $permission->description);
        echo sprintf("  Resource: %s | Action: %s\n\n", $permission->resource, $permission->action);
    }
}