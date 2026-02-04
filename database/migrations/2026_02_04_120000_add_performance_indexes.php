<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds performance indexes for frequently queried columns
     * to improve query performance on large datasets.
     */
    public function up(): void
    {
        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            $table->index('patient_id')->comment('Index for patient ID lookups');
            $table->index(['user_id', 'created_at'])->comment('Composite index for user-related patient queries');
        });

        // Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            $table->index(['patient_id', 'payment_status'])->comment('Composite index for payment status filtering');
            $table->index('bill_number')->comment('Index for bill number lookups');
            $table->index(['created_by', 'created_at'])->comment('Composite index for creator-based queries');
        });

        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            $table->index(['patient_id', 'appointment_date'])->comment('Composite index for patient appointment history');
            $table->index(['doctor_id', 'status'])->comment('Composite index for doctor schedule and status queries');
        });

        // Audit logs indexes
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['user_id', 'action'])->comment('Composite index for user action filtering');
            $table->index('logged_at')->comment('Index for time-based audit log queries');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes for patients table
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['patients_patient_id_index']);
            $table->dropIndex(['patients_user_id_created_at_index']);
        });

        // Drop indexes for bills table
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['bills_patient_id_payment_status_index']);
            $table->dropIndex(['bills_bill_number_index']);
            $table->dropIndex(['bills_created_by_created_at_index']);
        });

        // Drop indexes for appointments table
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex(['appointments_patient_id_appointment_date_index']);
            $table->dropIndex(['appointments_doctor_id_status_index']);
        });

        // Drop indexes for audit_logs table
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['audit_logs_user_id_action_index']);
            $table->dropIndex(['audit_logs_logged_at_index']);
        });
    }
};
