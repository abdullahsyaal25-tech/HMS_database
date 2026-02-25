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
        ]);
    }

    /**
     * Get revenue data for different time periods and sources.
     */
    private function getRevenueData()
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $todayStr = $today->toDateString();

        $periods = [
            'today' => [$today, $tomorrow],
            'this_week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'this_month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'this_year' => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
        ];

        $data = [];

        foreach ($periods as $period => $dates) {
            // For 'today' period, check if we have cached revenue from button click
            if ($period === 'today') {
                // First check for all-history cached revenue (priority - from refresh button)
                $cachedAllHistory = Cache::get('daily_revenue_all_history');
                if ($cachedAllHistory) {
                    $data[$period] = $cachedAllHistory;
                    continue;
                }
                
                // Then check for today's cached revenue (fallback)
                $cachedRevenue = Cache::get('daily_revenue_' . $todayStr);
                if ($cachedRevenue) {
                    $data[$period] = $cachedRevenue;
                    continue;
                }
            }

            $data[$period] = [
                'appointments' => $this->getAppointmentRevenue($dates[0], $dates[1]),
                'departments' => $this->getDepartmentRevenue($dates[0], $dates[1]),
                'pharmacy' => $this->getPharmacyRevenue($dates[0], $dates[1]),
                'laboratory' => $this->getLaboratoryRevenue($dates[0], $dates[1]),
                'total' => 0,
            ];

            $data[$period]['total'] = $data[$period]['appointments'] +
                                     $data[$period]['departments'] +
                                     $data[$period]['pharmacy'] +
                                     $data[$period]['laboratory'];
        }

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
        $appointments = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->where(function ($query) use ($start, $end) {
                // Include records within date range OR records with NULL dates (historical data)
                $query->whereBetween('appointment_date', [$start, $end])
                      ->orWhereNull('appointment_date');
            })
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
        return DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')  // Exclude laboratory services
            ->where(function ($query) use ($start, $end) {
                // Include records within date range OR records with NULL created_at (historical data)
                $query->whereBetween('appointment_services.created_at', [$start, $end])
                      ->orWhereNull('appointment_services.created_at');
            })
            ->sum('appointment_services.final_cost');
    }

    /**
     * Get pharmacy revenue for a date range.
     */
    private function getPharmacyRevenue(Carbon $start, Carbon $end)
    {
        // Count completed sales as revenue
        return Sale::where('status', 'completed')
            ->where(function ($query) use ($start, $end) {
                // Include records within date range OR records with NULL created_at (historical data)
                $query->whereBetween('created_at', [$start, $end])
                      ->orWhereNull('created_at');
            })
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
        // Get lab test results that are completed OR have been performed
        // FIXED: Include records with NULL performed_at when status is 'completed'
        $labTestResultsRevenue = DB::table('lab_test_results')
            ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
            ->where(function ($query) use ($start, $end) {
                // Include records:
                // 1. With performed_at within date range
                // 2. With NULL performed_at but status is 'completed' (historical data)
                $query->whereBetween('lab_test_results.performed_at', [$start, $end])
                      ->orWhere(function ($q) {
                          $q->whereNull('lab_test_results.performed_at')
                            ->where('lab_test_results.status', 'completed');
                      });
            })
            ->sum('lab_tests.cost');

        // Get laboratory services from appointments (department services)
        $appointmentLabServicesRevenue = DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')  // Only laboratory department services
            ->where(function ($query) use ($start, $end) {
                // Include records within date range OR records with NULL created_at (historical data)
                $query->whereBetween('appointment_services.created_at', [$start, $end])
                      ->orWhereNull('appointment_services.created_at');
            })
            ->sum('appointment_services.final_cost');

        // Get laboratory department appointments (appointments where department=Laboratory and no services attached)
        // These are standalone lab appointments created through the department selection
        $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->where(function ($query) use ($start, $end) {
                // Include records within date range OR records with NULL appointment_date (historical data)
                $query->whereBetween('appointment_date', [$start, $end])
                      ->orWhereNull('appointment_date');
            })
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

        return $labTestResultsRevenue + $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;
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
     * @param bool $includeAllHistory If true, calculates revenue from ALL dates (ignores date filters)
     */
    public function calculateTodayRevenue(Request $request): JsonResponse
    {
        $includeAllHistory = $request->query('include_all_history', false);
        
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // If include_all_history is true, use a very wide date range to include all data
        if ($includeAllHistory) {
            // Use year 2000 as start and year 3000 as end to cover all possible data
            $startDate = Carbon::createFromFormat('Y-m-d H:i:s', '2000-01-01 00:00:00');
            $endDate = Carbon::createFromFormat('Y-m-d H:i:s', '3000-12-31 23:59:59');
            
            // Clear related caches
            Cache::forget('daily_revenue_all_history');
            Cache::forget('daily_revenue_calculated_at_all_history');
        } else {
            $startDate = $today;
            $endDate = $tomorrow;
        }

        // Get revenue from all sources
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
}
