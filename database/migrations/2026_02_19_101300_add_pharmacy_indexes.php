<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds indexes to improve query performance for the pharmacy module.
     */
    public function up(): void
    {
        // Helper function to check if index exists
        $indexExists = function($table, $index) {
            $indexes = \Illuminate\Support\Facades\DB::select(
                "SHOW INDEX FROM {$table} WHERE Key_name = ?", [$index]
            );
            return count($indexes) > 0;
        };

        // Add indexes to medicines table
        Schema::table('medicines', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('medicines', 'medicines_medicine_id_index')) {
                $table->index('medicine_id', 'medicines_medicine_id_index');
            }
            if (!$indexExists('medicines', 'medicines_category_id_index')) {
                $table->index('category_id', 'medicines_category_id_index');
            }
            if (!$indexExists('medicines', 'medicines_expiry_date_index')) {
                $table->index('expiry_date', 'medicines_expiry_date_index');
            }
            if (!$indexExists('medicines', 'medicines_stock_quantity_index')) {
                $table->index('stock_quantity', 'medicines_stock_quantity_index');
            }
            if (!$indexExists('medicines', 'medicines_stock_reorder_index')) {
                $table->index(['stock_quantity', 'reorder_level'], 'medicines_stock_reorder_index');
            }
            if (!$indexExists('medicines', 'medicines_batch_number_index')) {
                $table->index('batch_number', 'medicines_batch_number_index');
            }
            if (!$indexExists('medicines', 'medicines_manufacturer_index')) {
                $table->index('manufacturer', 'medicines_manufacturer_index');
            }
            if (!$indexExists('medicines', 'medicines_status_index')) {
                $table->index('status', 'medicines_status_index');
            }
            if (!$indexExists('medicines', 'medicines_stock_expiry_index')) {
                $table->index(['stock_quantity', 'expiry_date'], 'medicines_stock_expiry_index');
            }
        });

        // Add indexes to sales table
        Schema::table('sales', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('sales', 'sales_sale_id_index')) {
                $table->index('sale_id', 'sales_sale_id_index');
            }
            if (!$indexExists('sales', 'sales_patient_id_index')) {
                $table->index('patient_id', 'sales_patient_id_index');
            }
            if (!$indexExists('sales', 'sales_sold_by_index')) {
                $table->index('sold_by', 'sales_sold_by_index');
            }
            if (!$indexExists('sales', 'sales_status_index')) {
                $table->index('status', 'sales_status_index');
            }
            if (!$indexExists('sales', 'sales_payment_method_index')) {
                $table->index('payment_method', 'sales_payment_method_index');
            }
            if (!$indexExists('sales', 'sales_created_at_index')) {
                $table->index('created_at', 'sales_created_at_index');
            }
            if (!$indexExists('sales', 'sales_status_date_index')) {
                $table->index(['status', 'created_at'], 'sales_status_date_index');
            }
            if (!$indexExists('sales', 'sales_patient_date_index')) {
                $table->index(['patient_id', 'created_at'], 'sales_patient_date_index');
            }
        });

        // Add indexes to sales_items table
        Schema::table('sales_items', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('sales_items', 'sales_items_sale_id_index')) {
                $table->index('sale_id', 'sales_items_sale_id_index');
            }
            if (!$indexExists('sales_items', 'sales_items_medicine_id_index')) {
                $table->index('medicine_id', 'sales_items_medicine_id_index');
            }
            if (!$indexExists('sales_items', 'sales_items_medicine_date_index')) {
                $table->index(['medicine_id', 'created_at'], 'sales_items_medicine_date_index');
            }
        });

        // Add indexes to stock_movements table
        Schema::table('stock_movements', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('stock_movements', 'stock_movements_medicine_id_index')) {
                $table->index('medicine_id', 'stock_movements_medicine_id_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_type_index')) {
                $table->index('type', 'stock_movements_type_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_reference_type_index')) {
                $table->index('reference_type', 'stock_movements_reference_type_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_user_id_index')) {
                $table->index('user_id', 'stock_movements_user_id_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_created_at_index')) {
                $table->index('created_at', 'stock_movements_created_at_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_medicine_date_index')) {
                $table->index(['medicine_id', 'created_at'], 'stock_movements_medicine_date_index');
            }
            if (!$indexExists('stock_movements', 'stock_movements_reference_index')) {
                $table->index(['reference_type', 'reference_id'], 'stock_movements_reference_index');
            }
        });

        // Add indexes to medicine_alerts table
        Schema::table('medicine_alerts', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('medicine_alerts', 'medicine_alerts_medicine_id_index')) {
                $table->index('medicine_id', 'medicine_alerts_medicine_id_index');
            }
            if (!$indexExists('medicine_alerts', 'medicine_alerts_alert_type_index')) {
                $table->index('alert_type', 'medicine_alerts_alert_type_index');
            }
            if (!$indexExists('medicine_alerts', 'medicine_alerts_status_index')) {
                $table->index('status', 'medicine_alerts_status_index');
            }
            if (!$indexExists('medicine_alerts', 'medicine_alerts_priority_index')) {
                $table->index('priority', 'medicine_alerts_priority_index');
            }
            if (!$indexExists('medicine_alerts', 'medicine_alerts_triggered_at_index')) {
                $table->index('triggered_at', 'medicine_alerts_triggered_at_index');
            }
            if (!$indexExists('medicine_alerts', 'medicine_alerts_status_priority_index')) {
                $table->index(['status', 'priority'], 'medicine_alerts_status_priority_index');
            }
        });

        // Add indexes to medicine_categories table
        Schema::table('medicine_categories', function (Blueprint $table) use ($indexExists) {
            if (!$indexExists('medicine_categories', 'medicine_categories_name_index')) {
                $table->index('name', 'medicine_categories_name_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Use raw SQL with error suppression to handle indexes that may not exist
        // or may be in use by foreign key constraints
        
        $tables = [
            'medicines' => [
                'medicines_medicine_id_index',
                'medicines_category_id_index',
                'medicines_expiry_date_index',
                'medicines_stock_quantity_index',
                'medicines_stock_reorder_index',
                'medicines_batch_number_index',
                'medicines_manufacturer_index',
                'medicines_status_index',
                'medicines_stock_expiry_index',
            ],
            'sales' => [
                'sales_sale_id_index',
                'sales_patient_id_index',
                'sales_sold_by_index',
                'sales_status_index',
                'sales_payment_method_index',
                'sales_created_at_index',
                'sales_status_date_index',
                'sales_patient_date_index',
            ],
            'sales_items' => [
                'sales_items_sale_id_index',
                'sales_items_medicine_id_index',
                'sales_items_medicine_date_index',
            ],
            'stock_movements' => [
                'stock_movements_medicine_id_index',
                'stock_movements_type_index',
                'stock_movements_reference_type_index',
                'stock_movements_user_id_index',
                'stock_movements_created_at_index',
                'stock_movements_medicine_date_index',
                'stock_movements_reference_index',
            ],
            'medicine_alerts' => [
                'medicine_alerts_medicine_id_index',
                'medicine_alerts_alert_type_index',
                'medicine_alerts_status_index',
                'medicine_alerts_priority_index',
                'medicine_alerts_triggered_at_index',
                'medicine_alerts_status_priority_index',
            ],
            'medicine_categories' => [
                'medicine_categories_name_index',
            ],
        ];
        
        foreach ($tables as $tableName => $indexes) {
            foreach ($indexes as $indexName) {
                try {
                    \Illuminate\Support\Facades\DB::statement(
                        "ALTER TABLE {$tableName} DROP INDEX {$indexName}"
                    );
                } catch (\Exception $e) {
                    // Index doesn't exist or can't be dropped - continue
                }
            }
        }
    }
};