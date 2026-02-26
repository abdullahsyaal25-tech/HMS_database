<?php

namespace App\Services;

use App\Models\DailySnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DayStatusService
{
    /**
     * Check if a new day has started and needs to be processed
     */
    public function checkDayStatus()
    {
        $today = Carbon::today();
        $todayStr = $today->toDateString();
        
        // Check if we have a day_end_timestamp for today
        $dayEndTimestamp = Cache::get('day_end_timestamp_' . $todayStr);
        
        // Get the last archived date from daily_snapshots table
        $lastSnapshot = DailySnapshot::orderBy('snapshot_date', 'desc')->first();
        
        if ($lastSnapshot) {
            $lastArchivedDate = Carbon::parse($lastSnapshot->snapshot_date);
        } else {
            // If no snapshots exist, check if we have any day_end_timestamp
            $lastArchivedDate = $dayEndTimestamp ? Carbon::parse($dayEndTimestamp) : null;
        }
        
        // Determine current status
        if (!$lastArchivedDate) {
            // No previous data - this is likely the first day
            return [
                'status' => 'day_started',
                'message' => 'System initialized - day already started',
                'current_date' => $todayStr,
                'last_archived_date' => null,
                'new_day_available' => false,
                'day_end_timestamp' => $dayEndTimestamp,
            ];
        }
        
        // Check if today has been acknowledged by the user
        $todayAcknowledged = Cache::get('day_acknowledged_' . $todayStr, false);
        
        // Compare today with last archived date
        if ($today->gt($lastArchivedDate) && !$todayAcknowledged) {
            // New day detected - previous day needs to be archived
            return [
                'status' => 'new_day_available',
                'message' => 'New day detected - previous day needs to be archived',
                'current_date' => $todayStr,
                'last_archived_date' => $lastArchivedDate->toDateString(),
                'new_day_available' => true,
                'day_end_timestamp' => $dayEndTimestamp,
                'days_behind' => $today->diffInDays($lastArchivedDate),
            ];
        } elseif ($today->eq($lastArchivedDate) || ($today->gt($lastArchivedDate) && $todayAcknowledged)) {
            // Same day as last archived - day is already started
            return [
                'status' => 'day_started',
                'message' => 'Day already started and processed',
                'current_date' => $todayStr,
                'last_archived_date' => $lastArchivedDate->toDateString(),
                'new_day_available' => false,
                'day_end_timestamp' => $dayEndTimestamp,
            ];
        } else {
            // This shouldn't happen, but handle it gracefully
            return [
                'status' => 'day_started',
                'message' => 'System date appears to be in the past',
                'current_date' => $todayStr,
                'last_archived_date' => $lastArchivedDate->toDateString(),
                'new_day_available' => false,
                'day_end_timestamp' => $dayEndTimestamp,
            ];
        }
    }
    
    /**
     * Archive previous day's data and start new day
     */
    public function archiveCurrentDay()
    {
        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $yesterdayStr = $yesterday->toDateString();
        $todayStr = $today->toDateString();
        
        // Check if yesterday has already been archived
        $existingSnapshot = DailySnapshot::where('date', $yesterdayStr)->first();
        if ($existingSnapshot) {
            // Yesterday already archived, just reset today's counters
            Cache::forget('daily_revenue_' . $todayStr);
            Cache::forget('daily_revenue_calculated_at_' . $todayStr);
            
            // Mark today as acknowledged
            Cache::put('day_acknowledged_' . $todayStr, true, now()->addDays(1));
            
            // Set day_end_timestamp for TODAY to reset today's counters to 0
            // This makes all revenue queries return 0 for today
            Cache::put('day_end_timestamp_' . $todayStr, now()->toISOString(), now()->addDays(1));
            
            return [
                'success' => true,
                'message' => 'Day already archived - today reset to 0',
                'snapshot_id' => $existingSnapshot->id,
                'date_archived' => $yesterdayStr,
                'data' => null,
            ];
        }
        
        // Get yesterday's data for archiving (from the beginning of yesterday to end of yesterday)
        $yesterdayStart = $yesterday->copy()->startOfDay();
        $yesterdayEnd = $yesterday->copy()->endOfDay();
        $yesterdayData = $this->getDataForDateRange($yesterdayStart, $yesterdayEnd);
        
        // Archive yesterday's data to daily_snapshots table
        $snapshot = DailySnapshot::create([
            'snapshot_date' => $yesterdayStr,
            'appointments_count' => $yesterdayData['appointments_count'],
            'appointments_revenue' => $yesterdayData['appointments_revenue'],
            'departments_revenue' => $yesterdayData['departments_revenue'],
            'pharmacy_revenue' => $yesterdayData['pharmacy_revenue'],
            'laboratory_revenue' => $yesterdayData['laboratory_revenue'],
            'total_revenue' => $yesterdayData['total_revenue'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Clear today's cache to start fresh
        Cache::forget('daily_revenue_' . $todayStr);
        Cache::forget('daily_revenue_calculated_at_' . $todayStr);
        
        // Set day_end_timestamp for yesterday to mark it as archived
        Cache::put('day_end_timestamp_' . $yesterdayStr, $yesterdayEnd->toISOString(), now()->addDays(30));
        
        // Mark today as acknowledged (user has clicked "Start New Day")
        Cache::put('day_acknowledged_' . $todayStr, true, now()->addDays(1));
        
        // Set day_end_timestamp for TODAY to reset today's counters to 0
        // This makes all revenue queries return 0 for today
        Cache::put('day_end_timestamp_' . $todayStr, now()->toISOString(), now()->addDays(1));
        
        return [
            'success' => true,
            'message' => 'Day archived successfully',
            'snapshot_id' => $snapshot->id,
            'date_archived' => $yesterdayStr,
            'data' => $yesterdayData,
        ];
    }
    
    /**
     * Get data for a specific date range
     */
    private function getDataForDateRange($start, $end)
    {
        // Calculate revenue from all sources for the given date range
        $appointmentsRevenue = $this->getAppointmentRevenue($start, $end);
        $departmentsRevenue = $this->getDepartmentRevenue($start, $end);
        $pharmacyRevenue = $this->getPharmacyRevenue($start, $end);
        $laboratoryRevenue = $this->getLaboratoryRevenue($start, $end);

        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;

        return [
            'appointments_count' => 0, // Would need separate calculation
            'appointments_revenue' => $appointmentsRevenue,
            'departments_revenue' => $departmentsRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_revenue' => $laboratoryRevenue,
            'total_revenue' => $totalRevenue,
        ];
    }

    /**
     * Get today's data for archiving
     */
    private function getTodayData()
    {
        // Calculate today's revenue data directly in the service
        // This mirrors the logic from WalletController::getRevenueData()
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $todayStr = $today->toDateString();

        // Check if day_end_timestamp exists - Option B: Running Total After Day-End
        $dayEndTimestamp = Cache::get('day_end_timestamp_' . $todayStr);

        // Determine the effective start time for today queries
        // If day_end_timestamp exists, only query transactions AFTER that timestamp
        $effectiveStartTime = $today;
        if ($dayEndTimestamp) {
            $effectiveStartTime = Carbon::parse($dayEndTimestamp);
        }

        // Calculate revenue from all sources
        $appointmentsRevenue = $this->getAppointmentRevenue($effectiveStartTime, $tomorrow);
        $departmentsRevenue = $this->getDepartmentRevenue($effectiveStartTime, $tomorrow);
        $pharmacyRevenue = $this->getPharmacyRevenue($effectiveStartTime, $tomorrow);
        $laboratoryRevenue = $this->getLaboratoryRevenue($effectiveStartTime, $tomorrow);

        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;

        return [
            'appointments_count' => 0, // Would need separate calculation
            'appointments_revenue' => $appointmentsRevenue,
            'departments_revenue' => $departmentsRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_revenue' => $laboratoryRevenue,
            'total_revenue' => $totalRevenue,
        ];
    }

    /**
     * Get appointment revenue for a date range (same logic as WalletController)
     */
    private function getAppointmentRevenue($start, $end)
    {
        $appointments = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
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
        
        return $appointments->sum(function ($appointment) {
            return max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
        });
    }

    /**
     * Get department service revenue for a date range
     */
    private function getDepartmentRevenue($start, $end)
    {
        return \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('appointment_services.final_cost');
    }

    /**
     * Get pharmacy revenue for a date range
     */
    private function getPharmacyRevenue($start, $end)
    {
        return \App\Models\Sale::where('status', 'completed')
            ->whereBetween('created_at', [$start, $end])
            ->sum('grand_total');
    }

    /**
     * Get laboratory revenue for a date range
     */
    private function getLaboratoryRevenue($start, $end)
    {
        // Get lab test results that are completed OR have been performed
        $labTestResultsRevenue = \Illuminate\Support\Facades\DB::table('lab_test_results')
            ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('lab_test_results.performed_at', [$start, $end])
                      ->orWhere(function ($q) {
                          $q->whereNull('lab_test_results.performed_at')
                            ->where('lab_test_results.status', 'completed');
                      });
            })
            ->sum('lab_tests.cost');

        // Get laboratory services from appointments (department services)
        $appointmentLabServicesRevenue = \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereBetween('appointments.appointment_date', [$start, $end])
            ->sum('appointment_services.final_cost');

        // Get laboratory department appointments
        $labDepartmentAppointmentsRevenue = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$start, $end])
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
     * Get yesterday's summary for display in confirmation dialog
     */
    public function getYesterdaySummary()
    {
        $yesterday = Carbon::yesterday();
        $yesterdayStr = $yesterday->toDateString();
        
        // Try to get from daily_snapshots first
        $snapshot = DailySnapshot::where('snapshot_date', $yesterdayStr)->first();
        
        if ($snapshot) {
            return [
                'date' => $yesterdayStr,
                'appointments_count' => $snapshot->appointments_count,
                'total_revenue' => $snapshot->total_revenue,
                'source' => 'archived',
            ];
        }
        
        // If not in snapshots, try to calculate from cache
        $cachedData = Cache::get('daily_revenue_' . $yesterdayStr);
        
        if ($cachedData) {
            return [
                'date' => $yesterdayStr,
                'appointments_count' => 0, // Would need separate calculation
                'total_revenue' => $cachedData['total'] ?? 0,
                'source' => 'cached',
            ];
        }
        
        // If no data available
        return [
            'date' => $yesterdayStr,
            'appointments_count' => 0,
            'total_revenue' => 0,
            'source' => 'unavailable',
        ];
    }
}