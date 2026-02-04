<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds additional performance indexes for frequently queried columns
     * to improve query performance on large datasets. Uses index existence checks
     * to avoid duplicates.
     */
    public function up(): void
    {
        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            if (!$this->indexExists('patients', 'idx_patients_patient_id')) {
                $table->index('patient_id', 'idx_patients_patient_id')->comment('Index for patient ID lookups');
            }
            if (!$this->indexExists('patients', 'idx_patients_user_created')) {
                $table->index(['user_id', 'created_at'], 'idx_patients_user_created')->comment('Composite index for user-related patient queries');
            }
        });

        // Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            if (!$this->indexExists('bills', 'idx_bills_patient_status')) {
                $table->index(['patient_id', 'payment_status'], 'idx_bills_patient_status')->comment('Composite index for payment status filtering');
            }
            if (!$this->indexExists('bills', 'idx_bills_bill_number')) {
                $table->index('bill_number', 'idx_bills_bill_number')->comment('Index for bill number lookups');
            }
            if (!$this->indexExists('bills', 'idx_bills_creator_created')) {
                $table->index(['created_by', 'created_at'], 'idx_bills_creator_created')->comment('Composite index for creator-based queries');
            }
        });

        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            if (!$this->indexExists('appointments', 'idx_appts_patient_date')) {
                $table->index(['patient_id', 'appointment_date'], 'idx_appts_patient_date')->comment('Composite index for patient appointment history');
            }
            if (!$this->indexExists('appointments', 'idx_appts_doctor_status')) {
                $table->index(['doctor_id', 'status'], 'idx_appts_doctor_status')->comment('Composite index for doctor schedule and status queries');
            }
        });

        // Audit logs indexes
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!$this->indexExists('audit_logs', 'idx_audit_user_action')) {
                $table->index(['user_id', 'action'], 'idx_audit_user_action')->comment('Composite index for user action filtering');
            }
            if (!$this->indexExists('audit_logs', 'idx_audit_logged_at')) {
                $table->index('logged_at', 'idx_audit_logged_at')->comment('Index for time-based audit log queries');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes for patients table
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex('idx_patients_patient_id');
            $table->dropIndex('idx_patients_user_created');
        });

        // Drop indexes for bills table
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('idx_bills_patient_status');
            $table->dropIndex('idx_bills_bill_number');
            $table->dropIndex('idx_bills_creator_created');
        });

        // Drop indexes for appointments table
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appts_patient_date');
            $table->dropIndex('idx_appts_doctor_status');
        });

        // Drop indexes for audit_logs table
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_user_action');
            $table->dropIndex('idx_audit_logged_at');
        });
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("
            SELECT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND INDEX_NAME = ?
        ", [$table, $indexName]);

        return !empty($indexes);
    }
};
