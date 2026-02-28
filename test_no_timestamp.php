<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Clear the day_end_timestamp to simulate what happens when no cache exists
Illuminate\Support\Facades\Cache::forget('day_end_timestamp');

$service = new \App\Services\DayStatusService();
$result = $service->getYesterdaySummary();

ob_start();
echo "=== getYesterdaySummary() with NO day_end_timestamp ===\n\n";
print_r($result);
$output = ob_get_clean();

file_put_contents('no_timestamp_output.txt', $output);
echo $output;
