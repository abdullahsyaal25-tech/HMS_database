<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Appointment;
use Illuminate\Support\Facades\DB;

$appts = Appointment::withCount('services')->with('services')->orderBy('created_at', 'desc')->limit(10)->get();

echo "Latest 10 appointments:\n";
foreach ($appts as $a) {
    $date = $a->appointment_date ? $a->appointment_date->format('Y-m-d') : 'null';
    echo sprintf("ID:%-3s APPT:%-12s Date:%-10s Status:%-10s Services:%-2d Fee:%8.2f Discount:%8.2f\n",
        $a->id,
        $a->appointment_id,
        $date,
        $a->status,
        $a->services_count,
        $a->fee ?? 0,
        $a->discount ?? 0
    );
    if ($a->services_count > 0) {
        foreach ($a->services as $s) {
            echo sprintf("  - svc pivot dept_id:%-4s custom:%8.2f final:%8.2f\n", $s->pivot->department_service_id, $s->pivot->custom_cost, $s->pivot->final_cost);
        }
    }
}

$dept_total = DB::table('appointment_services')
    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
    ->join('departments', 'department_services.department_id', '=', 'departments.id')
    ->where('departments.name', '!=', 'Laboratory')
    ->sum('appointment_services.final_cost');

echo "\nDepartment revenue total (non-lab): " . $dept_total . "\n";
