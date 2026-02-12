<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add index on patients.phone for faster lookups
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasIndex('patients', 'idx_patients_phone')) {
                $table->index('phone', 'idx_patients_phone');
            }
        });
        
        // Add index on medicines.name for faster search
        Schema::table('medicines', function (Blueprint $table) {
            if (!Schema::hasIndex('medicines', 'idx_medicines_name')) {
                $table->index('name', 'idx_medicines_name');
            }
        });
        
        // Add index on appointments.patient_id for patient history queries
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasIndex('appointments', 'idx_appointments_patient_id')) {
                $table->index('patient_id', 'idx_appointments_patient_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasIndex('patients', 'idx_patients_phone')) {
                $table->dropIndex('idx_patients_phone');
            }
        });
        
        Schema::table('medicines', function (Blueprint $table) {
            if (Schema::hasIndex('medicines', 'idx_medicines_name')) {
                $table->dropIndex('idx_medicines_name');
            }
        });
        
        Schema::table('appointments', function (Blueprint $table) {
            // Skip dropping idx_appointments_patient_id - it's needed by the FK constraint
            // on patient_id from constrained() in 2026_01_01_211733_create_appointments_table.php
        });
    }
};
