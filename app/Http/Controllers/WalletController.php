<?php

namespace App\Http\Controllers;

use App\Events\WalletUpdated;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Sale;
use App\Models\Appointment;
use App\Models\LabTestRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    /**
     * Display the wallet dashboard with revenue tracking.
     */
    public function index()
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        $revenueData = $this->getRevenueData();

        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        // Compute a display balance fallback using payments + completed sales
        $computedRevenue = Payment::where('status', 'completed')->sum('amount')
            + Sale::where('status', 'completed')->sum('grand_total');

        $displayBalance = $wallet->balance > 0 ? $wallet->balance : $computedRevenue;

        return Inertia::render('Wallet/Index', [
            'wallet' => $wallet,
            'displayBalance' => $displayBalance,
            'revenueData' => $revenueData,
            'transactions' => $transactions,
            'auth' => [
                'user' => auth()->user(),
            ],
        ]);
    }

    /**
     * Get revenue data for different time periods and sources.
     * Always queries the database directly for real-time data.
     */
    private function getRevenueData()
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $todayStr = $today->toDateString();

        // Check if day_end_timestamp exists - Manual day detection
        // If cache exists, use stored timestamp (set when button is clicked)
        // If cache doesn't exist, use today's start to show only today's data
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // Default to today's start if no cache exists - show actual today's data
        $defaultStartDate = Carbon::today()->startOfDay();

        Log::info('WalletController getRevenueData - Start', [
            'dayEndTimestamp' => $dayEndTimestamp,
            'current_time' => now()->toISOString(),
        ]);

        // Determine the effective start time for today queries
        // If day_end_timestamp exists, only query transactions AFTER that timestamp
        // If no cache exists, use today's start to show only today's data
        $effectiveStartTime = $defaultStartDate;
        if ($dayEndTimestamp) {
            // FIXED: Parse timestamp and convert to application timezone
            $effectiveStartTime = Carbon::parse($dayEndTimestamp)->setTimezone(config('app.timezone'));
            Log::info('WalletController getRevenueData - Day end timestamp found, querying after: ' . $dayEndTimestamp);
        }

        Log::info('WalletController getRevenueData - Effective date range', [
            'effectiveStartTime' => $effectiveStartTime->toISOString(),
            'tomorrow' => $tomorrow->toISOString(),
        ]);

        $periods = [
            'today' => [$effectiveStartTime, $tomorrow],
            'this_week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'this_month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'this_year' => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
        ];

        $data = [];

        foreach ($periods as $period => $dates) {
            try {
                $data[$period] = [
                    'appointments' => $this->getAppointmentRevenue($dates[0], $dates[1]) ?? 0,
                    'departments' => $this->getDepartmentRevenue($dates[0], $dates[1]) ?? 0,
                    'pharmacy' => $this->getPharmacyRevenue($dates[0], $dates[1]) ?? 0,
                    'laboratory' => $this->getLaboratoryRevenue($dates[0], $dates[1]) ?? 0,
                    'total' => 0,
                ];

                $data[$period]['total'] = $data[$period]['appointments'] +
                                         $data[$period]['departments'] +
                                         $data[$period]['pharmacy'] +
                                         $data[$period]['laboratory'];
                                         
                Log::info('WalletController getRevenueData - Period result', [
                    'period' => $period,
                    'data' => $data[$period],
                ]);
            } catch (\Exception $e) {
                Log::error('WalletController getRevenueData - Exception for period: ' . $period, [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                // Return default structure on error
                $data[$period] = [
                    'appointments' => 0,
                    'departments' => 0,
                    'pharmacy' => 0,
                    'laboratory' => 0,
                    'total' => 0,
                ];
            }
        }

        // Add day_end_timestamp to the result for frontend reference
        $data['day_end_timestamp'] = $dayEndTimestamp;

        Log::info('WalletController getRevenueData - Complete', [
            'data' => $data,
        ]);

        return $data;
    }

    /**
     * Get appointment revenue for a date range.
     * Calculates from completed appointments ONLY using doctor consultation fee (fee - discount).
     * Services are tracked separately in getDepartmentRevenue().
     * Excludes laboratory department appointments (counted in laboratory revenue instead).
     */
    private function getAppointmentRevenue(Carbon $start, Carbon $end)
    {
        // Get completed appointments WITHOUT services AND NOT from Laboratory department
        // Appointments with services are tracked in department revenue instead
        // Laboratory appointments (even without services attached) are tracked in laboratory revenue
        // FIXED: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        $appointments = Appointment::whereIn('status', ['completed', 'confirmed'])
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

    /**
     * Get department service revenue for a date range.
     * Calculates from appointment_services (department services used in appointments).
     * Excludes laboratory services which are counted separately in getLaboratoryRevenue().
     */
    private function getDepartmentRevenue(Carbon $start, Carbon $end)
    {
        // Sum the final_cost from appointment_services for completed appointments
        // Exclude laboratory department services (those are tracked in laboratory revenue)
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        // to properly support day_end_timestamp filtering
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        return DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')  // Exclude laboratory services
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost');
    }

    /**
     * Get pharmacy revenue for a date range.
     */
    private function getPharmacyRevenue(Carbon $start, Carbon $end)
    {
        // Count completed sales as revenue
        // FIXED: Add status filter to match DashboardService
        // Using created_at to track when the sale was actually created in the system
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        return Sale::whereBetween('created_at', [$startLocal, $endLocal])
            ->where('status', 'completed')
            ->sum('grand_total');
    }

    /**
     * Get laboratory revenue for a date range.
     * Includes:
     * 1. Lab test results that are completed or performed
     * 2. Laboratory services from appointments (department services from Laboratory department)
     * 3. Laboratory department appointments (appointments where department is Laboratory)
     */
    private function getLaboratoryRevenue(Carbon $start, Carbon $end)
    {
        // Laboratory revenue now only includes:
        // 1. Laboratory services from appointments (department services)
        // 2. Laboratory department appointments (without services attached)
        // NOTE: Lab test results revenue has been removed to match DashboardService
        // FIXED: Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));

        // Get laboratory services from appointments (department services)
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        // to properly support day_end_timestamp filtering
        $appointmentLabServicesRevenue = DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')  // Only laboratory department services
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost') ?? 0;

        // Get laboratory department appointments (appointments where department=Laboratory and no services attached)
        // These are standalone lab appointments created through the department selection
        // FIXED: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
        $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('created_at', [$startLocal, $endLocal])
            ->whereDoesntHave('services')  // Only appointments without attached services
            ->where(function ($query) {
                // Include only Laboratory department appointments
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

        return $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
    }

    /**
     * Get real-time wallet data for API consumption.
     */
    public function realtime()
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
        $revenueData = $this->getRevenueData();
        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        $computedRevenue = Payment::where('status', 'completed')->sum('amount')
            + Sale::where('status', 'completed')->sum('grand_total');

        $displayBalance = $wallet->balance > 0 ? $wallet->balance : $computedRevenue;

        return response()->json([
            'wallet' => $wallet,
            'displayBalance' => $displayBalance,
            'revenueData' => $revenueData,
            'transactions' => $transactions,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Calculate today's total revenue from all sources.
     * Includes: laboratory services, department services, pharmacy sales, and appointments.
     * 
     * Option B: If day_end_timestamp exists, only count transactions AFTER that timestamp.
     *
     * @param bool $includeAllHistory If true, calculates revenue from ALL dates (ignores date filters)
     */
    public function calculateTodayRevenue(Request $request): JsonResponse
    {
        $includeAllHistory = $request->query('include_all_history', false);
        
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $todayStr = $today->toDateString();

        // Check if day_end_timestamp exists - Manual day detection
        // If cache exists, use stored timestamp (set when button is clicked)
        // If cache doesn't exist, use today's start to show only today's data
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // Default to today's start if no cache exists - show actual today's data
        $defaultStartDate = Carbon::today()->startOfDay();

        Log::info('WalletController calculateTodayRevenue - Request params', [
            'include_all_history' => $includeAllHistory,
            'dayEndTimestamp' => $dayEndTimestamp,
            'current_time' => now()->toISOString(),
        ]);

        // If include_all_history is true, use a very wide date range to include all data
        if ($includeAllHistory) {
            // Use year 2000 as start and year 3000 as end to cover all possible data
            $startDate = Carbon::createFromFormat('Y-m-d H:i:s', '2000-01-01 00:00:00');
            $endDate = Carbon::createFromFormat('Y-m-d H:i:s', '3000-12-31 23:59:59');
            
            // Clear related caches
            Cache::forget('daily_revenue_all_history');
            Cache::forget('daily_revenue_calculated_at_all_history');
        } else {
            // Determine effective start time for today queries
            // If day_end_timestamp exists, only query transactions AFTER that timestamp
            // If no cache exists, use today's start to show only today's data
            if ($dayEndTimestamp) {
                $startDate = Carbon::parse($dayEndTimestamp);
                Log::info('WalletController calculateTodayRevenue - Day end timestamp found, querying after: ' . $dayEndTimestamp);
            } else {
                $startDate = $defaultStartDate;
            }
            $endDate = $tomorrow;
        }

        Log::info('WalletController calculateTodayRevenue - Date range', [
            'startDate' => $startDate->toISOString(),
            'endDate' => $endDate->toISOString(),
        ]);

        // Get revenue from all sources
        try {
            $appointmentsRevenue = $this->getAppointmentRevenue($startDate, $endDate);
            $departmentsRevenue = $this->getDepartmentRevenue($startDate, $endDate);
            $pharmacyRevenue = $this->getPharmacyRevenue($startDate, $endDate);
            $laboratoryRevenue = $this->getLaboratoryRevenue($startDate, $endDate);

            Log::info('WalletController calculateTodayRevenue - Revenue results', [
                'appointmentsRevenue' => $appointmentsRevenue,
                'departmentsRevenue' => $departmentsRevenue,
                'pharmacyRevenue' => $pharmacyRevenue,
                'laboratoryRevenue' => $laboratoryRevenue,
            ]);
        } catch (\Exception $e) {
            Log::error('WalletController calculateTodayRevenue - Exception during revenue calculation', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to calculate revenue: ' . $e->getMessage(),
                'revenue' => null,
            ], 500);
        }

        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;

        // Ensure we always have a valid revenue object, never null
        $revenueData = [
            'total' => $totalRevenue ?? 0,
            'appointments' => $appointmentsRevenue ?? 0,
            'departments' => $departmentsRevenue ?? 0,
            'pharmacy' => $pharmacyRevenue ?? 0,
            'laboratory' => $laboratoryRevenue ?? 0,
        ];

        // Store revenue in cache
        if ($includeAllHistory) {
            Cache::put('daily_revenue_all_history', $revenueData, now()->addDays(30));
            Cache::put('daily_revenue_calculated_at_all_history', now()->toISOString(), now()->addDays(30));
        } else {
            Cache::put('daily_revenue_' . $today->toDateString(), $revenueData, now()->endOfDay());
            Cache::put('daily_revenue_calculated_at_' . $today->toDateString(), now()->toISOString(), now()->endOfDay());
        }

        return response()->json([
            'success' => true,
            'date' => $includeAllHistory ? 'all_history' : $today->toDateString(),
            'include_all_history' => $includeAllHistory,
            'revenue' => $revenueData,
            'day_end_timestamp' => $dayEndTimestamp,
            'breakdown' => [
                'appointments_percentage' => $totalRevenue > 0 ? round(($appointmentsRevenue / $totalRevenue) * 100, 2) : 0,
                'departments_percentage' => $totalRevenue > 0 ? round(($departmentsRevenue / $totalRevenue) * 100, 2) : 0,
                'pharmacy_percentage' => $totalRevenue > 0 ? round(($pharmacyRevenue / $totalRevenue) * 100, 2) : 0,
                'laboratory_percentage' => $totalRevenue > 0 ? round(($laboratoryRevenue / $totalRevenue) * 100, 2) : 0,
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Reset all revenue data and recalculate from ALL historical records.
     * This clears caches and recalculates everything from scratch.
     * Does NOT delete any database data - only clears cached/calculated values.
     */
    public function resetAllRevenueData(): JsonResponse
    {
        // Clear all revenue-related caches
        Cache::forget('daily_revenue_all_history');
        Cache::forget('daily_revenue_calculated_at_all_history');
        
        // Clear today's cache
        $today = Carbon::today()->toDateString();
        Cache::forget('daily_revenue_' . $today);
        Cache::forget('daily_revenue_calculated_at_' . $today);

        // Use year 2000 as start and year 3000 as end to cover all possible data
        $startDate = Carbon::createFromFormat('Y-m-d H:i:s', '2000-01-01 00:00:00');
        $endDate = Carbon::createFromFormat('Y-m-d H:i:s', '3000-12-31 23:59:59');

        // Get revenue from all sources across all time
        $appointmentsRevenue = $this->getAppointmentRevenue($startDate, $endDate);
        $departmentsRevenue = $this->getDepartmentRevenue($startDate, $endDate);
        $pharmacyRevenue = $this->getPharmacyRevenue($startDate, $endDate);
        $laboratoryRevenue = $this->getLaboratoryRevenue($startDate, $endDate);

        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;

        $revenueData = [
            'total' => $totalRevenue,
            'appointments' => $appointmentsRevenue,
            'departments' => $departmentsRevenue,
            'pharmacy' => $pharmacyRevenue,
            'laboratory' => $laboratoryRevenue,
        ];

        // Store the all-history revenue in cache
        Cache::put('daily_revenue_all_history', $revenueData, now()->addDays(30));
        Cache::put('daily_revenue_calculated_at_all_history', now()->toISOString(), now()->addDays(30));

        return response()->json([
            'success' => true,
            'message' => 'All revenue data has been reset and recalculated from all historical records',
            'date' => 'all_history',
            'revenue' => $revenueData,
            'breakdown' => [
                'appointments_percentage' => $totalRevenue > 0 ? round(($appointmentsRevenue / $totalRevenue) * 100, 2) : 0,
                'departments_percentage' => $totalRevenue > 0 ? round(($departmentsRevenue / $totalRevenue) * 100, 2) : 0,
                'pharmacy_percentage' => $totalRevenue > 0 ? round(($pharmacyRevenue / $totalRevenue) * 100, 2) : 0,
                'laboratory_percentage' => $totalRevenue > 0 ? round(($laboratoryRevenue / $totalRevenue) * 100, 2) : 0,
            ],
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get revenue with discount breakdown for a date range.
     * Returns gross revenue, discounts applied, and net revenue for each source.
     */
    public function getRevenueWithDiscounts(Carbon $start, Carbon $end): array
    {
        // Pharmacy Revenue with discounts
        $pharmacyGross = Sale::whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->sum(DB::raw('total_amount + tax')); // Before discount
        $pharmacyDiscounts = Sale::whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->sum('discount');
        $pharmacyNet = Sale::whereBetween('created_at', [$start, $end])
            ->where('status', 'completed')
            ->sum('grand_total'); // After discount

        // Appointment Revenue with discounts
        $appointments = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$start, $end])
            ->whereDoesntHave('services')
            ->where(function ($query) {
                $query->whereNull('department_id')
                      ->orWhereNotIn('department_id', function ($subQuery) {
                          $subQuery->select('id')
                                   ->from('departments')
                                   ->where('name', 'Laboratory');
                      });
            })
            ->get();
        $appointmentGross = $appointments->sum('fee');
        $appointmentDiscounts = $appointments->sum('discount');
        $appointmentNet = $appointments->sum(function ($apt) {
            return max(0, ($apt->fee ?? 0) - ($apt->discount ?? 0));
        });

        // Department Services Revenue with discounts
        $servicesGross = DB::table('appointment_services')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('department_services.base_cost');
        $servicesNet = DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('appointment_services.final_cost');
        $servicesDiscounts = $servicesGross - $servicesNet;

        // Laboratory Revenue with discounts
        $labServicesGross = DB::table('appointment_services')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('department_services.base_cost') ?? 0;
        $labServicesNet = DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('appointment_services.final_cost') ?? 0;
        
        $labAppointments = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$start, $end])
            ->whereDoesntHave('services')
            ->where(function ($query) {
                $query->whereIn('department_id', function ($subQuery) {
                    $subQuery->select('id')
                             ->from('departments')
                             ->where('name', 'Laboratory');
                });
            })
            ->get();
        $labAppointmentGross = $labAppointments->sum('fee');
        $labAppointmentDiscounts = $labAppointments->sum('discount');
        $labAppointmentNet = $labAppointments->sum(function ($apt) {
            return max(0, ($apt->fee ?? 0) - ($apt->discount ?? 0));
        });

        $laboratoryGross = $labServicesGross + $labAppointmentGross;
        $laboratoryDiscounts = ($labServicesGross - $labServicesNet) + $labAppointmentDiscounts;
        $laboratoryNet = $labServicesNet + $labAppointmentNet;

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
            'departments' => [
                'gross' => $servicesGross ?? 0,
                'discounts' => $servicesDiscounts ?? 0,
                'net' => $servicesNet ?? 0,
            ],
            'laboratory' => [
                'gross' => $laboratoryGross ?? 0,
                'discounts' => $laboratoryDiscounts ?? 0,
                'net' => $laboratoryNet ?? 0,
            ],
            'total' => [
                'gross' => ($pharmacyGross + $appointmentGross + $servicesGross + $laboratoryGross) ?? 0,
                'discounts' => ($pharmacyDiscounts + $appointmentDiscounts + $servicesDiscounts + $laboratoryDiscounts) ?? 0,
                'net' => ($pharmacyNet + $appointmentNet + $servicesNet + $laboratoryNet) ?? 0,
            ],
        ];
    }
}
