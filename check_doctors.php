<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$doctors = DB::table('doctors')->select('id', 'doctor_id', 'full_name')->get();
echo "Doctors in database:\n";
foreach ($doctors as $d) {
    echo "ID: {$d->id}, Doctor ID: {$d->doctor_id}, Name: {$d->full_name}\n";
}
