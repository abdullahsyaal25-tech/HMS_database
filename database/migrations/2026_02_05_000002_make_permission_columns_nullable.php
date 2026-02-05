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
        Schema::table('permissions', function (Blueprint $table) {
            if (Schema::hasColumn('permissions', 'resource')) {
                $table->string('resource')->nullable()->change();
            }
            if (Schema::hasColumn('permissions', 'action')) {
                $table->string('action')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot easily revert column changes, so this is a one-way migration
        // In production, you would need to restore from backup
    }
};
