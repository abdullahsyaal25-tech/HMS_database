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
        Schema::table('medicines', function (Blueprint $table) {
            $table->decimal('stock_quantity', 10, 2)->nullable()->after('quantity');
            $table->decimal('reorder_level', 10, 2)->nullable()->after('stock_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('medicines', 'stock_quantity')) {
                $columnsToDrop[] = 'stock_quantity';
            }
            if (Schema::hasColumn('medicines', 'reorder_level')) {
                $columnsToDrop[] = 'reorder_level';
            }
            if (count($columnsToDrop) > 0) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
