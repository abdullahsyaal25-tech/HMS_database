<?php
// scripts/db_revenue_check.php
// Bootstraps the Laravel application and prints revenue totals for debugging
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Appointment;

$startToday = Carbon::today();
$endToday = Carbon::tomorrow();

// Count appointments
$totalAppointments = Appointment::count();
$appointmentsWithServices = Appointment::has('services')->count();
$appointmentsWithoutServices = Appointment::doesntHave('services')->count();

// Count appointment_services records
$totalAppointmentServices = DB::table('appointment_services')->count();
$appointmentServicesSum = DB::table('appointment_services')->sum('final_cost');

// Total from appointment rows (appointment_id and fee-discount)
$allAppointmentFees = Appointment::whereIn('status', ['completed', 'confirmed'])->get();
$allFees = $allAppointmentFees->sum(function($a) { return max(0, ($a->fee ?? 0) - ($a->discount ?? 0)); });
$allFeesByStatus = $allAppointmentFees->groupBy('status')
    ->map(fn($group) => $group->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0))));

// Department service totals (all time)
$deptTotalsAll = DB::table('appointment_services')
    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
    ->join('departments', 'department_services.department_id', '=', 'departments.id')
    ->select('departments.name', DB::raw('SUM(appointment_services.final_cost) as total'))
    ->groupBy('departments.name')
    ->get();

// Appointment fees (appointments without services) - all time
$appointmentFeeNoServicesAll = Appointment::whereIn('status', ['completed','confirmed'])
    ->whereDoesntHave('services')
    ->get()
    ->sum(function($a){ return max(0, ($a->fee ?? 0) - ($a->discount ?? 0)); });

// Lab test results total (all time)
$labTestResultsAll = DB::table('lab_test_results')
    ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
    ->sum('lab_tests.cost');

// Lab department appointments
$labDeptId = DB::table('departments')->where('name', 'Laboratory')->value('id');
$labAppointmentsFeeAll = 0;
if ($labDeptId) {
    $labAppointmentsFeeAll = Appointment::whereIn('status', ['completed','confirmed'])
        ->whereDoesntHave('services')
        ->where('department_id', $labDeptId)
        ->get()
        ->sum(function($a){ return max(0, ($a->fee ?? 0) - ($a->discount ?? 0)); });
}

// Sample data - show a few appointments with detailed discount info
$sampleAppointments = Appointment::with('services')->limit(10)->get()->map(fn($a) => [
    'id' => $a->id,
    'appointment_id' => $a->appointment_id,
    'department_id' => $a->department_id,
    'fee' => $a->fee,
    'discount' => $a->discount,
    'discount_type' => $a->discount_type ?? 'percentage (default)',
    'discount_fixed' => $a->discount_fixed ?? 0,
    'final_amount' => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)),
    'discount_percentage_of_fee' => $a->fee > 0 ? round((($a->discount ?? 0) / $a->fee) * 100, 2) : 0,
    'services_count' => $a->services()->count(),
    'services' => $a->services->map(fn($s) => [
        'name' => $s->name,
        'custom_cost' => $s->pivot->custom_cost,
        'discount_percentage' => $s->pivot->discount_percentage,
        'final_cost' => $s->pivot->final_cost,
    ])->toArray(),
])->toArray();

$out = [
    'appointments_summary' => [
        'total_appointments' => $totalAppointments,
        'appointments_with_services' => $appointmentsWithServices,
        'appointments_without_services' => $appointmentsWithoutServices,
    ],
    'appointment_services_table' => [
        'total_records' => $totalAppointmentServices,
        'sum_final_cost' => $appointmentServicesSum,
    ],
    'all_appointment_fees' => [
        'total' => $allFees,
        'by_status' => $allFeesByStatus,
    ],
    'dept_totals_all' => $deptTotalsAll,
    'appointment_fee_no_services_all' => $appointmentFeeNoServicesAll,
    'lab_test_results_all' => $labTestResultsAll,
    'lab_appointments_fee_all' => $labAppointmentsFeeAll,
    'sample_appointments' => $sampleAppointments,
    'timestamp' => Carbon::now()->toDateTimeString(),
];

echo json_encode($out, JSON_PRETTY_PRINT), PHP_EOL;
