<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add missing columns to roles table
        Schema::table('roles', function (Blueprint $table) {
            if (!Schema::hasColumn('roles', 'mfa_required')) {
                $table->boolean('mfa_required')->default(false)->after('role_specific_limitations');
            }
            if (!Schema::hasColumn('roles', 'mfa_grace_period_days')) {
                $table->integer('mfa_grace_period_days')->nullable()->after('mfa_required');
            }
            if (!Schema::hasColumn('roles', 'session_timeout_minutes')) {
                $table->integer('session_timeout_minutes')->default(120)->after('mfa_grace_period_days');
            }
            if (!Schema::hasColumn('roles', 'concurrent_session_limit')) {
                $table->integer('concurrent_session_limit')->nullable()->after('session_timeout_minutes');
            }
            if (!Schema::hasColumn('roles', 'is_super_admin')) {
                $table->boolean('is_super_admin')->default(false)->after('concurrent_session_limit');
            }
        });

        // Add missing columns to permissions table
        Schema::table('permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('permissions', 'slug')) {
                $table->string('slug')->unique()->after('name');
            }
            if (!Schema::hasColumn('permissions', 'requires_mfa')) {
                $table->boolean('requires_mfa')->default(false)->after('slug');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn([
                'mfa_required',
                'mfa_grace_period_days',
                'session_timeout_minutes',
                'concurrent_session_limit',
                'is_super_admin',
            ]);
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn([
                'slug',
                'requires_mfa',
            ]);
        });
    }
};
