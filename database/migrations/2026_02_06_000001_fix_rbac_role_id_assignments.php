<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration fixes the RBAC role_id assignment issues by:
     * 1. Updating all existing users to have proper role_id values
     * 2. Creating indexes to speed up role lookups
     */
    public function up(): void
    {
        // Get all roles indexed by name
        $roles = Role::pluck('id', 'name')->toArray();
        
        $defaultRoleId = $roles['Staff'] ?? 1; // Default to Staff if not found
        
        // Update users that have role string but no role_id
        $usersToUpdate = DB::table('users')
            ->whereNull('role_id')
            ->whereNotNull('role')
            ->get();
        
        $updated = 0;
        foreach ($usersToUpdate as $user) {
            $roleName = $user->role;
            
            // Try to find matching role by name or slug
            $roleId = null;
            
            if (isset($roles[$roleName])) {
                $roleId = $roles[$roleName];
            } else {
                // Try to find by slug
                $slug = strtolower(str_replace(' ', '-', $roleName));
                $roleBySlug = Role::where('slug', $slug)->first();
                if ($roleBySlug) {
                    $roleId = $roleBySlug->id;
                }
            }
            
            // If no matching role found, assign default
            if (!$roleId) {
                $roleId = $defaultRoleId;
            }
            
            DB::table('users')
                ->where('id', $user->id)
                ->update(['role_id' => $roleId]);
            
            $updated++;
        }
        
        // Log the update
        \Illuminate\Support\Facades\Log::info("RBAC Migration: Updated {$updated} users with role_id");
        
        // Add unique index on users.username (if not exists)
        Schema::table('users', function (Blueprint $table) {
            if (!\Illuminate\Support\Facades\Schema::hasIndex('users', 'users_username_unique')) {
                $table->unique('username');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op - we don't want to lose the role_id assignments
    }
};
