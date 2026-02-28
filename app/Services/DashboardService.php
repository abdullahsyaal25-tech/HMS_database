<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Department;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Purchase;
use App\Models\Medicine;
use App\Models\LabTestRequest;
use App\Models\AuditLog;
use App\Models\Prescription;
use App\Models\DepartmentService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function getDashboardStats(string $period = 'today'): array
    {
        try {
            $dateRange = $this->getDateRange($period);
            
            Log::info('DashboardStats: Starting to fetch data for period: ' . $period);
            
            $summary = $this->getSummaryStats($dateRange);
            Log::info('DashboardStats: Summary fetched successfully');
            
            $patients = $this->getPatientStats($dateRange);
            Log::info('DashboardStats: Patients fetched successfully');
            
            $appointments = $this->getAppointmentStats($dateRange);
            Log::info('DashboardStats: Appointments fetched successfully');
            
            $financial = $this->getFinancialStats($dateRange);
            Log::info('DashboardStats: Financial fetched successfully');
            
            $pharmacy = $this->getPharmacyStats($dateRange);
            Log::info('DashboardStats: Pharmacy fetched successfully');
            
            $laboratory = $this->getLaboratoryStats($dateRange);
            Log::info('DashboardStats: Laboratory fetched successfully');
            
            $departments = $this->getDepartmentStats($dateRange);
            Log::info('DashboardStats: Departments fetched successfully');
            
            return [
                'summary' => $summary,
                'patients' => $patients,
                'appointments' => $appointments,
                'financial' => $financial,
                'pharmacy' => $pharmacy,
                'laboratory' => $laboratory,
                'departments' => $departments,
                'recent_activities' => $this->getRecentActivities(),
                'trends' => $this->getTrendsData(),
                'period' => $period,
                'last_updated' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return $this->getDefaultStats();
        }
    }

    /**
     * Get date range based on period
     */
    protected function getDateRange(string $period): array
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'today':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
            case 'week':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            case 'month':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            case 'year':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];
            case 'all-time':
                // Return a very wide date range for all-time stats
                return [Carbon::createFromDate(2000, 1, 1), Carbon::now()->addYears(100)];
            default:
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
        }
    }

    /**
     * Get summary statistics
     */
    protected function getSummaryStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Debug: Log the queries
        Log::info('Dashboard Summary Stats - Date Range:', [$start->toDateTimeString(), $end->toDateTimeString()]);
        
        // Get total counts (all time)
        $totalPatients = Patient::count();
        $totalDoctors = Doctor::count(); // Show all doctors, not just active
        $totalDepartments = Department::count();
        
        Log::info('Dashboard Summary Stats - Totals:', [
            'total_patients' => $totalPatients,
            'total_doctors' => $totalDoctors,
            'total_departments' => $totalDepartments,
        ]);
        
        // Check if this is "today" period and try to get from cache first
        $isToday = $start->isToday() && $end->isToday();
        $todayStr = Carbon::today()->toDateString();
        
        $appointmentRevenue = 0;
        $departmentRevenue = 0;
        $pharmacyRevenue = 0;
        $laboratoryRevenue = 0;
        $totalRevenue = 0;
        
        // Check if day_end_timestamp exists - Option B: Running Total After Day-End
        $dayEndTimestamp = Cache::get('day_end_timestamp_' . $todayStr);
        
        // Determine effective start time for today queries
        $effectiveStart = $start;
        $effectiveEnd = $end;
        
        if ($isToday && $dayEndTimestamp) {
            // Only query transactions AFTER the day_end_timestamp
            $effectiveStart = Carbon::parse($dayEndTimestamp)->startOfDay();
            Log::info('Dashboard Summary Stats - Day end timestamp found, querying after: ' . $dayEndTimestamp);
        }
        
        if ($isToday && $dayEndTimestamp) {
            // Day has ended, only show revenue from transactions AFTER the day_end_timestamp
            Log::info('Dashboard Summary Stats - Using day_end_timestamp, querying after: ' . $dayEndTimestamp);
            // Appointment revenue (excluding lab department) - query after day_end_timestamp
            // FIX: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
            // FIX: Add whereDoesntHave('services') to match WalletController logic
            $appointmentRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->whereDoesntHave('services')  // Only appointments without services
                ->where(function ($query) {
                    $query->whereNull('department_id')
                          ->orWhereNotIn('department_id', function ($subQuery) {
                              $subQuery->select('id')
                                       ->from('departments')
                                       ->where('name', 'Laboratory');
                          });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            // Department revenue (non-Laboratory services) - query after day_end_timestamp
            $departmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '!=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', [$effectiveStart, $effectiveEnd])
                ->sum('appointment_services.final_cost') ?? 0;
                
            // Pharmacy revenue - query after day_end_timestamp
            $pharmacyRevenue = Sale::whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->where('status', 'completed')
                ->sum('grand_total');
            
            // Laboratory revenue (excluding lab test results) - query after day_end_timestamp
            $appointmentLabServicesRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', [$effectiveStart, $effectiveEnd])
                ->sum('appointment_services.final_cost') ?? 0;
                
            $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereIn('department_id', function ($subQuery) {
                        $subQuery->select('id')
                                 ->from('departments')
                                 ->where('name', 'Laboratory');
                    });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            $laboratoryRevenue = $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
            
            $totalRevenue = $appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue;
        } elseif ($isToday) {
            // Try to get from cache - check all-history first (for refresh button), then today's cache
            $cachedAllHistory = Cache::get('daily_revenue_all_history');
            $cachedRevenue = Cache::get('daily_revenue_' . $todayStr);
            
            // Priority: all-history cache (set by refresh button) > today's cache > database
            if ($cachedAllHistory) {
                // Use all-history cached revenue data (from refresh button)
                $appointmentRevenue = $cachedAllHistory['appointments'] ?? 0;
                $departmentRevenue = $cachedAllHistory['departments'] ?? 0;
                $pharmacyRevenue = $cachedAllHistory['pharmacy'] ?? 0;
                $laboratoryRevenue = $cachedAllHistory['laboratory'] ?? 0;
                $totalRevenue = $cachedAllHistory['total'] ?? ($appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue);
                Log::info('Dashboard Summary Stats - Using all-history cached revenue:', [
                    'appointments' => $appointmentRevenue,
                    'departments' => $departmentRevenue,
                    'pharmacy' => $pharmacyRevenue,
                    'laboratory' => $laboratoryRevenue,
                    'total' => $totalRevenue,
                ]);
            } elseif ($cachedRevenue) {
                // Use today's cached revenue data
                $appointmentRevenue = $cachedRevenue['appointments'] ?? 0;
                $departmentRevenue = $cachedRevenue['departments'] ?? 0;
                $pharmacyRevenue = $cachedRevenue['pharmacy'] ?? 0;
                $laboratoryRevenue = $cachedRevenue['laboratory'] ?? 0;
                $totalRevenue = $cachedRevenue['total'] ?? ($appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue);
                Log::info('Dashboard Summary Stats - Using cached revenue:', [
                    'appointments' => $appointmentRevenue,
                    'departments' => $departmentRevenue,
                    'pharmacy' => $pharmacyRevenue,
                    'laboratory' => $laboratoryRevenue,
                    'total' => $totalRevenue,
                ]);
            } else {
                // Fall back to database query if cache is empty
                Log::info('Dashboard Summary Stats - Cache miss, calculating from database');
                // Appointment revenue (excluding lab department) - FIX: Include ALL non-Lab appointment fees
                // FIX: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
                // FIX: Add whereDoesntHave('services') to match WalletController logic
                $appointmentRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                    ->whereBetween('created_at', $dateRange)
                    ->whereDoesntHave('services')  // Only appointments without services
                    ->where(function ($query) {
                        $query->whereNull('department_id')
                              ->orWhereNotIn('department_id', function ($subQuery) {
                                  $subQuery->select('id')
                                           ->from('departments')
                                           ->where('name', 'Laboratory');
                              });
                    })
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                    
                // Department revenue (non-Laboratory services)
                $departmentRevenue = DB::table('appointment_services')
                    ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->join('departments', 'department_services.department_id', '=', 'departments.id')
                    ->whereIn('appointments.status', ['completed', 'confirmed'])
                    ->where('departments.name', '!=', 'Laboratory')
                    ->whereBetween('appointment_services.created_at', $dateRange)
                    ->sum('appointment_services.final_cost') ?? 0;
                    
                // Pharmacy revenue
                $pharmacyRevenue = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum('grand_total');
                
                // Laboratory revenue (excluding lab test results)
                $appointmentLabServicesRevenue = DB::table('appointment_services')
                    ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->join('departments', 'department_services.department_id', '=', 'departments.id')
                    ->whereIn('appointments.status', ['completed', 'confirmed'])
                    ->where('departments.name', '=', 'Laboratory')
                    ->whereBetween('appointment_services.created_at', $dateRange)
                    ->sum('appointment_services.final_cost') ?? 0;
                    
                $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                    ->whereBetween('created_at', $dateRange)
                    ->whereDoesntHave('services')
                    ->where(function ($query) {
                        $query->whereIn('department_id', function ($subQuery) {
                            $subQuery->select('id')
                                     ->from('departments')
                                     ->where('name', 'Laboratory');
                        });
                    })
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                    
                $laboratoryRevenue = $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
                
                $totalRevenue = $appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue;
            }
        } else {
            // For non-today periods, calculate from database
            // Appointment revenue (excluding lab department) - FIX: Include ALL non-Lab appointment fees
            // FIX: Add whereDoesntHave('services') to match WalletController logic
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $appointmentRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', $dateRange)
                ->whereDoesntHave('services')  // Only appointments without services
                ->where(function ($query) {
                    $query->whereNull('department_id')
                          ->orWhereNotIn('department_id', function ($subQuery) {
                              $subQuery->select('id')
                                       ->from('departments')
                                       ->where('name', 'Laboratory');
                          });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            // Department revenue (non-Laboratory services)
            $departmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '!=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', $dateRange)
                ->sum('appointment_services.final_cost') ?? 0;
                
            // Pharmacy revenue - FIX: For all-time queries, don't use whereBetween with extreme dates
            // Check if end date is in far future (all-time query)
            if ($end->year > 2100) {
                // All-time query: skip date filter
                $pharmacyRevenue = Sale::where('status', 'completed')
                    ->sum('grand_total');
            } else {
                // Normal date range query
                $pharmacyRevenue = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum('grand_total');
            }
            
            // DEBUG: Log pharmacy revenue calculation for non-today periods
            Log::info('DEBUG Pharmacy Revenue (Non-Today):', [
                'calculated_revenue' => $pharmacyRevenue,
                'date_range' => [$start->toDateTimeString(), $end->toDateTimeString()],
                'is_all_time' => $end->year > 2100,
            ]);
            
            // Laboratory revenue (excluding lab test results - only appointments and services)
            $appointmentLabServicesRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', $dateRange)
                ->sum('appointment_services.final_cost') ?? 0;
                
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', $dateRange)
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereIn('department_id', function ($subQuery) {
                        $subQuery->select('id')
                                 ->from('departments')
                                 ->where('name', 'Laboratory');
                    });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            $laboratoryRevenue = $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
            
            $totalRevenue = $appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue;
        }
        
        return [
            'total_patients' => $totalPatients,
            'new_patients' => Patient::whereBetween('created_at', $dateRange)->count(),
            'total_doctors' => $totalDoctors,
            'total_departments' => $totalDepartments,
            'total_appointments' => Appointment::whereBetween('appointment_date', $dateRange)->count(),
            'completed_appointments' => Appointment::whereBetween('appointment_date', $dateRange)
                ->whereIn('status', ['completed', 'confirmed'])
                ->count(),
            'total_revenue' => $totalRevenue,
            'appointment_revenue' => $appointmentRevenue,
            'department_revenue' => $departmentRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_revenue' => $laboratoryRevenue,
        ];
    }

    /**
     * Get patient statistics
     */
    protected function getPatientStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Gender distribution
        $genderStats = Patient::select('gender', DB::raw('COUNT(*) as count'))
            ->groupBy('gender')
            ->pluck('count', 'gender')
            ->toArray();
            
        // Age groups
        $ageGroups = Patient::select(
            DB::raw('CASE 
                WHEN age < 18 THEN "0-17"
                WHEN age BETWEEN 18 AND 30 THEN "18-30"
                WHEN age BETWEEN 31 AND 45 THEN "31-45"
                WHEN age BETWEEN 46 AND 60 THEN "46-60"
                ELSE "60+" 
            END as age_group'),
            DB::raw('COUNT(*) as count')
        )
        ->groupBy('age_group')
        ->pluck('count', 'age_group')
        ->toArray();
        
        // Blood group distribution
        $bloodGroups = Patient::select('blood_group', DB::raw('COUNT(*) as count'))
            ->whereNotNull('blood_group')
            ->groupBy('blood_group')
            ->pluck('count', 'blood_group')
            ->toArray();
        
        return [
            'total' => Patient::count(),
            'new_today' => Patient::whereDate('created_at', today())->count(),
            'new_this_period' => Patient::whereBetween('created_at', $dateRange)->count(),
            'gender_distribution' => $genderStats,
            'age_distribution' => $ageGroups,
            'blood_group_distribution' => $bloodGroups,
        ];
    }

    /**
     * Get appointment statistics
     */
    protected function getAppointmentStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Status breakdown
        $statusBreakdown = Appointment::whereBetween('appointment_date', $dateRange)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
            
        // Include 'confirmed' in completed count for backwards compatibility
        $completedCount = ($statusBreakdown['completed'] ?? 0) + ($statusBreakdown['confirmed'] ?? 0);
            
        // Department-wise appointments
        $deptAppointments = Appointment::whereBetween('appointment_date', $dateRange)
            ->join('departments', 'appointments.department_id', '=', 'departments.id')
            ->select('departments.name', DB::raw('COUNT(*) as count'))
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'name')
            ->toArray();
            
        // Today's schedule
        $todayAppointments = Appointment::with(['patient', 'doctor', 'department'])
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_date')
            ->limit(10)
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient?->full_name ?? 'N/A',
                    'doctor_name' => $apt->doctor?->full_name ?? 'N/A',
                    'department' => $apt->department?->name ?? 'N/A',
                    'time' => Carbon::parse($apt->appointment_date)->format('H:i'),
                    'status' => $apt->status,
                ];
            });
        
        return [
            'total' => array_sum($statusBreakdown),
            'by_status' => $statusBreakdown,
            'by_department' => $deptAppointments,
            'today_schedule' => $todayAppointments,
            'upcoming_count' => Appointment::where('appointment_date', '>', now())
                ->whereIn('status', ['scheduled', 'rescheduled', 'confirmed'])
                ->count(),
            'completed_count' => $completedCount,
        ];
    }

    /**
     * Get financial statistics
     */
    protected function getFinancialStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Check if this is "today" period and day_end_timestamp exists
        $isToday = $start->isToday() && $end->isToday();
        $todayStr = Carbon::today()->toDateString();
        $dayEndTimestamp = Cache::get('day_end_timestamp_' . $todayStr);
        
        // Determine effective start time for today queries
        $effectiveStart = $start;
        $effectiveEnd = $end;
        
        if ($isToday && $dayEndTimestamp) {
            // Only query transactions AFTER the day_end_timestamp
            $effectiveStart = Carbon::parse($dayEndTimestamp)->startOfDay();
            Log::info('Dashboard Financial Stats - Day end timestamp found, querying after: ' . $dayEndTimestamp);
        }
        
        // If today and day_end_timestamp exists, show revenue from transactions AFTER that timestamp
        if ($isToday && $dayEndTimestamp) {
            Log::info('Dashboard Financial Stats - Using day_end_timestamp, querying after: ' . $dayEndTimestamp);
            // Revenue breakdown - use consistent column names (grand_total)
            // Appointment revenue (doctor consultation fees, excluding lab dept)
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $appointmentRevenue = Appointment::whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->whereIn('status', ['completed', 'confirmed'])
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereNull('department_id')
                          ->orWhereNotIn('department_id', function ($subQuery) {
                              $subQuery->select('id')
                                       ->from('departments')
                                       ->where('name', 'Laboratory');
                          });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            // Department revenue (non-Laboratory department services)
            $departmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '!=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', [$effectiveStart, $effectiveEnd])
                ->sum('appointment_services.final_cost') ?? 0;
                
            // Pharmacy revenue
            $pharmacyRevenue = Sale::whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->where('status', 'completed')
                ->sum('grand_total');
            
            // Laboratory revenue (lab tests + lab department services + lab appointments)
            $appointmentLabServicesRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', [$effectiveStart, $effectiveEnd])
                ->sum('appointment_services.final_cost') ?? 0;
                
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', [$effectiveStart, $effectiveEnd])
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereIn('department_id', function ($subQuery) {
                        $subQuery->select('id')
                                 ->from('departments')
                                 ->where('name', 'Laboratory');
                    });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            
            $laboratoryRevenue = $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
        } else {
            // For normal queries (no day_end_timestamp), use the full date range
            // Revenue breakdown - use consistent column names (grand_total)
            // Appointment revenue (doctor consultation fees, excluding lab dept) - FIX: Include ALL non-Lab appointment fees
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $appointmentRevenue = Appointment::whereBetween('created_at', $dateRange)
                ->whereIn('status', ['completed', 'confirmed'])
                ->whereDoesntHave('services')  // Only appointments without services
                ->where(function ($query) {
                    $query->whereNull('department_id')
                          ->orWhereNotIn('department_id', function ($subQuery) {
                              $subQuery->select('id')
                                       ->from('departments')
                                       ->where('name', 'Laboratory');
                          });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            
            // Department revenue (non-Laboratory department services)
            $departmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '!=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', $dateRange)
                ->sum('appointment_services.final_cost') ?? 0;
                
            // Pharmacy revenue - FIX: For all-time queries, don't use whereBetween with extreme dates
            [$start, $end] = $dateRange;
            if ($end->year > 2100) {
                // All-time query: skip date filter
                $pharmacyRevenue = Sale::where('status', 'completed')
                    ->sum('grand_total');
            } else {
                // Normal date range query
                $pharmacyRevenue = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum('grand_total');
            }
            
            // Laboratory revenue (lab department services + lab appointments only)
            $appointmentLabServicesRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '=', 'Laboratory')
                ->whereBetween('appointment_services.created_at', $dateRange)
                ->sum('appointment_services.final_cost') ?? 0;
                
            // FIX: Use created_at instead of appointment_date for consistency with WalletController
            $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('created_at', $dateRange)
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereIn('department_id', function ($subQuery) {
                        $subQuery->select('id')
                                 ->from('departments')
                                 ->where('name', 'Laboratory');
                    });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                
            $laboratoryRevenue = $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
        }
        
        // Payment methods
        $paymentMethods = Payment::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->payment_method => [
                    'amount' => $item->total,
                    'count' => $item->count,
                ]];
            })
            ->toArray();
        
        return [
            'total_revenue' => $appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $laboratoryRevenue,
            'appointment_revenue' => $appointmentRevenue,
            'department_revenue' => $departmentRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_revenue' => $laboratoryRevenue,
            'payment_methods' => $paymentMethods,
        ];
    }

    /**
     * Get pharmacy statistics
     */
    protected function getPharmacyStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Low stock alerts
        $lowStockCount = Medicine::whereColumn('stock_quantity', '<=', 'reorder_level')->count();
        
        // Expiring medicines (next 30 days)
        $expiringCount = Medicine::whereBetween('expiry_date', [today(), today()->addDays(30)])->count();
        
        // Expired medicines
        $expiredCount = Medicine::where('expiry_date', '<', today())->count();
        
        // Top selling medicines
        $topMedicines = DB::table('sales_items')
            ->join('medicines', 'sales_items.medicine_id', '=', 'medicines.id')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', $dateRange)
            ->where('sales.status', 'completed')
            ->select('medicines.name', DB::raw('SUM(sales_items.quantity) as total_sold'))
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->pluck('total_sold', 'name')
            ->toArray();
        
        // Check cache for today's revenue (from refresh button)
        $todayStr = Carbon::today()->toDateString();
        $cachedAllHistory = Cache::get('daily_revenue_all_history');
        $cachedRevenue = Cache::get('daily_revenue_' . $todayStr);
        
        if ($cachedAllHistory) {
            $todayRevenue = $cachedAllHistory['pharmacy'] ?? 0;
        } elseif ($cachedRevenue) {
            $todayRevenue = $cachedRevenue['pharmacy'] ?? 0;
        } else {
            $todayRevenue = Sale::whereDate('created_at', today())->where('status', 'completed')->sum('grand_total');
        }
        
        // FIX: For all-time queries, don't use whereBetween with extreme dates
        if ($end->year > 2100) {
            $periodRevenue = Sale::where('status', 'completed')->sum('grand_total');
        } else {
            $periodRevenue = Sale::whereBetween('created_at', $dateRange)->where('status', 'completed')->sum('grand_total');
        }
        
        return [
            'today_sales' => Sale::whereDate('created_at', today())->where('status', 'completed')->count(),
            'today_revenue' => $todayRevenue,
            'period_revenue' => $periodRevenue,
            'low_stock_count' => $lowStockCount,
            'expiring_count' => $expiringCount,
            'expired_count' => $expiredCount,
            'total_medicines' => Medicine::count(),
            'top_medicines' => $topMedicines,
            'pending_prescriptions' => Prescription::where('status', 'pending')->count(),
        ];
    }

    /**
     * Get laboratory statistics
     */
    protected function getLaboratoryStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Test status breakdown
        $testStatuses = LabTestRequest::whereBetween('created_at', $dateRange)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        // Today's tests
        $todayTests = LabTestRequest::whereDate('created_at', today())->count();
        $completedToday = LabTestRequest::whereDate('updated_at', today())
            ->where('status', 'completed')
            ->count();
        
        // Pending critical tests
        $pendingTests = LabTestRequest::where('status', 'pending')
            ->with(['patient', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($test) {
                return [
                    'id' => $test->id,
                    'test_type' => $test->test_type,
                    'patient_name' => $test->patient?->full_name ?? 'N/A',
                    'doctor_name' => $test->doctor?->full_name ?? 'N/A',
                    'requested_at' => $test->created_at->diffForHumans(),
                ];
            });
        
        return [
            'total_today' => $todayTests,
            'completed_today' => $completedToday,
            'pending_count' => LabTestRequest::where('status', 'pending')->count(),
            'by_status' => $testStatuses,
            'pending_tests' => $pendingTests,
        ];
    }

    /**
     * Get department statistics
     */
    protected function getDepartmentStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        $departments = Department::withCount(['doctors', 'appointments'])
            ->get()
            ->map(function ($dept) use ($dateRange) {
                $revenue = Appointment::where('department_id', $dept->id)
                    ->whereBetween('appointment_date', $dateRange)
                    ->where('status', 'completed')
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
                    
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'doctors_count' => $dept->doctors_count,
                    'appointments_count' => $dept->appointments_count,
                    'revenue' => $revenue,
                ];
            })
            ->sortByDesc('appointments_count')
            ->values()
            ->toArray();
        
        return [
            'total' => count($departments),
            'departments' => $departments,
        ];
    }

    /**
     * Get recent activities
     */
    protected function getRecentActivities(int $limit = 20): array
    {
        return AuditLog::select('id', 'user_id', 'user_name', 'user_role', 'action', 'description', 'module', 'logged_at')
            ->whereIn('module', ['patients', 'appointments', 'billing', 'doctors', 'pharmacy', 'laboratory'])
            ->orderBy('logged_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user_name ?? 'System',
                    'user_role' => $log->user_role ?? 'System',
                    'title' => $this->formatActivityTitle($log->action),
                    'description' => $log->description ?? $log->action,
                    'time' => $log->logged_at->diffForHumans(),
                    'type' => $log->module ?? 'system',
                ];
            })
            ->toArray();
    }

    /**
     * Get admin activities for dashboard
     */
    public function getAdminActivities(int $limit = 20): array
    {
        return AuditLog::with('user')
            ->select('id', 'user_id', 'user_name', 'user_role', 'action', 'description', 'module', 'severity', 'logged_at', 'ip_address')
            ->orderBy('logged_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user_name ?? 'System',
                    'user_role' => $log->user_role ?? 'System',
                    'action' => $log->action,
                    'description' => $log->description ?? $log->action,
                    'module' => $log->module ?? 'system',
                    'severity' => $log->severity ?? 'low',
                    'time' => $log->logged_at->diffForHumans(),
                    'timestamp' => $log->logged_at->toIso8601String(),
                    'ip_address' => $log->ip_address,
                ];
            })
            ->toArray();
    }

    /**
     * Get admin user statistics
     */
    public function getAdminStats(): array
    {
        $adminRoles = ['Super Admin', 'Sub Super Admin', 'Hospital Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'];
        
        // Get admin users with their activity counts
        $adminUsers = \App\Models\User::whereIn('role', $adminRoles)
            ->orWhereHas('roleModel', function ($query) use ($adminRoles) {
                $query->whereIn('name', $adminRoles);
            })
            ->withCount(['auditLogs' => function ($query) {
                $query->where('logged_at', '>=', now()->subDays(7));
            }])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->roleModel?->name ?? $user->role,
                    'last_login' => $user->last_login_at?->diffForHumans() ?? 'Never',
                    'activity_count' => $user->audit_logs_count,
                    'is_online' => $user->last_login_at && $user->last_login_at->gt(now()->subMinutes(30)),
                ];
            });

        // Get activity by module for last 7 days
        $activityByModule = AuditLog::where('logged_at', '>=', now()->subDays(7))
            ->select('module', DB::raw('COUNT(*) as count'))
            ->groupBy('module')
            ->pluck('count', 'module')
            ->toArray();

        return [
            'total_admins' => $adminUsers->count(),
            'online_admins' => $adminUsers->where('is_online', true)->count(),
            'admin_users' => $adminUsers->toArray(),
            'activity_by_module' => $activityByModule,
            'total_activities_24h' => AuditLog::where('logged_at', '>=', now()->subDay())->count(),
            'total_activities_7d' => AuditLog::where('logged_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /**
     * Get trends data for charts
     */
    protected function getTrendsData(): array
    {
        // Daily trend for last 7 days
        $dailyTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dailyTrends[] = [
                'date' => $date->format('M d'),
                'appointments' => Appointment::whereDate('appointment_date', $date)->count(),
                'patients' => Patient::whereDate('created_at', $date)->count(),
                'revenue' => Appointment::whereDate('appointment_date', $date)
                    ->where('status', 'completed')
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0))),
            ];
        }
        
        // Monthly trend for last 6 months
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'appointments' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count(),
                'patients' => Patient::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count(),
                'revenue' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->where('status', 'completed')
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0))),
            ];
        }
        
        return [
            'daily' => $dailyTrends,
            'monthly' => $monthlyTrends,
        ];
    }

    /**
     * Format activity title
     */
    protected function formatActivityTitle(string $action): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $action));
    }

    /**
     * Get default stats when error occurs
     */
    protected function getDefaultStats(): array
    {
        return [
            'summary' => [
                'total_patients' => 0,
                'new_patients' => 0,
                'total_doctors' => 0,
                'total_departments' => 0,
                'total_appointments' => 0,
                'completed_appointments' => 0,
                'total_revenue' => 0,
                'appointment_revenue' => 0,
                'pharmacy_revenue' => 0,
            ],
            'patients' => [
                'total' => 0,
                'new_today' => 0,
                'new_this_period' => 0,
                'gender_distribution' => [],
                'age_distribution' => [],
                'blood_group_distribution' => [],
            ],
            'appointments' => [
                'total' => 0,
                'by_status' => [],
                'by_department' => [],
                'today_schedule' => [],
                'upcoming_count' => 0,
            ],
            'financial' => [
                'total_revenue' => 0,
                'appointment_revenue' => 0,
                'pharmacy_revenue' => 0,
                'payment_methods' => [],
            ],
            'pharmacy' => [
                'today_sales' => 0,
                'today_revenue' => 0,
                'period_revenue' => 0,
                'low_stock_count' => 0,
                'expiring_count' => 0,
                'expired_count' => 0,
                'total_medicines' => 0,
                'top_medicines' => [],
                'pending_prescriptions' => 0,
            ],
            'laboratory' => [
                'total_today' => 0,
                'completed_today' => 0,
                'pending_count' => 0,
                'by_status' => [],
                'pending_tests' => [],
            ],
            'departments' => [
                'total' => 0,
                'departments' => [],
            ],
            'recent_activities' => [],
            'trends' => [
                'daily' => [],
                'monthly' => [],
            ],
            'period' => 'today',
            'last_updated' => now()->toIso8601String(),
        ];
    }

    /**
     * Get all-time cumulative statistics
     */
    public function getAllTimeStats(): array
    {
        try {
            // Total patients (all time)
            $totalPatients = Patient::count();
            
            // Total appointments (all time)
            $totalAppointments = Appointment::count();
            
            // Total revenue from all completed appointments (all time)
            $totalAppointmentRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            
            // Department services revenue (all time)
            $departmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->sum('appointment_services.final_cost') ?? 0;
            
            // Pharmacy revenue (all time)
            $pharmacyRevenue = Sale::where('status', 'completed')->sum('grand_total');
            
            // Total revenue (appointments + departments + pharmacy)
            $totalRevenue = $totalAppointmentRevenue + $departmentRevenue + $pharmacyRevenue;
            
            // Pharmacy profit calculation: revenue - cost
            // Get total cost from sales_items
            $pharmacyCost = SalesItem::join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->where('sales.status', 'completed')
                ->sum(DB::raw('sales_items.cost_price * sales_items.quantity')) ?? 0;
            
            $pharmacyProfit = $pharmacyRevenue - $pharmacyCost;
            
            Log::info('Pharmacy Profit Calculation - All Time', [
                'revenue' => $pharmacyRevenue,
                'cost' => $pharmacyCost,
                'profit' => $pharmacyProfit,
            ]);
            
            // Today's stats for comparison
            $todayPatients = Patient::whereDate('created_at', today())->count();
            $todayAppointments = Appointment::whereDate('appointment_date', today())->count();
            
            // Today's pharmacy profit
            $todayPharmacyRevenue = Sale::whereDate('created_at', today())
                ->where('status', 'completed')
                ->sum('grand_total');
            
            $todayPharmacyCost = SalesItem::join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->where('sales.status', 'completed')
                ->whereDate('sales.created_at', today())
                ->sum(DB::raw('sales_items.cost_price * sales_items.quantity')) ?? 0;
            
            $todayPharmacyProfit = $todayPharmacyRevenue - $todayPharmacyCost;
            
            Log::info('Pharmacy Profit Calculation - Today', [
                'revenue' => $todayPharmacyRevenue,
                'cost' => $todayPharmacyCost,
                'profit' => $todayPharmacyProfit,
            ]);
            
            // Today's appointment revenue
            $todayAppointmentRevenue = Appointment::whereDate('appointment_date', today())
                ->whereIn('status', ['completed', 'confirmed'])
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            
            // Today's department revenue
            $todayDepartmentRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->whereDate('appointment_services.created_at', today())
                ->sum('appointment_services.final_cost') ?? 0;
            
            // Today's total revenue (appointments + departments + pharmacy + laboratory)
            $todayLabRevenue = DB::table('lab_test_results')
                ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
                ->whereDate('lab_test_results.performed_at', today())
                ->sum('lab_tests.cost') ?? 0;
            
            $todayAppointmentLabServicesRevenue = DB::table('appointment_services')
                ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->join('departments', 'department_services.department_id', '=', 'departments.id')
                ->whereIn('appointments.status', ['completed', 'confirmed'])
                ->where('departments.name', '=', 'Laboratory')
                ->whereDate('appointment_services.created_at', today())
                ->sum('appointment_services.final_cost') ?? 0;
            
            $todayLabDeptAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereDate('appointment_date', today())
                ->whereDoesntHave('services')
                ->where(function ($query) {
                    $query->whereIn('department_id', function ($subQuery) {
                        $subQuery->select('id')
                                 ->from('departments')
                                 ->where('name', 'Laboratory');
                    });
                })
                ->get()
                ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            
            $todayLaboratoryRevenue = $todayLabRevenue + $todayAppointmentLabServicesRevenue + $todayLabDeptAppointmentsRevenue;
            
            $todayTotalRevenue = $todayAppointmentRevenue + $todayDepartmentRevenue + $todayPharmacyRevenue + $todayLaboratoryRevenue;
            
            return [
                'total_patients' => $totalPatients,
                'total_appointments' => $totalAppointments,
                'total_revenue' => $totalRevenue,
                'pharmacy_revenue' => $pharmacyRevenue,
                'pharmacy_profit' => $pharmacyProfit,
                'today_patients' => $todayPatients,
                'today_appointments' => $todayAppointments,
                'today_revenue' => $todayTotalRevenue,
                'today_appointment_revenue' => $todayAppointmentRevenue,
                'today_pharmacy_profit' => $todayPharmacyProfit,
            ];
        } catch (\Exception $e) {
            Log::error('All-time stats error: ' . $e->getMessage());
            return [
                'total_patients' => 0,
                'total_appointments' => 0,
                'total_revenue' => 0,
                'pharmacy_revenue' => 0,
                'pharmacy_profit' => 0,
                'today_patients' => 0,
                'today_appointments' => 0,
                'today_revenue' => 0,
                'today_appointment_revenue' => 0,
                'today_pharmacy_profit' => 0,
            ];
        }
    }

    /**
     * Get discount statistics
     */
    public function getDiscountStats(): array
    {
        try {
            // Discounts from appointments (all time)
            $appointmentDiscounts = Appointment::sum('discount') ?? 0;
            
            // Discounts from pharmacy sales (all time)
            $pharmacyDiscounts = Sale::sum('discount') ?? 0;
            
            // Discounts from department services (all time)
            $serviceDiscounts = DB::table('appointment_services')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->sum(DB::raw('GREATEST(0, department_services.base_cost - COALESCE(appointment_services.final_cost, 0))')) ?? 0;
            
            // Today's discounts
            $todayAppointmentDiscounts = Appointment::whereDate('appointment_date', today())
                ->sum('discount') ?? 0;
            
            $todayPharmacyDiscounts = Sale::whereDate('created_at', today())
                ->where('status', 'completed')
                ->sum('discount') ?? 0;
            
            $todayServiceDiscounts = DB::table('appointment_services')
                ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                ->whereDate('appointment_services.created_at', today())
                ->sum(DB::raw('GREATEST(0, department_services.base_cost - COALESCE(appointment_services.final_cost, 0))')) ?? 0;
            
            $totalDiscounts = $appointmentDiscounts + $pharmacyDiscounts + $serviceDiscounts;
            $todayTotalDiscounts = $todayAppointmentDiscounts + $todayPharmacyDiscounts + $todayServiceDiscounts;
            
            return [
                'appointment_discounts' => $appointmentDiscounts,
                'pharmacy_discounts' => $pharmacyDiscounts,
                'service_discounts' => $serviceDiscounts,
                'total_discounts' => $totalDiscounts,
                'today_appointment_discounts' => $todayAppointmentDiscounts,
                'today_pharmacy_discounts' => $todayPharmacyDiscounts,
                'today_service_discounts' => $todayServiceDiscounts,
                'today_total_discounts' => $todayTotalDiscounts,
            ];
        } catch (\Exception $e) {
            Log::error('Discount stats error: ' . $e->getMessage());
            return [
                'appointment_discounts' => 0,
                'pharmacy_discounts' => 0,
                'service_discounts' => 0,
                'total_discounts' => 0,
                'today_appointment_discounts' => 0,
                'today_pharmacy_discounts' => 0,
                'today_service_discounts' => 0,
                'today_total_discounts' => 0,
            ];
        }
    }

    /**
     * Get revenue with discount breakdown for a date range
     * Similar to discount stats but returns both gross and net revenue
     */
    public function getRevenueWithDiscounts(array $dateRange): array
    {
        try {
            [$start, $end] = $dateRange;
            
            // Check if this is an all-time query (end year > 2100)
            $isAllTime = $end->year > 2100;
            
            // Pharmacy Revenue (with discount breakdown)
            if ($isAllTime) {
                $pharmacyGross = Sale::where('status', 'completed')
                    ->sum(DB::raw('total_amount + tax')); // Before discount
                $pharmacyDiscounts = Sale::where('status', 'completed')
                    ->sum('discount');
                $pharmacyNet = Sale::where('status', 'completed')
                    ->sum('grand_total'); // After discount
            } else {
                $pharmacyGross = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum(DB::raw('total_amount + tax'));
                $pharmacyDiscounts = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum('discount');
                $pharmacyNet = Sale::whereBetween('created_at', $dateRange)
                    ->where('status', 'completed')
                    ->sum('grand_total');
            }
            
            // Appointment Revenue (with discount breakdown)
            if ($isAllTime) {
                $appointmentGross = Appointment::whereIn('status', ['completed', 'confirmed'])
                    ->sum('fee');
                $appointmentDiscounts = Appointment::whereIn('status', ['completed', 'confirmed'])
                    ->sum('discount');
                $appointmentNet = Appointment::whereIn('status', ['completed', 'confirmed'])
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            } else {
                $appointmentGross = Appointment::whereBetween('appointment_date', $dateRange)
                    ->whereIn('status', ['completed', 'confirmed'])
                    ->sum('fee');
                $appointmentDiscounts = Appointment::whereBetween('appointment_date', $dateRange)
                    ->whereIn('status', ['completed', 'confirmed'])
                    ->sum('discount');
                $appointmentNet = Appointment::whereBetween('appointment_date', $dateRange)
                    ->whereIn('status', ['completed', 'confirmed'])
                    ->get()
                    ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
            }
            
            // Department Services Revenue (with discount breakdown)
            if ($isAllTime) {
                $servicesGross = DB::table('appointment_services')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->sum('department_services.base_cost');
                $servicesDiscounts = DB::table('appointment_services')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->sum(DB::raw('GREATEST(0, department_services.base_cost - COALESCE(appointment_services.final_cost, 0))'));
                $servicesNet = DB::table('appointment_services')
                    ->sum('appointment_services.final_cost');
            } else {
                $servicesGross = DB::table('appointment_services')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->whereBetween('appointment_services.created_at', $dateRange)
                    ->sum('department_services.base_cost');
                $servicesDiscounts = DB::table('appointment_services')
                    ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
                    ->whereBetween('appointment_services.created_at', $dateRange)
                    ->sum(DB::raw('GREATEST(0, department_services.base_cost - COALESCE(appointment_services.final_cost, 0))'));
                $servicesNet = DB::table('appointment_services')
                    ->whereBetween('appointment_services.created_at', $dateRange)
                    ->sum('appointment_services.final_cost');
            }
            
            return [
                'pharmacy' => [
                    'gross' => $pharmacyGross ?? 0,
                    'discounts' => $pharmacyDiscounts ?? 0,
                    'net' => $pharmacyNet ?? 0,
                ],
                'appointments' => [
                    'gross' => $appointmentGross ?? 0,
                    'discounts' => $appointmentDiscounts ?? 0,
                    'net' => $appointmentNet ?? 0,
                ],
                'services' => [
                    'gross' => $servicesGross ?? 0,
                    'discounts' => $servicesDiscounts ?? 0,
                    'net' => $servicesNet ?? 0,
                ],
                'total' => [
                    'gross' => ($pharmacyGross + $appointmentGross + $servicesGross) ?? 0,
                    'discounts' => ($pharmacyDiscounts + $appointmentDiscounts + $servicesDiscounts) ?? 0,
                    'net' => ($pharmacyNet + $appointmentNet + $servicesNet) ?? 0,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Revenue with discounts error: ' . $e->getMessage());
            return [
                'pharmacy' => ['gross' => 0, 'discounts' => 0, 'net' => 0],
                'appointments' => ['gross' => 0, 'discounts' => 0, 'net' => 0],
                'services' => ['gross' => 0, 'discounts' => 0, 'net' => 0],
                'total' => ['gross' => 0, 'discounts' => 0, 'net' => 0],
            ];
        }
    }
}