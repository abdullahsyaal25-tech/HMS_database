<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates medical_records table - a core HMS entity that was missing.
     */
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_number')->unique();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');
            $table->unsignedBigInteger('appointment_id')->nullable();
            $table->date('visit_date');
            $table->text('chief_complaint')->nullable();
            $table->text('present_illness')->nullable();
            $table->text('past_medical_history')->nullable();
            $table->text('family_history')->nullable();
            $table->text('physical_examination')->nullable();
            $table->text('diagnosis');
            $table->text('treatment_plan')->nullable();
            $table->text('prescription')->nullable();
            $table->text('notes')->nullable();
            $table->string('vital_signs_bp')->nullable(); // Blood Pressure
            $table->decimal('vital_signs_temp', 4, 1)->nullable(); // Temperature
            $table->integer('vital_signs_pulse')->nullable(); // Pulse Rate
            $table->integer('vital_signs_resp')->nullable(); // Respiratory Rate
            $table->decimal('vital_signs_weight', 5, 2)->nullable(); // Weight in kg
            $table->decimal('vital_signs_height', 5, 2)->nullable(); // Height in cm
            $table->enum('status', ['draft', 'finalized', 'amended'])->default('draft');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');
            $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('cascade');
            $table->foreign('appointment_id')->references('id')->on('appointments')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');

            // Indexes for common queries
            $table->index(['patient_id', 'visit_date'], 'idx_medical_records_patient_date');
            $table->index(['doctor_id', 'visit_date'], 'idx_medical_records_doctor_date');
            $table->index('visit_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};
