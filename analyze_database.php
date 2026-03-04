<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DATABASE SCHEMA ANALYSIS ===\n\n";

// Get all tables
$tables = DB::select('SHOW TABLES');
$dbName = config('database.connections.mysql.database');
$key = 'Tables_in_' . $dbName;

echo "Found " . count($tables) . " tables\n\n";

$tablesInfo = [];

foreach ($tables as $table) {
    $tableName = $table->$key;
    
    // Get columns
    $columns = DB::select("SHOW COLUMNS FROM $tableName");
    $colCount = count($columns);
    
    // Get row count
    try {
        $rowCount = DB::table($tableName)->count();
    } catch (Exception $e) {
        $rowCount = 'N/A';
    }
    
    // Get indexes
    $indexes = DB::select("SHOW INDEX FROM $tableName");
    $indexNames = [];
    foreach ($indexes as $idx) {
        if ($idx->Key_name !== 'PRIMARY') {
            $indexNames[] = $idx->Key_name;
        }
    }
    $indexNames = array_unique($indexNames);
    
    // Get foreign keys
    $fks = DB::select("SELECT 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = '$tableName'
        AND TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL");
    
    $tablesInfo[$tableName] = [
        'columns' => $colCount,
        'rows' => $rowCount,
        'indexes' => $indexNames,
        'foreign_keys' => $fks
    ];
    
    echo "Table: $tableName\n";
    echo "  Columns: $colCount | Rows: $rowCount\n";
    if (count($fks) > 0) {
        echo "  Foreign Keys:\n";
        foreach ($fks as $fk) {
            echo "    - {$fk->COLUMN_NAME} -> {$fk->REFERENCED_TABLE_NAME}({$fk->REFERENCED_COLUMN_NAME})\n";
        }
    }
    if (count($indexNames) > 0) {
        echo "  Indexes: " . implode(', ', array_slice($indexNames, 0, 5));
        if (count($indexNames) > 5) {
            echo ' ... and ' . (count($indexNames) - 5) . ' more';
        }
        echo "\n";
    }
    echo "\n";
}

echo "=== ANALYSIS COMPLETE ===\n";
echo "\nTable Statistics:\n";
echo str_repeat('-', 60) . "\n";
printf("%-30s %10s %10s %10s\n", "Table", "Columns", "Rows", "Indexes");
echo str_repeat('-', 60) . "\n";

foreach ($tablesInfo as $name => $info) {
    printf("%-30s %10d %10s %10d\n", 
        $name, 
        $info['columns'], 
        $info['rows'], 
        count($info['indexes'])
    );
}
