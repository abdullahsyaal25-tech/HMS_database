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
        Schema::table('sales_items', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_items', 'discount')) {
                $table->decimal('discount', 8, 2)->default(0.00)->after('total_price');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_items', function (Blueprint $table) {
            if (Schema::hasColumn('sales_items', 'discount')) {
                $table->dropColumn('discount');
            }
        });
    }
};
