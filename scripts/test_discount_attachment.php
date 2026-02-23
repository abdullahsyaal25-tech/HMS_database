<?php

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../bootstrap/app.php';

use Illuminate\Support\Facades\DB;
use App\Models\Appointment;

echo "============================================\n";
echo "Testing Discount Attachment to Services\n";
echo "============================================\n\n";

// Get the latest appointment with services
$appointment = Appointment::with('services')
    ->latest()
    ->first();

if (!$appointment) {
    echo "❌ No appointments found\n";
    exit;
}

echo "Appointment Details:\n";
echo "  ID: " . $appointment->id . "\n";
echo "  Appointment ID: " . $appointment->appointment_id . "\n";
echo "  Doctor ID: " . $appointment->doctor_id . "\n";
echo "  Department ID: " . $appointment->department_id . "\n";
echo "  Fee: " . $appointment->fee . " AFN\n";
echo "  Discount: " . $appointment->discount . " AFN\n";
echo "  Discount Type: " . $appointment->discount_type . "\n";
echo "  Discount Fixed: " . $appointment->discount_fixed . " AFN\n";
echo "  Status: " . $appointment->status . "\n\n";

// Get attached services
$services = DB::table('appointment_services')
    ->where('appointment_id', $appointment->id)
    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
    ->join('departments', 'department_services.department_id', '=', 'departments.id')
    ->select(
        'appointment_services.id',
        'appointment_services.custom_cost',
        'appointment_services.discount_percentage',
        'appointment_services.final_cost',
        'department_services.name as service_name',
        'departments.name as department_name'
    )
    ->get();

if ($services->isEmpty()) {
    echo "❌ No services attached to this appointment\n";
} else {
    echo "Services Attached (" . count($services) . "):\n";
    echo "───────────────────────────────────────────────────────────────────\n";
    echo sprintf("%-30s | %-15s | %-15s | %-15s\n", 'Service Name', 'Custom Cost', 'Discount %', 'Final Cost');
    echo "───────────────────────────────────────────────────────────────────\n";
    
    $totalCustom = 0;
    $totalFinal = 0;
    $totalDiscount = 0;
    
    foreach ($services as $service) {
        $discount = $service->custom_cost - $service->final_cost;
        $totalCustom += $service->custom_cost;
        $totalFinal += $service->final_cost;
        $totalDiscount += $discount;
        
        echo sprintf("%-30s | %14.2f | %14.2f | %14.2f\n",
            substr($service->service_name, 0, 28),
            $service->custom_cost,
            $service->discount_percentage,
            $service->final_cost
        );
    }
    
    echo "───────────────────────────────────────────────────────────────────\n";
    echo sprintf("%-30s | %14.2f | %14s | %14.2f\n",
        'TOTAL',
        $totalCustom,
        '',
        $totalFinal
    );
    echo "\n✓ Total Discount Applied: " . $totalDiscount . " AFN\n";
    echo "✓ Expected (Appointment Discount): " . $appointment->discount . " AFN\n";
    
    // Verify discount matches
    if (abs($totalDiscount - $appointment->discount) < 0.01) {
        echo "✅ DISCOUNT CORRECTLY DISTRIBUTED TO SERVICES\n";
    } else {
        echo "⚠️  DISCOUNT MISMATCH\n";
        echo "   Actual Total Discount: " . $totalDiscount . " AFN\n";
        echo "   Expected: " . $appointment->discount . " AFN\n";
        echo "   Difference: " . ($totalDiscount - $appointment->discount) . " AFN\n";
    }
}

echo "\n\n";
echo "============================================\n";
echo "Wallet Revenue Calculation Check\n";
echo "============================================\n\n";

// Check department revenue
$deptRevenue = DB::table('appointment_services')
    ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
    ->join('departments', 'department_services.department_id', '=', 'departments.id')
    ->whereIn('appointments.status', ['completed', 'confirmed'])
    ->where('departments.name', '!=', 'Laboratory')
    ->sum('appointment_services.final_cost');

echo "Department Revenue (from appointment_services):\n";
echo "  Total: " . $deptRevenue . " AFN\n";

if (!$services->isEmpty()) {
    echo "\n  From Latest Appointment Services:\n";
    echo "  Services Count: " . count($services) . "\n";
    echo "  Services Total Final Cost: " . $totalFinal . " AFN\n";
}

echo "\n";
?>
