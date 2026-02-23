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
        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasIndex('appointments', 'idx_appointments_patient_date')) {
                $table->index(['patient_id', 'appointment_date'], 'idx_appointments_patient_date');
            }
            if (!Schema::hasIndex('appointments', 'idx_appointments_doctor_date')) {
                $table->index(['doctor_id', 'appointment_date'], 'idx_appointments_doctor_date');
            }
            if (!Schema::hasIndex('appointments', 'idx_appointments_dept_status')) {
                $table->index(['department_id', 'status'], 'idx_appointments_dept_status');
            }
            if (!Schema::hasIndex('appointments', 'idx_appointments_date')) {
                $table->index('appointment_date', 'idx_appointments_date');
            }
        });

        // Doctors table indexes
        Schema::table('doctors', function (Blueprint $table) {
            if (!Schema::hasIndex('doctors', 'idx_doctors_user')) {
                $table->index('user_id', 'idx_doctors_user');
            }
            if (!Schema::hasIndex('doctors', 'idx_doctors_dept')) {
                $table->index('department_id', 'idx_doctors_dept');
            }
            if (!Schema::hasIndex('doctors', 'idx_doctors_status')) {
                $table->index('status', 'idx_doctors_status');
            }
        });

        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasIndex('patients', 'idx_patients_user')) {
                $table->index('user_id', 'idx_patients_user');
            }
            if (!Schema::hasIndex('patients', 'idx_patients_name')) {
                $table->index('first_name', 'idx_patients_name');
            }
        });

        // Medicines table indexes
        Schema::table('medicines', function (Blueprint $table) {
            if (!Schema::hasIndex('medicines', 'idx_medicines_category')) {
                $table->index('category_id', 'idx_medicines_category');
            }
            if (!Schema::hasIndex('medicines', 'idx_medicines_expiry')) {
                $table->index('expiry_date', 'idx_medicines_expiry');
            }
            if (!Schema::hasIndex('medicines', 'idx_medicines_status')) {
                $table->index('status', 'idx_medicines_status');
            }
        });

        // Lab tests and results
        Schema::table('lab_test_results', function (Blueprint $table) {
            if (!Schema::hasIndex('lab_test_results', 'idx_lab_results_patient_date')) {
                $table->index(['patient_id', 'created_at'], 'idx_lab_results_patient_date');
            }
            if (!Schema::hasIndex('lab_test_results', 'idx_lab_results_test')) {
                $table->index('test_id', 'idx_lab_results_test');
            }
        });

        // Sales indexes
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasIndex('sales', 'idx_sales_patient')) {
                $table->index('patient_id', 'idx_sales_patient');
            }
            if (!Schema::hasIndex('sales', 'idx_sales_date')) {
                $table->index('created_at', 'idx_sales_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Skip dropping indexes with FK columns - they are required by FK constraints
            // patient_id FK from constrained() in 2026_01_01_211733_create_appointments_table.php
            // doctor_id FK from constrained() in 2026_01_01_211733_create_appointments_table.php
            // department_id FK from constrained() in 2026_01_01_211733_create_appointments_table.php
            if (Schema::hasIndex('appointments', 'idx_appointments_date')) {
                $table->dropIndex('idx_appointments_date');
            }
        });

        // Skip dropping bills indexes - they may be needed by foreign keys
        // from later migrations and will be handled there

        Schema::table('doctors', function (Blueprint $table) {
            // Skip dropping idx_doctors_user - it's required by the FK constraint
            // on user_id created in 2026_01_01_211650_create_doctors_table.php
            // Skip dropping idx_doctors_dept - it's required by the FK constraint
            // on department_id created in 2026_01_15_000001_add_foreign_key_constraint_to_doctors_table.php
            if (Schema::hasIndex('doctors', 'idx_doctors_status')) {
                $table->dropIndex('idx_doctors_status');
            }
        });

        Schema::table('patients', function (Blueprint $table) {
            // Skip dropping idx_patients_user - it's required by the FK constraint
            // on user_id created in 2026_01_01_211629_create_patients_table.php
            if (Schema::hasIndex('patients', 'idx_patients_name')) {
                $table->dropIndex('idx_patients_name');
            }
        });

        Schema::table('medicines', function (Blueprint $table) {
            // Skip dropping idx_medicines_category - it may be required by FK constraints
            if (Schema::hasIndex('medicines', 'idx_medicines_expiry')) {
                $table->dropIndex('idx_medicines_expiry');
            }
            if (Schema::hasIndex('medicines', 'idx_medicines_status')) {
                $table->dropIndex('idx_medicines_status');
            }
        });

        Schema::table('lab_test_results', function (Blueprint $table) {
            // Skip dropping idx_lab_results_patient_date - it may be required by FK constraints
            // Skip dropping idx_lab_results_test - it may be required by FK constraints
        });

    }
};
