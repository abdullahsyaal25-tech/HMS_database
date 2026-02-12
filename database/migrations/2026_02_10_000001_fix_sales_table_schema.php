<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Rename invoice_number to sale_id
            if (Schema::hasColumn('sales', 'invoice_number')) {
                $table->renameColumn('invoice_number', 'sale_id');
            }

            // Make patient_id nullable (for walk-in customers)
            $table->dropForeign(['patient_id']);
            $table->unsignedBigInteger('patient_id')->nullable()->change();
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');

            // Add payment_method column
            if (!Schema::hasColumn('sales', 'payment_method')) {
                $table->enum('payment_method', ['cash', 'card', 'insurance', 'credit'])->default('cash')->after('payment_status');
            }

            // Add prescription_id column (nullable) - only if prescriptions table exists
            if (!Schema::hasColumn('sales', 'prescription_id') && Schema::hasTable('prescriptions')) {
                $table->foreignId('prescription_id')->nullable()->after('patient_id')->constrained()->onDelete('cascade');
            } elseif (!Schema::hasColumn('sales', 'prescription_id')) {
                $table->unsignedBigInteger('prescription_id')->nullable()->after('patient_id');
            }

            // Add void tracking columns
            if (!Schema::hasColumn('sales', 'void_reason')) {
                $table->text('void_reason')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('sales', 'voided_by')) {
                $table->foreignId('voided_by')->nullable()->after('void_reason')->constrained('users')->onDelete('cascade');
            }
            if (!Schema::hasColumn('sales', 'voided_at')) {
                $table->timestamp('voided_at')->nullable()->after('voided_by');
            }

            // Add is_prescription_sale flag
            if (!Schema::hasColumn('sales', 'is_prescription_sale')) {
                $table->boolean('is_prescription_sale')->default(false)->after('voided_at');
            }
        });

        // Update status enum to allow more values (MySQL only)
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled', 'refunded') DEFAULT 'completed'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'sale_id')) {
                $table->renameColumn('sale_id', 'invoice_number');
            }

            // Drop foreign keys safely
            $this->safeDropForeignKey('sales', 'patient_id');
            $table->unsignedBigInteger('patient_id')->nullable(false)->change();
            $table->foreign('patient_id')->references('id')->on('patients')->onDelete('cascade');

            if (Schema::hasColumn('sales', 'payment_method')) {
                $table->dropColumn('payment_method');
            }

            if (Schema::hasColumn('sales', 'prescription_id')) {
                $this->safeDropForeignKey('sales', 'prescription_id');
                $table->dropColumn('prescription_id');
            }

            if (Schema::hasColumn('sales', 'void_reason')) {
                $table->dropColumn('void_reason');
            }

            if (Schema::hasColumn('sales', 'voided_by')) {
                $this->safeDropForeignKey('sales', 'voided_by');
                $table->dropColumn('voided_by');
            }

            if (Schema::hasColumn('sales', 'voided_at')) {
                $table->dropColumn('voided_at');
            }

            if (Schema::hasColumn('sales', 'is_prescription_sale')) {
                $table->dropColumn('is_prescription_sale');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('active', 'cancelled') DEFAULT 'active'");
        }
    }

    /**
     * Safely drop a foreign key if it exists
     */
    private function safeDropForeignKey(string $table, string $column): void
    {
        try {
            $foreignKeys = $this->getForeignKeys($table);
            $foreignKeyName = $table . '_' . $column . '_foreign';
            
            if (in_array($foreignKeyName, $foreignKeys)) {
                Schema::table($table, function (Blueprint $table) use ($column) {
                    $table->dropForeign([$column]);
                });
            }
        } catch (\Exception $e) {
            // Foreign key doesn't exist or other error - ignore
        }
    }

    /**
     * Get list of foreign key names for a table
     */
    private function getForeignKeys(string $table): array
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'mysql') {
            $results = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = ? 
                AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            ", [$table]);
        } elseif ($driver === 'sqlite') {
            $results = DB::select("PRAGMA foreign_key_list($table)");
            return array_map(fn($r) => 'fk_' . $r->table . '_' . $r->from, $results);
        } else {
            return [];
        }
        
        return array_map(fn($r) => $r->CONSTRAINT_NAME, $results);
    }
};
