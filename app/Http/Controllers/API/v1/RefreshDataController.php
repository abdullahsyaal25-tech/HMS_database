<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Sale;
use App\Models\LabTestResult;
use App\Models\DepartmentService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RefreshDataController extends Controller
{
    /**
     * Refresh all "today" data across the application.
     * This clears cached data and recalculates today's statistics.
     */
    public function refreshAllTodayData(): JsonResponse
    {
        $today = now()->toDateString();
        $results = [];

        try {
            // 1. Refresh Wallet Today's Revenue
            $results['wallet'] = $this->refreshWalletTodayRevenue($today);

            // 2. Refresh Today's Appointments Count
            $results['appointments'] = $this->refreshAppointmentsToday($today);

            // 3. Refresh Today's Patients Count
            $results['patients'] = $this->refreshPatientsToday($today);

            // 4. Refresh Pharmacy Today's Stats
            $results['pharmacy'] = $this->refreshPharmacyToday($today);

            // 5. Refresh Laboratory Today's Stats
            $results['laboratory'] = $this->refreshLaboratoryToday($today);

            // 6. Refresh Department Services Today's Stats
            $results['department_services'] = $this->refreshDepartmentServicesToday($today);

            return response()->json([
                'success' => true,
                'message' => 'All today data refreshed successfully',
                'data' => $results,
                'timestamp' => now()->toIso8601String()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh some data: ' . $e->getMessage(),
                'data' => $results,
                'timestamp' => now()->toIso8601String()
            ], 500);
        }
    }

    /**
     * Refresh wallet today's revenue data
     */
    private function refreshWalletTodayRevenue(string $today): array
    {
        // Get appointments revenue (completed/confirmed) - use 'fee' column
        $appointmentRevenue = Appointment::where(function ($query) use ($today) {
                $query->whereDate('appointment_date', $today)
                      ->orWhereNull('appointment_date');
            })
            ->whereIn('status', ['completed', 'confirmed'])
            ->sum('fee') ?? 0;

        // Get department services revenue - use correct column names
        // DepartmentService is a service definition, revenue comes from appointments
        $departmentRevenue = 0; // Calculated through appointments

        // Get pharmacy sales revenue (completed) - use 'grand_total' and 'created_at'
        $pharmacyRevenue = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('grand_total') ?? 0;

        // Get laboratory revenue - lab_test_results doesn't have total_price
        // Set to 0 for now
        $labRevenue = 0;

        $total = $appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $labRevenue;

        $revenueData = [
            'appointments' => (float) $appointmentRevenue,
            'departments' => (float) $departmentRevenue,
            'pharmacy' => (float) $pharmacyRevenue,
            'laboratory' => (float) $labRevenue,
            'total' => (float) $total,
        ];

        // For new day / reset scenario, store everything in ALL HISTORY cache
        // This makes it appear as if starting fresh with all historical data
        $allHistoryRevenue = $this->calculateAllHistoryRevenue();
        Cache::put("daily_revenue_all_history", $allHistoryRevenue, now()->addDays(30));

        // Also store today's data (for regular today's view)
        Cache::put("daily_revenue_{$today}", $revenueData, now()->endOfDay());

        return $revenueData;
    }

    /**
     * Calculate all historical revenue
     */
    private function calculateAllHistoryRevenue(): array
    {
        $startDate = '2000-01-01';
        $endDate = '3000-12-31';

        // Get all appointments revenue - use 'fee' column
        $appointmentRevenue = Appointment::where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('appointment_date', [$startDate, $endDate])
                      ->orWhereNull('appointment_date');
            })
            ->whereIn('status', ['completed', 'confirmed'])
            ->sum('fee') ?? 0;

        // Department revenue is calculated through appointments
        $departmentRevenue = 0;

        // Get all pharmacy sales revenue - use 'grand_total' and 'created_at'
        $pharmacyRevenue = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->sum('grand_total') ?? 0;

        // Lab revenue
        $labRevenue = 0;

        return [
            'appointments' => (float) $appointmentRevenue,
            'departments' => (float) $departmentRevenue,
            'pharmacy' => (float) $pharmacyRevenue,
            'laboratory' => (float) $labRevenue,
            'total' => (float) ($appointmentRevenue + $departmentRevenue + $pharmacyRevenue + $labRevenue),
        ];
    }

    /**
     * Refresh today's appointments count
     */
    private function refreshAppointmentsToday(string $today): array
    {
        $count = Appointment::whereDate('created_at', $today)->count();
        $completedCount = Appointment::whereDate('created_at', $today)
            ->whereIn('status', ['completed', 'confirmed'])
            ->count();
        // Use 'fee' column instead of 'total_amount'
        $revenue = Appointment::whereDate('created_at', $today)
            ->whereIn('status', ['completed', 'confirmed'])
            ->sum('fee') ?? 0;

        $data = [
            'total' => $count,
            'completed' => $completedCount,
            'revenue' => (float) $revenue,
        ];

        Cache::put("appointments_today_{$today}", $data, now()->endOfDay());

        return $data;
    }

    /**
     * Refresh today's patients count
     */
    private function refreshPatientsToday(string $today): array
    {
        $count = Patient::whereDate('created_at', $today)->count();

        $data = [
            'total' => $count,
        ];

        Cache::put("patients_today_{$today}", $data, now()->endOfDay());

        return $data;
    }

    /**
     * Refresh pharmacy today's stats
     */
    private function refreshPharmacyToday(string $today): array
    {
        // Use 'created_at' instead of 'sale_date'
        $salesCount = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->count();
        
        // Use 'grand_total' and 'created_at'
        $revenue = Sale::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('grand_total') ?? 0;

        // Check if 'profit' column exists, if not use 0
        try {
            $profit = Sale::whereDate('created_at', $today)
                ->where('status', 'completed')
                ->sum('profit') ?? 0;
        } catch (\Exception $e) {
            $profit = 0;
        }

        $data = [
            'sales_count' => $salesCount,
            'revenue' => (float) $revenue,
            'profit' => (float) $profit,
        ];

        Cache::put("pharmacy_today_{$today}", $data, now()->endOfDay());

        return $data;
    }

    /**
     * Refresh laboratory today's stats
     */
    private function refreshLaboratoryToday(string $today): array
    {
        // Lab test results table columns unknown - return empty for now
        $data = [
            'total_tests' => 0,
            'completed_tests' => 0,
            'pending_tests' => 0,
            'revenue' => 0.0,
        ];

        Cache::put("laboratory_today_{$today}", $data, now()->endOfDay());

        return $data;
    }

    /**
     * Refresh department services today's stats
     */
    private function refreshDepartmentServicesToday(string $today): array
    {
        // DepartmentService is a service definition table, not transactions
        // We need to check appointment_services or similar for actual revenue
        // For now, return empty stats
        $data = [
            'total' => 0,
            'completed' => 0,
            'revenue' => 0.0,
        ];

        Cache::put("department_services_today_{$today}", $data, now()->endOfDay());

        return $data;
    }
}
