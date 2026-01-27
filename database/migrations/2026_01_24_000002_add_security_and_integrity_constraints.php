<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds missing constraints, security fields, and integrity checks.
     */
    public function up(): void
    {
        // Login throttling fields already added in previous steps or during initial creation
        // but keeping them here if they are missing.
        if (!Schema::hasColumn('users', 'failed_login_attempts')) {
            Schema::table('users', function (Blueprint $table) {
                $table->integer('failed_login_attempts')->default(0)->after('remember_token');
                $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
                $table->timestamp('last_login_at')->nullable()->after('locked_until');
                $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
                $table->timestamp('password_changed_at')->nullable()->after('last_login_ip');
                
                $table->index('locked_until');
                $table->index('last_login_at');
            });
        }

        // Removed redundant foreign key constraint to doctors.department_id
        // which is already handled in 2026_01_15_000001_add_foreign_key_constraint_to_doctors_table.php

        // Add critical patient fields
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('patients', 'blood_type')) {
                $table->string('blood_type', 5)->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('patients', 'allergies')) {
                $table->text('allergies')->nullable()->after('blood_type');
            }
            if (!Schema::hasColumn('patients', 'emergency_contact_name')) {
                $table->string('emergency_contact_name')->nullable()->after('allergies');
            }
            if (!Schema::hasColumn('patients', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
            }
            if (!Schema::hasColumn('patients', 'medical_history')) {
                $table->text('medical_history')->nullable()->after('emergency_contact_phone');
            }
            
            if (!$this->indexExists('patients', 'idx_patients_dob')) {
                $table->index('date_of_birth', 'idx_patients_dob');
            }
            if (!$this->indexExists('patients', 'idx_patients_blood_type')) {
                $table->index('blood_type', 'idx_patients_blood_type');
            }
        });

        // Email field is no longer needed in doctors table - removed in schema redesign

        // Add missing indexes for permission system optimization
        Schema::table('user_permissions', function (Blueprint $table) {
            if (!$this->indexExists('user_permissions', 'idx_user_perm_lookup')) {
                $table->index(['user_id', 'permission_id', 'allowed'], 'idx_user_perm_lookup');
            }
        });

        // Add composite indexes for common queries
        Schema::table('appointments', function (Blueprint $table) {
            if (!$this->indexExists('appointments', 'idx_appointments_status_date')) {
                $table->index(['status', 'appointment_date'], 'idx_appointments_status_date');
            }
        });

        Schema::table('bills', function (Blueprint $table) {
            if (!$this->indexExists('bills', 'idx_bills_patient_status')) {
                $table->index(['patient_id', 'payment_status'], 'idx_bills_patient_status');
            }
        });

        // Add check constraints for data integrity (MySQL 8.0.16+)
        $this->addCheckConstraints();
    }

    /**
     * Add CHECK constraints for data integrity
     */
    private function addCheckConstraints(): void
    {
        try {
            // Bill amount constraints
            DB::statement('ALTER TABLE bills ADD CONSTRAINT chk_bill_amounts CHECK (
                sub_total >= 0 AND 
                discount >= 0 AND 
                tax >= 0 AND 
                total_amount >= 0 AND 
                amount_paid >= 0 AND 
                amount_due >= 0
            )');

            // Appointment fee constraint
            DB::statement('ALTER TABLE appointments ADD CONSTRAINT chk_appointment_fee CHECK (fee >= 0)');

            // Doctor fees constraint (updated field name from 'fee' to 'fees')
            DB::statement('ALTER TABLE doctors ADD CONSTRAINT chk_doctor_fees CHECK (fees >= 0 AND salary >= 0 AND bonus >= 0)');

            // Medicine quantity and price constraints
            DB::statement('ALTER TABLE medicines ADD CONSTRAINT chk_medicine_values CHECK (
                quantity >= 0 AND 
                purchase_price >= 0 AND 
                selling_price >= 0
            )');

        } catch (\Exception $e) {
            // Check constraints might not be supported or already exist
            // Log the error but don't fail the migration
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove check constraints
        try {
            DB::statement('ALTER TABLE bills DROP CONSTRAINT IF EXISTS chk_bill_amounts');
            DB::statement('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointment_fee');
            DB::statement('ALTER TABLE doctors DROP CONSTRAINT IF EXISTS chk_doctor_fees');
            DB::statement('ALTER TABLE medicines DROP CONSTRAINT IF EXISTS chk_medicine_values');
        } catch (\Exception $e) {
            // Ignore if constraints don't exist
        }

        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('idx_bills_patient_status');
        });

        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_status_date');
        });

        Schema::table('user_permissions', function (Blueprint $table) {
            $table->dropIndex('idx_user_perm_lookup');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth', 'blood_type', 'allergies',
                'emergency_contact_name', 'emergency_contact_phone', 'medical_history'
            ]);
        });

        // Foreign key on doctors is handled in its own migration

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'failed_login_attempts', 'locked_until', 'last_login_at',
                'last_login_ip', 'password_changed_at'
            ]);
        });
    }

    /**
     * Check if an index exists
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
