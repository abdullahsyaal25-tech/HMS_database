<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\DepartmentService;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Check permission
        if (!auth()->user()?->hasPermission('view-departments')) {
            abort(403, 'Unauthorized access');
        }

        $search = $request->input('search', '');
        $departmentFilter = $request->input('department', '');
        $statusFilter = $request->input('status', '');
        $perPage = $request->input('per_page', 10);

        $query = DepartmentService::with('department');

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply department filter
        if ($departmentFilter) {
            $query->where('department_id', $departmentFilter);
        }

        // Apply status filter
        if ($statusFilter !== '') {
            $query->where('is_active', $statusFilter === 'active');
        }

        $services = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends($request->query());

        // Get all departments for filter dropdown
        $departments = Department::orderBy('name')->get();

        return Inertia::render('DepartmentService/Index', [
            'services' => $services,
            'departments' => $departments,
            'filters' => [
                'search' => $search,
                'department' => $departmentFilter,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Display the Doctor Percentage report page.
     * Shows all services that have a doctor_percentage > 0.
     */
    public function doctorPercentageReport(Request $request): Response
    {
        // Check permission
        if (!auth()->user()?->hasPermission('view-departments')) {
            abort(403, 'Unauthorized access');
        }

        $search = $request->input('search', '');
        $departmentFilter = $request->input('department', '');
        $statusFilter = $request->input('status', '');
        $doctorFilter = $request->input('doctor', '');

        $query = DepartmentService::with(['department', 'doctor'])
            ->withDoctorPercentage();

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply department filter
        if ($departmentFilter) {
            $query->where('department_id', $departmentFilter);
        }

        // Apply doctor filter
        if ($doctorFilter) {
            $query->where('doctor_id', $doctorFilter);
        }

        // Apply status filter
        if ($statusFilter !== '') {
            $query->where('is_active', $statusFilter === 'active');
        }

        $services = $query->orderBy('department_id')->orderBy('name')->get();

        // Append computed attributes
        $services->each->append(['final_cost', 'doctor_amount']);

        // Calculate summary statistics
        $totalDoctorEarnings = $services->sum('doctor_amount');
        $totalBaseCost = $services->sum(fn($s) => (float) $s->base_cost);
        $totalFinalCost = $services->sum('final_cost');
        $servicesCount = $services->count();

        // Get all departments for filter dropdown
        $departments = Department::orderBy('name')->get();

        // If filtering by doctor, load their appointments (today/monthly/yearly)
        $appointments = ['today' => [], 'monthly' => [], 'yearly' => []];
        $appointmentStats = ['todayCount' => 0, 'monthlyCount' => 0, 'yearlyCount' => 0];
        $doctorInfo = null;

        if ($doctorFilter) {
            $doctorInfo = Doctor::with('department')->find($doctorFilter);

            // Get the Laboratory department ID to exclude
            $labDepartmentId = Department::where('name', 'Laboratory')->first()?->id;

            // Load appointments with services that have doctor_percentage > 0
            $baseQuery = fn() => Appointment::with(['patient', 'services' => function($query) {
                // Only load services where doctor has a percentage assigned
                $query->where('doctor_percentage', '>', 0);
            }])
                ->where('doctor_id', $doctorFilter)
                ->whereHas('services', function($query) {
                    // Only include appointments that have services with doctor_percentage > 0
                    $query->where('doctor_percentage', '>', 0);
                })
                ->when($labDepartmentId, fn($query) => $query->where('department_id', '!=', $labDepartmentId))
                ->orderBy('appointment_date', 'desc');

            $todayAppts = $baseQuery()->whereDate('appointment_date', today())->get();
            $monthlyAppts = $baseQuery()->whereMonth('appointment_date', now()->month)
                ->whereYear('appointment_date', now()->year)->get();
            $yearlyAppts = $baseQuery()->whereYear('appointment_date', now()->year)->get();

            $transformAppt = fn($appt) => [
                'id' => $appt->id,
                'appointment_id' => $appt->appointment_id,
                'appointment_date' => $appt->appointment_date->format('Y-m-d'),
                'appointment_time' => $appt->appointment_date->format('H:i'),
                'status' => $appt->status,
                'reason' => $appt->reason,
                'fee' => (float) $appt->fee,
                'discount' => (float) $appt->discount,
                'grand_total' => (float) $appt->grand_total,
                'created_at' => $appt->created_at->toISOString(),
                'patient' => $appt->patient ? [
                    'id' => $appt->patient->id,
                    'patient_id' => $appt->patient->patient_id,
                    'full_name' => trim($appt->patient->first_name),
                ] : null,
                // Only include services where doctor has percentage > 0
                'services' => $appt->services
                    ->filter(fn($svc) => $svc->doctor_percentage > 0)
                    ->map(fn($svc) => [
                        'id' => $svc->id,
                        'name' => $svc->name,
                        'custom_cost' => (float) $svc->pivot->custom_cost,
                        'discount_percentage' => $svc->pivot->custom_cost > 0
                            ? round((($svc->pivot->custom_cost - $svc->pivot->final_cost) / $svc->pivot->custom_cost) * 100, 2)
                            : 0,
                        'final_cost' => (float) $svc->pivot->final_cost,
                        'doctor_percentage' => (float) $svc->doctor_percentage,
                        'doctor_amount' => round($svc->pivot->custom_cost * ($svc->doctor_percentage / 100), 2),
                    ])->values()->toArray(),
            ];

            $appointments = [
                'today' => $todayAppts->map($transformAppt)->values()->toArray(),
                'monthly' => $monthlyAppts->map($transformAppt)->values()->toArray(),
                'yearly' => $yearlyAppts->map($transformAppt)->values()->toArray(),
            ];

            $appointmentStats = [
                'todayCount' => $todayAppts->count(),
                'monthlyCount' => $monthlyAppts->count(),
                'yearlyCount' => $yearlyAppts->count(),
            ];

            // When filtering by doctor, aggregate actual appointment data for the services table
            // This replaces the config-based data with real appointment-based data
            $allYearlyAppts = $yearlyAppts; // Use the already fetched yearly appointments
            $serviceAggregates = collect();

            foreach ($allYearlyAppts as $appt) {
                foreach ($appt->services as $svc) {
                    if ($svc->doctor_percentage <= 0) continue;

                    $serviceId = $svc->id;
                    $customCost = (float) $svc->pivot->custom_cost;
                    $finalCost = (float) $svc->pivot->final_cost;
                    $discountPct = $customCost > 0
                        ? round((($customCost - $finalCost) / $customCost) * 100, 2)
                        : 0;
                    $doctorPct = (float) $svc->doctor_percentage;
                    $doctorAmount = round($customCost * ($doctorPct / 100), 2);

                    if (!$serviceAggregates->has($serviceId)) {
                        $serviceAggregates->put($serviceId, [
                            'id' => $svc->id,
                            'name' => $svc->name,
                            'description' => $svc->description,
                            'department_id' => $svc->department_id,
                            'doctor_id' => $svc->doctor_id,
                            'department' => $svc->department,
                            'doctor' => $svc->doctor,
                            'is_active' => $svc->is_active,
                            'base_cost' => $customCost, // Use actual custom_cost as base
                            'fee_percentage' => $svc->fee_percentage,
                            'discount_percentage' => $discountPct,
                            'doctor_percentage' => $doctorPct,
                            'final_cost' => $finalCost,
                            'doctor_amount' => $doctorAmount,
                            'appointment_count' => 1,
                            'total_custom_cost' => $customCost,
                            'total_final_cost' => $finalCost,
                            'total_doctor_amount' => $doctorAmount,
                        ]);
                    } else {
                        // Aggregate multiple appointments for the same service
                        $existing = $serviceAggregates->get($serviceId);
                        $existing['appointment_count']++;
                        $existing['total_custom_cost'] += $customCost;
                        $existing['total_final_cost'] += $finalCost;
                        $existing['total_doctor_amount'] += $doctorAmount;
                        // Use weighted average for percentages
                        $existing['discount_percentage'] = $existing['total_custom_cost'] > 0
                            ? round((($existing['total_custom_cost'] - $existing['total_final_cost']) / $existing['total_custom_cost']) * 100, 2)
                            : 0;
                        $existing['base_cost'] = $existing['total_custom_cost']; // Show total as base
                        $existing['final_cost'] = $existing['total_final_cost'];
                        $existing['doctor_amount'] = $existing['total_doctor_amount'];
                        $serviceAggregates->put($serviceId, $existing);
                    }
                }
            }

            // Replace services with aggregated appointment data
            if ($serviceAggregates->isNotEmpty()) {
                $services = $serviceAggregates->values();
                // Recalculate summary statistics
                $totalDoctorEarnings = $services->sum('doctor_amount');
                $totalBaseCost = $services->sum('base_cost');
                $totalFinalCost = $services->sum('final_cost');
                $servicesCount = $services->count();
            }
        }

        return Inertia::render('DepartmentService/DoctorPercentage', [
            'services' => $services,
            'departments' => $departments,
            'filters' => [
                'search' => $search,
                'department' => $departmentFilter,
                'status' => $statusFilter,
                'doctor' => $doctorFilter,
            ],
            'summary' => [
                'total_services' => $servicesCount,
                'total_base_cost' => $totalBaseCost,
                'total_final_cost' => $totalFinalCost,
                'total_doctor_earnings' => $totalDoctorEarnings,
            ],
            'appointments' => $appointments,
            'appointment_stats' => $appointmentStats,
            'doctor_info' => $doctorInfo,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Department $department): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_cost' => 'required|numeric|min:0',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'doctor_percentage' => 'nullable|numeric|min:0|max:100',
            'doctor_id' => 'nullable|exists:doctors,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $department->services()->create($validator->validated());

        return redirect()->back()
            ->with('success', 'Service added to department successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DepartmentService $service): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_cost' => 'required|numeric|min:0',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'doctor_percentage' => 'nullable|numeric|min:0|max:100',
            'doctor_id' => 'nullable|exists:doctors,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $service->update($validator->validated());

        return redirect()->back()
            ->with('success', 'Department service updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DepartmentService $service): RedirectResponse
    {
        $service->delete();

        return redirect()->back()
            ->with('success', 'Service removed from department successfully.');
    }
}
