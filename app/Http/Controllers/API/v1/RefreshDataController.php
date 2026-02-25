<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Sale;
use App\Models\LabTestResult;
use App\Models\DepartmentService;
use App\Models\DailySnapshot;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RefreshDataController extends Controller
{
    /**
     * "End of Day / Start New Day" functionality.
     * This archives current "today" data to daily_snapshots table, then clears the cache.
     * Pages will then show fresh data from the database (like starting a new day).
     */
    public function refreshAllTodayData(): JsonResponse
    {
        $today = now()->toDateString();

        try {
            Log::info('[EndOfDay] Starting end of day process', ['date' => $today]);

            // Step 1: Archive current "today" data to daily_snapshots (like closing the day)
            $archivedData = $this->archiveCurrentData($today);
            Log::info('[EndOfDay] Data archived successfully', ['archived_data' => $archivedData]);

            // Step 2: Clear all relevant caches
            $this->clearAllCaches($today);
            Log::info('[EndOfDay] Caches cleared successfully');

            // Step 3: Set a cache key to indicate day has ended with the timestamp
            // This allows showing only transactions AFTER this timestamp (Option B - Running Total After Day-End)
            Cache::put('day_end_timestamp_' . $today, now()->toIso8601String(), now()->endOfDay());
            Log::info('[EndOfDay] Day end timestamp set in cache: ' . now()->toIso8601String());

            return response()->json([
                'success' => true,
                'message' => 'Day ended successfully. Revenue archived to snapshot. New transactions will be counted separately.',
                'timestamp' => now()->toIso8601String(),
                'day_end_timestamp' => now()->toIso8601String(),
                'archived_data' => $archivedData
            ]);
        } catch (\Exception $e) {
            Log::error('[EndOfDay] Failed to end day', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to end day: ' . $e->getMessage(),
                'timestamp' => now()->toIso8601String()
            ], 500);
        }
    }

    /**
     * Archive current "today" data to the database (like closing the day).
     * This fetches current data from database and stores it as a snapshot.
     *
     * @param string $today
     * @return array
     */
    private function archiveCurrentData(string $today): array
    {
        // Fetch current "today" data from database to archive
        $snapshotData = $this->fetchCurrentDataForArchive($today);

        // Create a snapshot from the current data
        DailySnapshot::createFromCacheData($today, [
            'frozen_data' => $snapshotData,
        ]);

        return $snapshotData;
    }

    /**
     * Fetch current data from database for archiving
     *
     * @param string $today
     * @return array
     */
    private function fetchCurrentDataForArchive(string $today): array
    {
        // Fetch Pharmacy data
        $pharmacySalesCount = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->count();
        $pharmacyRevenue = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('grand_total') ?? 0;

        // Fetch Appointments data (all appointments for count)
        $appointmentsCount = Appointment::whereDate('appointment_date', $today)->count();
        
        // Calculate appointment revenue - ONLY for completed/confirmed appointments WITHOUT services
        // and NOT from Laboratory department (matching WalletController logic)
        $regularRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereDate('appointment_date', $today)
            ->whereDoesntHave('services')
            ->where(function ($query) {
                // Exclude appointments where department is Laboratory
                $query->whereNull('department_id')
                      ->orWhereNotIn('department_id', function ($subQuery) {
                          $subQuery->select('id')
                                   ->from('departments')
                                   ->where('name', 'Laboratory');
                      });
            })
            ->get()
            ->sum(fn($a) => max(0, ($a->fee ?? 0) - ($a->discount ?? 0)));
        
        // Service revenue is tracked separately as department revenue, NOT as appointment revenue
        // This matches WalletController::getDepartmentRevenue() logic
        $serviceRevenue = DB::table('appointment_services')
            ->join('appointments', 'appointments.id', '=', 'appointment_services.appointment_id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')  // Exclude laboratory services
            ->whereDate('appointments.appointment_date', $today)
            ->sum('appointment_services.final_cost') ?? 0;
        
        // Total appointments revenue = regular appointments + department services (excluding lab)
        $appointmentsRevenue = $regularRevenue + $serviceRevenue;

        // Fetch Patients data
        $patientsCount = Patient::whereDate('created_at', $today)->count();

        // Fetch Laboratory data
        $labTestsCount = LabTestResult::whereDate('performed_at', $today)->count();
        
        // Calculate lab revenue (matching WalletController::getLaboratoryRevenue logic)
        $labTestResultsRevenue = DB::table('lab_test_results')
            ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
            ->whereDate('lab_test_results.performed_at', $today)
            ->sum('lab_tests.cost') ?? 0;
        
        // Laboratory services from appointments
        $appointmentLabServicesRevenue = DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereDate('appointments.appointment_date', $today)
            ->sum('appointment_services.final_cost') ?? 0;
        
        // Laboratory department appointments (without services)
        $labDepartmentAppointmentsRevenue = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereDate('appointment_date', $today)
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
        
        $labRevenue = $labTestResultsRevenue + $appointmentLabServicesRevenue + $labDepartmentAppointmentsRevenue;

        // Department revenue is the same as serviceRevenue (non-lab department services)
        $departmentsRevenue = $serviceRevenue;

        // Build the snapshot data structure
        return [
            'pharmacy' => [
                'today_sales' => $pharmacySalesCount,
                'today_revenue' => (float) $pharmacyRevenue,
            ],
            'appointments' => [
                'today_appointments' => $appointmentsCount,
                'today_revenue' => (float) $appointmentsRevenue,
            ],
            'departments' => [
                'today_revenue' => (float) $departmentsRevenue,
            ],
            'patients' => [
                'today_patients' => $patientsCount,
            ],
            'laboratory' => [
                'today_tests' => $labTestsCount,
                'today_revenue' => (float) $labRevenue,
            ],
            'last_updated' => now()->toIso8601String(),
            'snapshot_date' => $today,
        ];
    }

    /**
     * Clear all relevant caches
     *
     * @param string $today
     * @return void
     */
    private function clearAllCaches(string $today): void
    {
        // Clear the main frozen data cache
        Cache::forget('frozen_today_data');

        // Clear legacy caches for backwards compatibility
        Cache::forget("daily_revenue_{$today}");
        Cache::forget("appointments_today_{$today}");
        Cache::forget("patients_today_{$today}");
        Cache::forget("pharmacy_today_{$today}");
        Cache::forget("laboratory_today_{$today}");
        Cache::forget("department_services_today_{$today}");
        Cache::forget("daily_revenue_all_history");
    }
}
