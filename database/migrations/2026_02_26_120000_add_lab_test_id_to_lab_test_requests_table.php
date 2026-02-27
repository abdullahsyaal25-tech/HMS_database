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
        Schema::table('lab_test_requests', function (Blueprint $table) {
            // Add foreign key to lab_tests table
            $table->foreignId('lab_test_id')
                ->nullable()
                ->constrained('lab_tests')
                ->onDelete('set null')
                ->after('test_name');
            
            // Add cost field that can be overridden per request
            $table->decimal('cost', 8, 2)->nullable()->after('lab_test_id');
            
            // Add turnaround time in hours
            $table->integer('turnaround_hours')->nullable()->after('cost');
            
            // Add index for faster lookups
            $table->index('lab_test_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            $table->dropForeign(['lab_test_id']);
            $table->dropColumn(['lab_test_id', 'cost', 'turnaround_hours']);
        });
    }
};
