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
        $this->safeDropIndex('patients', 'idx_patients_patient_id');
        $this->safeDropIndex('patients', 'idx_patients_user_created');

        // Drop indexes for bills table
        $this->safeDropIndex('bills', 'idx_bills_patient_status');
        $this->safeDropIndex('bills', 'idx_bills_bill_number');
        $this->safeDropIndex('bills', 'idx_bills_creator_created');

        // Drop indexes for appointments table
        $this->safeDropIndex('appointments', 'idx_appts_patient_date');
        $this->safeDropIndex('appointments', 'idx_appts_doctor_status');

        // Drop indexes for audit_logs table
        $this->safeDropIndex('audit_logs', 'idx_audit_user_action');
        $this->safeDropIndex('audit_logs', 'idx_audit_logged_at');
    }

    /**
     * Safely drop an index if it exists and is not needed by foreign keys
     */
    private function safeDropIndex(string $table, string $indexName): void
    {
        if (!Schema::hasIndex($table, $indexName)) {
            return;
        }

        try {
            Schema::table($table, function (Blueprint $table) use ($indexName) {
                $table->dropIndex($indexName);
            });
        } catch (\Exception $e) {
            // Index may be needed by a foreign key constraint - ignore error
        }
    }

    /**
     * Check if an index exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        return Schema::hasIndex($table, $indexName);
    }
};
