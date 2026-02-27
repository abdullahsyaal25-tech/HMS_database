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
        Schema::table('daily_snapshots', function (Blueprint $table) {
            // Only add departments_revenue - other columns already exist in the table
            if (!Schema::hasColumn('daily_snapshots', 'departments_revenue')) {
                $table->decimal('departments_revenue', 12, 2)->default(0)->after('laboratory_revenue');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_snapshots', function (Blueprint $table) {
            $table->dropColumn(['departments_revenue']);
        });
    }
};
