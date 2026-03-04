<?php
/**
 * Script to sync migrations table with actual database state
 * Marks migrations as completed if their tables already exist
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Map of migration names to table names
$migrationTableMap = [
    '2026_01_03_204030_add_status_to_medicine_alerts_table' => null, // alters existing table
    '2026_01_03_234134_create_permissions_table' => 'permissions',
    '2026_01_03_234140_create_role_permissions_table' => 'role_permissions',
    '2026_01_05_214948_create_cache_table' => 'cache',
    '2026_01_05_220036_create_user_permissions_table' => 'user_permissions',
    '2026_01_06_112035_create_personal_access_tokens_table' => 'personal_access_tokens',
    '2026_01_13_074509_create_audit_logs_table' => 'audit_logs',
    '2026_01_15_000001_add_foreign_key_constraint_to_doctors_table' => null, // alters table
    '2026_01_15_000002_add_indexes_for_performance' => null, // alters tables
    '2026_01_15_000003_add_metadata_columns' => null, // alters tables
    '2026_01_15_000004_add_appointment_partitioning' => null, // alters table
    '2026_01_16_032321_add_performance_fields_to_audit_logs_table' => null, // alters table
    '2026_01_16_051334_add_additional_performance_indexes' => null, // alters tables
    '2026_01_18_084257_create_permission_dependencies_table' => 'permission_dependencies',
    '2026_01_18_084426_add_category_to_permissions_table' => null, // alters table
    '2026_01_18_085717_create_temporary_permissions_table' => 'temporary_permissions',
    '2026_01_18_085858_create_permission_change_requests_table' => 'permission_change_requests',
    '2026_01_18_090023_create_permission_sessions_table' => 'permission_sessions',
    '2026_01_18_090207_create_permission_ip_restrictions_table' => 'permission_ip_restrictions',
    '2026_01_18_100000_create_permission_alerts_table' => 'permission_alerts',
    '2026_01_18_100100_create_permission_monitoring_logs_table' => 'permission_monitoring_logs',
    '2026_01_18_100200_create_permission_health_checks_table' => 'permission_health_checks',
    '2026_01_24_000001_create_roles_table_and_normalize_permissions' => null, // complex migration
    '2026_01_24_000002_add_security_and_integrity_constraints' => null, // alters tables
    '2026_01_24_000003_create_medical_records_table' => 'medical_records',
    '2026_01_24_000004_remove_soft_deletes_from_audit_logs' => null, // alters table
    '2026_01_27_081418_modify_doctors_table_structure' => null, // alters table
    '2026_01_29_000000_create_department_services_table' => 'department_services',
    '2026_01_29_000002_create_notifications_table' => 'notifications',
    '2026_01_30_000001_create_lab_test_requests_table' => 'lab_test_requests',
    '2026_02_02_091002_add_parent_role_id_to_roles_table' => null, // alters table
    '2026_02_02_091014_create_role_reporting_relationships_table' => 'role_reporting_relationships',
    '2026_02_02_091024_add_module_and_segregation_to_permissions_table' => null, // alters table
    '2026_02_02_113241_remove_doctor_and_patient_roles' => null, // data migration
    '2026_02_02_120001_rename_net_amount_to_grand_total_in_sales_table' => null, // alters table
    '2026_02_02_120002_add_stock_columns_to_medicines_table' => null, // alters table
    '2026_02_02_120004_add_medicine_id_to_medicines_table' => null, // alters table
    '2026_02_02_120005_create_stock_movements_table' => 'stock_movements',
    '2026_02_04_090000_add_missing_indexes' => null, // alters tables
    '2026_02_04_120000_add_performance_indexes' => null, // alters tables
    '2026_02_05_000001_add_rbac_missing_columns' => null, // alters tables
    '2026_02_05_000002_make_permission_columns_nullable' => null, // alters tables
    '2026_02_05_add_clinical_assessment_fields' => null, // alters tables
    '2026_02_06_000001_fix_rbac_role_id_assignments' => null, // data migration
    '2026_02_10_000001_fix_sales_table_schema' => null, // alters tables
    '2026_02_10_000002_add_discount_to_sales_items' => null, // alters table
    '2026_02_14_000001_create_prescriptions_tables' => 'prescriptions',
    '2026_02_16_033034_add_fee_percentage_to_doctors_table' => null, // alters table
    '2026_02_16_104500_create_appointment_services_table' => 'appointment_services',
    '2026_02_16_120000_make_appointment_doctor_department_nullable' => null, // alters table
    '2026_02_17_000001_add_daily_sequence_to_appointments_table' => null, // alters table
    '2026_02_18_061931_add_doctor_percentage_to_department_services_table' => null, // alters table
    '2026_02_18_064630_add_doctor_id_to_department_services_table' => null, // alters table
    '2026_02_19_000001_add_stock_quantity_to_medicines_table' => null, // alters table
    '2026_02_19_000001_create_suppliers_table' => 'suppliers',
    '2026_02_19_000002_create_purchases_table' => 'purchases',
    '2026_02_19_000003_create_purchase_items_table' => 'purchase_items',
    '2026_02_19_000010_add_cost_price_to_sales_items_table' => null, // alters table
    '2026_02_19_000011_add_company_name_to_suppliers_table' => null, // alters table
    '2026_02_19_101300_add_pharmacy_indexes' => null, // alters tables
    '2026_02_21_060438_add_company_to_purchases_and_sale_price_to_purchase_items' => null, // alters tables
    '2026_02_21_065009_add_department_id_to_lab_test_requests_table' => null, // alters table
    '2026_02_21_103603_create_wallets_table' => 'wallets',
    '2026_02_21_103612_create_transactions_table' => 'transactions',
    '2026_02_21_110755_create_jobs_table' => 'jobs',
    '2026_02_23_000001_add_discount_type_to_appointments_table' => null, // alters table
    '2026_02_23_120000_create_payments_table' => 'payments',
    '2026_02_24_000000_add_resolved_at_to_medicine_alerts_table' => null, // alters table
    '2026_02_25_000001_add_category_to_lab_tests_table' => null, // alters table
    '2026_02_25_081449_create_daily_snapshots_table' => 'daily_snapshots',
    '2026_02_26_102830_fix_sales_items_column_names' => null, // alters table
    '2026_02_26_113104_create_lab_materials_table' => 'lab_materials',
    '2026_02_26_120000_add_lab_test_id_to_lab_test_requests_table' => null, // alters table
    '2026_02_27_063000_add_missing_fields_to_daily_snapshots_table' => null, // alters table
    '2026_02_28_072900_add_verified_by_to_lab_test_results_table' => null, // alters table
    '2026_03_01_000001_add_missing_columns_to_lab_tests_table' => null, // alters table
];

echo "Syncing migrations table with database state...\n\n";

// Get current batch number
$lastBatch = DB::table('migrations')->max('batch') ?: 1;
$synced = 0;
$skipped = 0;

foreach ($migrationTableMap as $migration => $table) {
    // Check if migration already recorded
    $exists = DB::table('migrations')->where('migration', $migration)->exists();
    
    if ($exists) {
        echo "✓ Already recorded: {$migration}\n";
        $skipped++;
        continue;
    }
    
    // For table-creating migrations, check if table exists
    if ($table !== null) {
        if (Schema::hasTable($table)) {
            DB::table('migrations')->insert([
                'migration' => $migration,
                'batch' => $lastBatch
            ]);
            echo "✓ Synced (table exists): {$migration}\n";
            $synced++;
        } else {
            echo "  Pending (table missing): {$migration}\n";
        }
    } else {
        // For alter migrations, we need to check if the change was already applied
        // This is harder to detect, so we'll skip them for now
        echo "  Skip (alter migration): {$migration}\n";
    }
}

echo "\n";
echo "Synced: {$synced} migrations\n";
echo "Already recorded: {$skipped} migrations\n";
echo "\nDone! Run 'php artisan migrate:status' to verify.\n";
