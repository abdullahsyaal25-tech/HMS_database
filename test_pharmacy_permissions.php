<?php

/**
 * Test Pharmacy Permissions Script
 * 
 * This script queries the database to find the Pharmacy role and displays
 * all permissions assigned to it from both the new role_permission_mappings
 * table and the legacy role_permissions table.
 * 
 * Usage:
 *   php test_pharmacy_permissions.php
 *   or
 *   php artisan test:pharmacy-permissions
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

echo "=========================================\n";
echo "   PHARMACY ROLE PERMISSIONS TEST\n";
echo "=========================================\n\n";

// Find the Pharmacy role(s)
$pharmacyRoles = Role::where('name', 'like', '%Pharmacy%')
    ->orWhere('slug', 'like', '%pharmacy%')
    ->orWhere('name', 'like', '%Pharmacist%')
    ->get();

if ($pharmacyRoles->isEmpty()) {
    echo "❌ No Pharmacy role found in the database.\n";
    echo "   Searching for roles containing 'Pharmacy' or 'pharmacist'...\n\n";
    
    // Show all available roles
    $allRoles = Role::all();
    echo "Available roles in the system:\n";
    foreach ($allRoles as $role) {
        echo "   - {$role->name} (slug: {$role->slug}, id: {$role->id})\n";
    }
    exit(1);
}

foreach ($pharmacyRoles as $role) {
    echo "=========================================\n";
    echo "Role: {$role->name}\n";
    echo "Slug: {$role->slug}\n";
    echo "ID: {$role->id}\n";
    echo "Description: " . ($role->description ?? 'N/A') . "\n";
    echo "Priority: " . ($role->priority ?? 'N/A') . "\n";
    echo "=========================================\n\n";
    
    // ========================================
    // NEW NORMALIZED TABLE: role_permission_mappings
    // ========================================
    echo "━━━ NEW TABLE: role_permission_mappings ━━━\n";
    
    $normalizedPermissions = DB::table('role_permission_mappings')
        ->where('role_id', $role->id)
        ->join('permissions', 'role_permission_mappings.permission_id', '=', 'permissions.id')
        ->select('permissions.*')
        ->get();
    
    if ($normalizedPermissions->isEmpty()) {
        echo "  No permissions found in role_permission_mappings table.\n\n";
    } else {
        echo "  Found {$normalizedPermissions->count()} permission(s):\n\n";
        
        // Group by category
        $grouped = $normalizedPermissions->groupBy('category');
        foreach ($grouped as $category => $permissions) {
            echo "  📁 {$category}\n";
            foreach ($permissions as $perm) {
                echo "     ├── {$perm->name}\n";
                echo "     │      Slug: {$perm->slug}\n";
                echo "     │      Description: {$perm->description}\n";
                echo "     │      Module: {$perm->module}\n";
                echo "     │      Risk Level: {$perm->risk_level}\n";
                echo "     │\n";
            }
        }
    }
    
    // ========================================
    // LEGACY TABLE: role_permissions
    // ========================================
    echo "\n━━━ LEGACY TABLE: role_permissions ━━━\n";
    
    $legacyPermissions = DB::table('role_permissions')
        ->where('role', $role->name)
        ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        ->select('permissions.*')
        ->get();
    
    if ($legacyPermissions->isEmpty()) {
        echo "  No permissions found in role_permissions table.\n\n";
    } else {
        echo "  Found {$legacyPermissions->count()} permission(s):\n\n";
        
        // Group by category
        $grouped = $legacyPermissions->groupBy('category');
        foreach ($grouped as $category => $permissions) {
            echo "  📁 {$category}\n";
            foreach ($permissions as $perm) {
                echo "     ├── {$perm->name}\n";
                echo "     │      Slug: {$perm->slug}\n";
                echo "     │      Description: {$perm->description}\n";
                echo "     │      Module: {$perm->module}\n";
                echo "     │      Risk Level: {$perm->risk_level}\n";
                echo "     │\n";
            }
        }
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "  SUMMARY FOR: {$role->name}\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "  Total from role_permission_mappings: {$normalizedPermissions->count()}\n";
    echo "  Total from role_permissions: {$legacyPermissions->count()}\n";
    echo "  Combined unique permissions: " . $normalizedPermissions->merge($legacyPermissions)->unique('id')->count() . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
}

// Check for all Pharmacy-related permissions in the system
echo "━━━ ALL PHARMACY-RELATED PERMISSIONS IN SYSTEM ━━━\n\n";

$allPharmacyPermissions = Permission::where('module', 'like', '%Pharmacy%')
    ->orWhere('category', 'like', '%Pharmacy%')
    ->orWhere('name', 'like', '%pharmacy%')
    ->orWhere('name', 'like', '%medicine%')
    ->orWhere('name', 'like', '%prescription%')
    ->orWhere('resource', 'like', '%pharmacy%')
    ->orWhere('resource', 'like', '%medicine%')
    ->get();

if ($allPharmacyPermissions->isEmpty()) {
    echo "  No pharmacy-related permissions found in the permissions table.\n";
} else {
    echo "  Found {$allPharmacyPermissions->count()} pharmacy-related permission(s) in the system:\n\n";
    
    $grouped = $allPharmacyPermissions->groupBy('category');
    foreach ($grouped as $category => $permissions) {
        echo "  📁 {$category}\n";
        foreach ($permissions as $perm) {
            echo "     ├── {$perm->name}\n";
            echo "     │      Module: {$perm->module}\n";
            echo "     │\n";
        }
    }
}

echo "\n=========================================\n";
echo "   TEST COMPLETE\n";
echo "=========================================\n";
