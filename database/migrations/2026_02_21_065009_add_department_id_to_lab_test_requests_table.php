<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add department_id foreign key to lab_test_requests table for
     * Lab Test Request to Department relationship feature.
     */
    public function up(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            // Add nullable department_id foreign key
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('set null')
                ->after('doctor_id');

            // Add composite index for department_id and status
            $table->index(['department_id', 'status'], 'lab_test_requests_dept_status_idx');

            // Add composite index for department_id and created_at
            $table->index(['department_id', 'created_at'], 'lab_test_requests_dept_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Check if column exists before trying to drop
        if (!Schema::hasColumn('lab_test_requests', 'department_id')) {
            return; // Column doesn't exist, nothing to do
        }

        // Disable foreign key checks temporarily
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0');
        
        try {
            // Get the actual foreign key name from the database
            $foreignKeys = \Illuminate\Support\Facades\DB::select(
                "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                 WHERE TABLE_NAME = 'lab_test_requests' 
                 AND COLUMN_NAME = 'department_id' 
                 AND TABLE_SCHEMA = DATABASE()"
            );
            
            // Drop any foreign key constraints found
            foreach ($foreignKeys as $fk) {
                try {
                    \Illuminate\Support\Facades\DB::statement(
                        "ALTER TABLE lab_test_requests DROP FOREIGN KEY {$fk->CONSTRAINT_NAME}"
                    );
                } catch (\Exception $e) {
                    // Continue even if drop fails
                }
            }

            // Drop the indexes
            try {
                \Illuminate\Support\Facades\DB::statement(
                    'ALTER TABLE lab_test_requests DROP INDEX lab_test_requests_dept_status_idx'
                );
            } catch (\Exception $e) {
                // Index might not exist
            }

            try {
                \Illuminate\Support\Facades\DB::statement(
                    'ALTER TABLE lab_test_requests DROP INDEX lab_test_requests_dept_created_idx'
                );
            } catch (\Exception $e) {
                // Index might not exist
            }

            // Drop the column
            Schema::table('lab_test_requests', function (Blueprint $table) {
                $table->dropColumn('department_id');
            });
        } finally {
            // Always re-enable foreign key checks
            \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }
};
