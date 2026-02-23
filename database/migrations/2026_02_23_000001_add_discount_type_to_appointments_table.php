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
        Schema::table('appointments', function (Blueprint $table) {
            // Add discount_type column to track whether discount is percentage or fixed amount
            if (!Schema::hasColumn('appointments', 'discount_type')) {
                $table->enum('discount_type', ['percentage', 'fixed'])->default('percentage')->after('discount');
            }
            
            // Add discount_fixed column to store fixed amount discount separately
            if (!Schema::hasColumn('appointments', 'discount_fixed')) {
                $table->decimal('discount_fixed', 10, 2)->default(0)->after('discount_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['discount_type', 'discount_fixed']);
        });
    }
};
