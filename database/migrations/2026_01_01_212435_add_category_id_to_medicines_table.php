<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Use raw SQL to safely drop FK if it exists (MySQL 8.0+ supports IF EXISTS)
        try {
            DB::statement('ALTER TABLE medicines DROP FOREIGN KEY IF EXISTS medicines_category_id_foreign');
        } catch (\Exception $e) {
            // FK doesn't exist, continue
        }
        
        // Also try the Laravel way as fallback
        try {
            Schema::table('medicines', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
            });
        } catch (\Exception $e) {
            // FK might not exist
        }
        
        Schema::table('medicines', function (Blueprint $table) {
            if (Schema::hasColumn('medicines', 'category_id')) {
                $table->dropColumn('category_id');
            }
        });
    }
};
