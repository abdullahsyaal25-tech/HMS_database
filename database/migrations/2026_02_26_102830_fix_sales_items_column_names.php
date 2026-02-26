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
        Schema::table('sales_items', function (Blueprint $table) {
            // Add sale_price column if it doesn't exist
            if (!Schema::hasColumn('sales_items', 'sale_price')) {
                $table->decimal('sale_price', 12, 2)->nullable()->after('medicine_id');
            }
        });

        // Copy data from unit_price to sale_price if unit_price exists
        if (Schema::hasColumn('sales_items', 'unit_price')) {
            DB::statement('UPDATE sales_items SET sale_price = unit_price WHERE sale_price IS NULL');
        }

        Schema::table('sales_items', function (Blueprint $table) {
            // Remove unit_price column if it exists
            if (Schema::hasColumn('sales_items', 'unit_price')) {
                $table->dropColumn('unit_price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_items', function (Blueprint $table) {
            // Add unit_price column back
            if (!Schema::hasColumn('sales_items', 'unit_price')) {
                $table->decimal('unit_price', 12, 2)->nullable()->after('medicine_id');
            }
        });

        // Copy data from sale_price to unit_price if sale_price exists
        if (Schema::hasColumn('sales_items', 'sale_price')) {
            DB::statement('UPDATE sales_items SET unit_price = sale_price WHERE unit_price IS NULL');
        }

        Schema::table('sales_items', function (Blueprint $table) {
            // Remove sale_price column
            if (Schema::hasColumn('sales_items', 'sale_price')) {
                $table->dropColumn('sale_price');
            }
        });
    }
};