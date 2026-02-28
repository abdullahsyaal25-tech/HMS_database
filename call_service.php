<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = new \App\Services\DayStatusService();
$result = $service->getYesterdaySummary();

ob_start();
echo "=== DayStatusService getYesterdaySummary() result ===\n\n";
print_r($result);
$output = ob_get_clean();

file_put_contents('service_output.txt', $output);
echo $output;
