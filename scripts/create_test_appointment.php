<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\AppointmentService;
use Illuminate\Support\Facades\DB;

$service = $app->make(AppointmentService::class);

// Example test data - adjust IDs to match your DB
$data = [
    'patient_id' => 1,
    'doctor_id' => null,
    'department_id' => 2, // non-lab department id in your DB
    'appointment_date' => now()->toDateString(),
    'status' => 'completed',
    'reason' => 'Test discount distribution',
    'notes' => 'Created by test script',
    // Global discount: percentage
    'discount_type' => 'percentage',
    'discount' => 20, // 20% overall discount
    'discount_fixed' => 0,
    'services' => [
        [
            'department_service_id' => 21, // ensure exists
            'custom_cost' => 100,
            'discount_percentage' => 10,
            'is_lab_test' => false,
        ],
        [
            'department_service_id' => 52, // ensure exists
            'custom_cost' => 200,
            'discount_percentage' => 5,
            'is_lab_test' => false,
        ],
    ],
];

try {
    DB::beginTransaction();
    $appointment = $service->createAppointment($data);
    DB::commit();
    echo "Created appointment: " . $appointment->appointment_id . " (ID: " . $appointment->id . ")\n";
    $attached = DB::table('appointment_services')->where('appointment_id', $appointment->id)->get();
    echo "Attached services count: " . $attached->count() . "\n";
    foreach ($attached as $row) {
        echo "Service pivot - dept_service_id: {$row->department_service_id}, custom_cost: {$row->custom_cost}, final_cost: {$row->final_cost}, discount_percentage: {$row->discount_percentage}\n";
    }

    // Show department revenue contribution for this appointment
    $deptSum = DB::table('appointment_services')->where('appointment_id', $appointment->id)->sum('final_cost');
    echo "Department sum final_cost for appointment: {$deptSum}\n";
} catch (Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}

