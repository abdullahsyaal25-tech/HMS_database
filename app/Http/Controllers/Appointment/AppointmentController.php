<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DepartmentService;
use App\Services\AppointmentService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    protected AppointmentService $appointmentService;
    protected AuditLogService $auditLogService;

    public function __construct(
        AppointmentService $appointmentService,
        AuditLogService $auditLogService
    ) {
        $this->appointmentService = $appointmentService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Get pharmacy revenue for a date range
     */
    private function getPharmacyRevenue($start, $end): float
    {
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        return \App\Models\Sale::where('status', 'completed')
            ->whereBetween('created_at', [$startLocal, $endLocal])
            ->sum('grand_total') ?? 0;
    }

    /**
     * Get laboratory revenue for a date range
     */
    private function getLaboratoryRevenue($start, $end): float
    {
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        // Get lab test results that are completed OR have been performed
        $labTestResultsRevenue = \Illuminate\Support\Facades\DB::table('lab_test_results')
            ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
            ->where(function ($query) use ($startLocal, $endLocal) {
                $query->whereBetween('lab_test_results.performed_at', [$startLocal, $endLocal])
                      ->orWhere(function ($q) {
                          $q->whereNull('lab_test_results.performed_at')
                            ->whereIn('lab_test_results.status', ['completed', 'verified']);
                      });
            })
            ->sum('lab_tests.cost') ?? 0;

        // Get laboratory services from appointments (department services)
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        $appointmentLabServicesRevenue = \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost') ?? 0;

        // Get laboratory department appointments
        // FIXED: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
        $labDepartmentAppointmentsRevenue = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('created_at', [$startLocal, $endLocal])
            ->whereDoesntHave('services')
            ->where(function ($query) {
                $query->whereIn('department_id', function ($subQuery) {
                    $subQuery->select('id')
                             ->from('departments')
                             ->where('name', 'Laboratory');
                });
            })
            ->get()
            ->sum(function ($appointment) {
                return max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
            });

        return $labTestResultsRevenue + $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
    }

    /**
     * Get department service revenue for a date range (excluding Laboratory)
     */
    private function getDepartmentRevenue($start, $end): float
    {
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        // to properly support day_end_timestamp filtering
        return \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost') ?? 0;
    }

    /**
     * Check if the current user can access appointments
     */
    private function authorizeAppointmentAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if the current user can modify appointments
     */
    private function authorizeAppointmentModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize input data to prevent XSS
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'reason' => htmlspecialchars(strip_tags($data['reason'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'notes' => htmlspecialchars(strip_tags($data['notes'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'patient_id' => filter_var($data['patient_id'] ?? null, FILTER_VALIDATE_INT),
            'doctor_id' => filter_var($data['doctor_id'] ?? null, FILTER_VALIDATE_INT),
            'department_id' => filter_var($data['department_id'] ?? null, FILTER_VALIDATE_INT),
            'fee' => filter_var($data['fee'] ?? 0, FILTER_VALIDATE_FLOAT),
            'discount' => filter_var($data['discount'] ?? 0, FILTER_VALIDATE_FLOAT),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $this->authorizeAppointmentAccess();

        $user = auth()->user();
        $isSuperAdmin = $user?->isSuperAdmin() ?? false;

        // Always show only today's appointments in the table
        $appointments = $this->appointmentService->getAllAppointments(50, true);

        // Today's stats - query database directly for real-time data
        $todayAppointmentsCount = Appointment::whereDate('appointment_date', today())->count();
        
        // Calculate today's appointment revenue - for completed/confirmed appointments WITHOUT services
        $regularRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereDate('appointment_date', today())
            ->whereDoesntHave('services')
            ->get()
            ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
        
        // Service revenue from appointment_services (all department services)
        $serviceRevenue = DB::table('appointment_services')
            ->join('appointments', 'appointments.id', '=', 'appointment_services.appointment_id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->whereDate('appointments.appointment_date', today())
            ->sum('appointment_services.final_cost') ?? 0;
        
        $todayRevenue = $regularRevenue + $serviceRevenue;

        // For sub-admins: show today's counts; for super admin: show all-time counts
        if ($isSuperAdmin) {
            $scheduledCount = Appointment::where('status', 'scheduled')->count();
            $completedCount = Appointment::where('status', 'completed')->count();
            $cancelledCount = Appointment::where('status', 'cancelled')->count();
            $totalCount = Appointment::count();
        } else {
            $scheduledCount = Appointment::whereDate('appointment_date', today())->where('status', 'scheduled')->count();
            $completedCount = Appointment::whereDate('appointment_date', today())->where('status', 'completed')->count();
            $cancelledCount = Appointment::whereDate('appointment_date', today())->where('status', 'cancelled')->count();
            $totalCount = $todayAppointmentsCount;
        }

        // Get current day appointment revenue data for DayStatusBanner
        // Check if day_end_timestamp exists - Manual day detection
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // Determine the effective start time for today queries
        // If day_end_timestamp exists, only query transactions AFTER that timestamp
        // If no cache exists, use today's start to show only today's data
        $effectiveStartTime = $dayEndTimestamp 
            ? \Carbon\Carbon::parse($dayEndTimestamp)
            : \Carbon\Carbon::today()->startOfDay();
        
        $tomorrow = \Carbon\Carbon::tomorrow();

        // Calculate all revenue categories
        $currentDayAppointmentRevenue = $this->getAppointmentRevenue($effectiveStartTime, $tomorrow);
        $pharmacyRevenue = $this->getPharmacyRevenue($effectiveStartTime, $tomorrow);
        $laboratoryRevenue = $this->getLaboratoryRevenue($effectiveStartTime, $tomorrow);
        $departmentsRevenue = $this->getDepartmentRevenue($effectiveStartTime, $tomorrow);
        
        // Calculate total from visible sources only (exclude pharmacy as it's hidden on appointments page)
        // The DayStatusBanner uses hidePharmacy=true on the appointments page, so total should match visible categories
        $totalRevenue = $currentDayAppointmentRevenue + $laboratoryRevenue + $departmentsRevenue;

        return Inertia::render('Appointment/Index', [
            'appointments' => $appointments,
            'is_super_admin' => $isSuperAdmin,
            'stats' => [
                'today_appointments' => $todayAppointmentsCount,
                'today_revenue' => round($todayRevenue, 2),
                'scheduled_count' => $scheduledCount,
                'completed_count' => $completedCount,
                'cancelled_count' => $cancelledCount,
                'total_count' => $totalCount,
            ],
            'currentDayData' => [
                'appointments_count' => $todayAppointmentsCount,
                'total_revenue' => round($totalRevenue, 2),
                'appointments_revenue' => round($currentDayAppointmentRevenue, 2),
                'pharmacy_revenue' => round($pharmacyRevenue, 2),
                'laboratory_revenue' => round($laboratoryRevenue, 2),
                'departments_revenue' => round($departmentsRevenue, 2),
                'source' => 'Appointments Dashboard',
            ],
        ]);
    }

    /**
     * Display the appointment dashboard with consolidated information.
     */
    public function dashboard(): Response
    {
        $this->authorizeAppointmentAccess();
        
        // Get recent appointments (latest 10)
        $appointments = $this->appointmentService->getAllAppointments(10);
        
        // Get department services - use same query as index but limited to 10
        $servicesQuery = DepartmentService::with('department')
            ->orderBy('created_at', 'desc');
        
        $totalServices = $servicesQuery->count();
        $services = $servicesQuery->limit(10)->get();
        
        // Get appointment stats
        $appointmentStats = \App\Models\Appointment::select('status')
            ->get()
            ->groupBy('status')
            ->map(fn($group) => $group->count());
        
        // Get service stats
        $serviceStats = DepartmentService::select('is_active')
            ->get()
            ->groupBy('is_active')
            ->map(fn($group) => $group->count());
        
        // Get departments for filter dropdown (consistent with index)
        $departments = \App\Models\Department::orderBy('name')->get();
        
        return Inertia::render('Appointment/Dashboard', [
            'appointments' => $appointments,
            'services' => [
                'data' => $services,
                'meta' => [
                    'total' => $totalServices,
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 10,
                    'from' => 1,
                    'to' => min(10, $totalServices),
                ],
            ],
            'departments' => $departments,
            'stats' => [
                'appointments' => [
                    'total' => \App\Models\Appointment::count(),
                    'scheduled' => $appointmentStats['scheduled'] ?? 0,
                    'completed' => $appointmentStats['completed'] ?? 0,
                    'cancelled' => $appointmentStats['cancelled'] ?? 0,
                ],
                'services' => [
                    'total' => $totalServices,
                    'active' => $serviceStats[true] ?? 0,
                    'inactive' => $serviceStats[false] ?? 0,
                ],
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorizeAppointmentModify();
        
        $formData = $this->appointmentService->getAppointmentFormData();
        return Inertia::render('Appointment/Create', $formData);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorizeAppointmentModify();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'department_id' => 'nullable|exists:departments,id',
            'appointment_date' => 'required|date',
            'reason' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:5000',
            'fee' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_fixed' => 'nullable|numeric|min:0',
            'status' => 'required|in:scheduled,completed,cancelled,no_show,rescheduled',
            'services' => 'nullable',
            'services.*.department_service_id' => 'required_with:services',
            'services.*.custom_cost' => 'required_with:services|numeric|min:0',
            'services.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'services.*.is_lab_test' => 'nullable|boolean',
        ]);

        // Handle services - may come as JSON string from hidden input or as array
        if (!empty($validated['services']) && is_string($validated['services'])) {
            $validated['services'] = json_decode($validated['services'], true);
        }

        // Department is now optional - either doctor OR department can be selected, or neither
        // (for simple appointments without specific department/doctor assignment)

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        try {
            // Convert empty strings to null for optional fields
            $doctorId = !empty($sanitized['doctor_id']) ? $sanitized['doctor_id'] : null;
            $departmentId = !empty($sanitized['department_id']) ? $sanitized['department_id'] : null;

            $appointmentData = [
                'patient_id' => $sanitized['patient_id'],
                'doctor_id' => $doctorId,
                'department_id' => $departmentId,
                'appointment_date' => $validated['appointment_date'],
                'reason' => $sanitized['reason'],
                'notes' => $sanitized['notes'],
                'fee' => $sanitized['fee'],
                'discount' => $sanitized['discount'],
                'discount_type' => $validated['discount_type'] ?? 'percentage',
                'discount_fixed' => $validated['discount_fixed'] ?? 0,
                'status' => $validated['status'] ?? 'completed',
            ];

            // Add services if provided
            if (!empty($validated['services'])) {
                $appointmentData['services'] = $validated['services'];
            }

            $appointment = $this->appointmentService->createAppointment($appointmentData);

            // Load relationships for print preview
            $appointment->load(['patient', 'doctor', 'department', 'services']);

            // Debug: Log the appointment data being sent for printing
            $appointmentArray = $appointment->toArray();
            
            // Include department name explicitly for print modal
            if ($appointment->department) {
                $appointmentArray['department'] = [
                    'name' => $appointment->department->name,
                ];
            }
            
            // Include services data explicitly for print modal
            Log::info('Services check before mapping', [
                'services_count' => $appointment->services->count(),
                'services_isEmpty' => $appointment->services->isEmpty(),
                'services_raw' => $appointment->services->toArray(),
            ]);
            
            if ($appointment->services->isNotEmpty()) {
                $appointmentArray['services'] = $appointment->services->map(function($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'pivot' => [
                            'custom_cost' => $service->pivot->custom_cost,
                            'discount_percentage' => $service->pivot->discount_percentage,
                            'final_cost' => $service->pivot->final_cost,
                        ],
                    ];
                })->toArray();
            }
            
            // Include authorized user name for print modal
            $appointmentArray['authorized_by'] = auth()->user()->name ?? 'System';
            
            Log::info('Appointment created for printing', [
                'appointment_id' => $appointment->appointment_id,
                'patient' => $appointmentArray['patient'] ?? null,
                'doctor' => $appointmentArray['doctor'] ?? null,
                'department' => $appointmentArray['department'] ?? null,
                'services' => $appointmentArray['services'] ?? null,
                'fee' => $appointmentArray['fee'] ?? null,
                'discount' => $appointmentArray['discount'] ?? null,
                'grand_total' => $appointmentArray['grand_total'] ?? null,
            ]);

            // Return to create page with appointment data to show print modal
            $formData = $this->appointmentService->getAppointmentFormData();
            
            // Generate a unique flash ID to track this specific flash message
            $flashId = uniqid('flash_', true);
            $successMessage = 'Appointment created successfully!';
            
            // Prepare flash data for department and doctor
            $flashDepartment = $appointment->department ? $appointment->department->name : null;
            $flashDoctor = $appointment->doctor ? 'Dr. ' . $appointment->doctor->full_name : null;
            
            Log::info('Returning to create page with print appointment', [
                'printAppointment' => $appointmentArray ? 'present' : 'missing',
                'formData_keys' => array_keys($formData),
                'flash_id' => $flashId,
                'appointment_id' => $appointment->appointment_id,
                'flash_department' => $flashDepartment,
                'flash_doctor' => $flashDoctor,
            ]);
            
            // Pass success message and flash data directly as props (more reliable than flash for Inertia)
            return Inertia::render('Appointment/Create', [
                ...$formData,
                'printAppointment' => $appointmentArray,
                'flashId' => $flashId,
                'successMessage' => $successMessage,
                'flashDepartment' => $flashDepartment,
                'flashDoctor' => $flashDoctor,
            ])->with('success', $successMessage);
        } catch (\Exception $e) {
            Log::error('Failed to create appointment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $this->authorizeAppointmentAccess();
        
        $appointment = $this->appointmentService->getAppointmentById($id);
        return Inertia::render('Appointment/Show', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $this->authorizeAppointmentModify();
        
        $appointment = $this->appointmentService->getAppointmentById($id);
        $formData = $this->appointmentService->getAppointmentFormData();
        return Inertia::render('Appointment/Edit', [
            'appointment' => $appointment,
            ...$formData
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $this->authorizeAppointmentModify();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required',
            'status' => 'required|in:scheduled,completed,cancelled,no_show,rescheduled',
            'reason' => 'nullable|string|max:1000',
            'fee' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        // Combine date and time
        $appointmentDateTime = $validated['appointment_date'] . ' ' . $validated['appointment_time'];

        try {
            DB::beginTransaction();

            $appointment = $this->appointmentService->updateAppointment($id, [
                'patient_id' => $sanitized['patient_id'],
                'doctor_id' => $sanitized['doctor_id'],
                'appointment_date' => $appointmentDateTime,
                'status' => $validated['status'],
                'reason' => $sanitized['reason'],
                'fee' => $sanitized['fee'],
                'discount' => $sanitized['discount'],
            ]);

            DB::commit();

            return redirect()->route('appointments.index')->with('success', 'Appointment updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating appointment', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to update appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $this->authorizeAppointmentModify();
        
        // Require specific delete permission
        if (!auth()->user()?->hasPermission('delete-appointments')) {
            abort(403, 'Unauthorized access');
        }
        
        try {
            $this->appointmentService->deleteAppointment($id);
            return redirect()->route('appointments.index')->with('success', 'Appointment deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Get appointment revenue for a date range.
     * Calculates from completed appointments ONLY using doctor consultation fee (fee - discount).
     * Services are tracked separately in getDepartmentRevenue().
     * Excludes laboratory department appointments (counted in laboratory revenue instead).
     */
    private function getAppointmentRevenue(\Carbon\Carbon $start, \Carbon\Carbon $end)
    {
        // Get completed appointments WITHOUT services AND NOT from Laboratory department
        // Appointments with services are tracked in department revenue instead
        // Laboratory appointments (even without services attached) are tracked in laboratory revenue
        // FIXED: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        $appointments = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('created_at', [$startLocal, $endLocal])
            ->whereDoesntHave('services')  // Only appointments without services
            ->where(function ($query) {
                // Exclude appointments where department is Laboratory
                $query->whereNull('department_id')
                      ->orWhereNotIn('department_id', function ($subQuery) {
                          $subQuery->select('id')
                                   ->from('departments')
                                   ->where('name', 'Laboratory');
                      });
            })
            ->get();
        
        return $appointments->sum(function ($appointment) {
            return max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
        });
    }

}
