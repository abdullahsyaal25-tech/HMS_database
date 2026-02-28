<?php

namespace App\Services;

use App\Models\DailySnapshot;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DayStatusService
{
    /**
     * Check if a new day has started and needs to be processed
     */
    public function checkDayStatus()
    {
        $today = Carbon::today();
        $todayStr = $today->toDateString();
        
        // Check if we have a day_end_timestamp (persistent key, not date-based)
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // Get the last archived date from daily_snapshots table
        $lastSnapshot = DailySnapshot::orderBy('snapshot_date', 'desc')->first();
        
        if ($lastSnapshot) {
            $lastArchivedDate = Carbon::parse($lastSnapshot->snapshot_date);
        } else {
            // If no snapshots exist, check if we have any day_end_timestamp
            $lastArchivedDate = $dayEndTimestamp ? Carbon::parse($dayEndTimestamp) : null;
        }
        
        // DEBUG: Log all relevant values for diagnosis
        Log::info('DayStatusService checkDayStatus - DIAGNOSTIC DATA', [
            'today' => $todayStr,
            'today_raw' => $today->toISOString(),
            'lastSnapshot' => $lastSnapshot ? $lastSnapshot->snapshot_date : null,
            'lastArchivedDate' => $lastArchivedDate?->toDateString(),
            'dayEndTimestamp' => $dayEndTimestamp,
        ]);
        
        // Determine current status
        if (!$lastArchivedDate) {
            // No previous data - this is likely the first day
            Log::info('DayStatusService checkDayStatus - No last archived date, returning day_started');
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
        
        // DEBUG: Log the acknowledgement check
        Log::info('DayStatusService checkDayStatus - Acknowledgement check', [
            'todayAcknowledged' => $todayAcknowledged,
            'cache_key' => 'day_acknowledged_' . $todayStr,
            'today_gt_lastArchived' => $today->gt($lastArchivedDate),
            'not_acknowledged' => !$todayAcknowledged,
        ]);
        
        // Compare today with last archived date
        if ($today->gt($lastArchivedDate) && !$todayAcknowledged) {
            // New day detected - previous day needs to be archived
            Log::info('DayStatusService checkDayStatus - Returning new_day_available', [
                'days_behind' => $today->diffInDays($lastArchivedDate),
            ]);
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
            Log::info('DayStatusService checkDayStatus - Returning day_started (today acknowledged or same day)');
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
            Log::info('DayStatusService checkDayStatus - Returning day_started (fallback)');
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
        $todayStr = $today->toDateString();
        
        // Check if yesterday has already been archived
        // Fixed: Now uses correct column name 'snapshot_date' instead of 'date'
        $existingSnapshot = DailySnapshot::where('snapshot_date', Carbon::yesterday()->toDateString())->first();
        
        Log::info('DayStatusService archiveCurrentDay - Checking for existing snapshot', [
            'query_date' => Carbon::yesterday()->toDateString(),
            'existing_snapshot_found' => $existingSnapshot ? true : false,
            'existing_snapshot_id' => $existingSnapshot?->id,
        ]);
        if ($existingSnapshot) {
            // Yesterday already archived, just reset today's counters
            Cache::forget('daily_revenue_' . $todayStr);
            Cache::forget('daily_revenue_calculated_at_' . $todayStr);
            
            // Mark today as acknowledged
            Cache::put('day_acknowledged_' . $todayStr, true, now()->addDays(1));
            
            // Set day_end_timestamp to current time when user clicks "Start New Day"
            // This resets "Today" to show only data AFTER this timestamp
            Cache::put('day_end_timestamp', now()->toISOString(), now()->addDays(365));
            
            Log::info('DayStatusService archiveCurrentDay (already archived) - Set day_end_timestamp to current time', [
                'cache_key' => 'day_end_timestamp',
                'timestamp' => now()->toISOString(),
            ]);
            
            return [
                'success' => true,
                'message' => 'Day already archived - today reset to 0',
                'snapshot_id' => $existingSnapshot->id,
                'date_archived' => Carbon::yesterday()->toDateString(),
                'data' => null,
            ];
        }
        
        // Get yesterday's data for archiving (from the beginning of yesterday to end of yesterday)
        $yesterdayStart = Carbon::yesterday()->copy()->startOfDay();
        $yesterdayEnd = Carbon::yesterday()->copy()->endOfDay();
        $yesterdayData = $this->getDataForDateRange($yesterdayStart, $yesterdayEnd);
        
        // DEBUG: Log the data being archived
        Log::info('DayStatusService archiveCurrentDay - Archiving data', [
            'yesterdayStart' => $yesterdayStart->toISOString(),
            'yesterdayEnd' => $yesterdayEnd->toISOString(),
            'yesterdayData' => $yesterdayData,
        ]);
        
        // Archive yesterday's data to daily_snapshots table
        $snapshot = DailySnapshot::create([
            'snapshot_date' => Carbon::yesterday()->toDateString(),
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
        
        // Mark today as acknowledged (user has clicked "Start New Day")
        Cache::put('day_acknowledged_' . $todayStr, true, now()->addDays(1));
        
        // Set day_end_timestamp to current time when user clicks "Start New Day"
        // This resets "Today" to show only data AFTER this timestamp
        Cache::put('day_end_timestamp', now()->toISOString(), now()->addDays(365));
        
        Log::info('DayStatusService archiveCurrentDay - Set day_end_timestamp to current time', [
            'cache_key' => 'day_end_timestamp',
            'timestamp' => now()->toISOString(),
        ]);
        
        return [
            'success' => true,
            'message' => 'Day archived successfully',
            'snapshot_id' => $snapshot->id,
            'date_archived' => Carbon::yesterday()->toDateString(),
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
        
        // FIXED: Now correctly calculates appointments_count from database
        $appointmentsCount = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$start, $end])
            ->count();
        
        // DEBUG: Log revenue breakdown
        Log::info('DayStatusService getDataForDateRange - Revenue breakdown', [
            'start' => $start->toISOString(),
            'end' => $end->toISOString(),
            'appointmentsRevenue' => $appointmentsRevenue,
            'appointmentsCount' => $appointmentsCount,
            'departmentsRevenue' => $departmentsRevenue,
            'pharmacyRevenue' => $pharmacyRevenue,
            'laboratoryRevenue' => $laboratoryRevenue,
            'totalRevenue' => $totalRevenue,
        ]);

        return [
            'appointments_count' => $appointmentsCount,
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

        // Check if day_end_timestamp exists - Manual day detection
        $dayEndTimestamp = Cache::get('day_end_timestamp');

        // Use a very old date as default to show all historical data when no cache exists
        $defaultStartDate = Carbon::createFromFormat('Y-m-d H:i:s', '2000-01-01 00:00:00');

        // Determine the effective start time for today queries
        // If day_end_timestamp exists, only query transactions AFTER that timestamp
        // If no cache exists, use year 2000 to show ALL historical data
        $effectiveStartTime = $defaultStartDate;
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
                            ->whereIn('lab_test_results.status', ['completed', 'verified']);
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
     * 
     * FIXED: Now calculates fresh values from database instead of relying on
     * archived snapshots which may contain incorrect values from previous bugs.
     * This ensures the banner always shows CORRECT values.
     * 
     * MODIFIED: Now returns data from the last button click timestamp (current business day)
     * instead of yesterday, with time range information.
     */
    public function getYesterdaySummary()
    {
        // Get the last day start timestamp from cache (when "Start New Day" was clicked)
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // If we have a day_end_timestamp, use it as the start of current business day
        // Otherwise, fall back to yesterday for backwards compatibility
        if ($dayEndTimestamp) {
            $businessDayStart = Carbon::parse($dayEndTimestamp);
            $now = now();
            
            // DEBUG: Log the time range being queried
            Log::info('DayStatusService getYesterdaySummary - Calculating fresh data for current business day', [
                'business_day_start' => $businessDayStart->toISOString(),
                'now' => $now->toISOString(),
                'time_range' => $businessDayStart->format('M d, Y H:i') . ' - ' . $now->format('M d, Y H:i'),
            ]);
            
            // Calculate revenue from all sources for the current business day (from last button click to now)
            $appointmentsRevenue = $this->getAppointmentRevenue($businessDayStart, $now);
            $departmentsRevenue = $this->getDepartmentRevenue($businessDayStart, $now);
            $pharmacyRevenue = $this->getPharmacyRevenue($businessDayStart, $now);
            $laboratoryRevenue = $this->getLaboratoryRevenue($businessDayStart, $now);
            
            // Get appointments count
            $appointmentsCount = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
                ->whereBetween('appointment_date', [$businessDayStart, $now])
                ->count();
            
            $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;
            
            // DEBUG: Log calculated values
            Log::info('DayStatusService getYesterdaySummary - Fresh calculated values for current business day', [
                'business_day_start' => $businessDayStart->toISOString(),
                'appointments_count' => $appointmentsCount,
                'appointments_revenue' => $appointmentsRevenue,
                'departments_revenue' => $departmentsRevenue,
                'pharmacy_revenue' => $pharmacyRevenue,
                'laboratory_revenue' => $laboratoryRevenue,
                'total_revenue' => $totalRevenue,
            ]);
            
            return [
                'date' => $businessDayStart->toISOString(),
                'date_formatted' => $businessDayStart->format('M d, Y'),
                'time_range' => $businessDayStart->format('M d, Y H:i') . ' - ' . $now->format('M d, Y H:i'),
                'business_day_start' => $businessDayStart->toISOString(),
                'business_day_end' => $now->toISOString(),
                'appointments_count' => $appointmentsCount,
                'total_revenue' => $totalRevenue,
                // Return breakdown by revenue type for module-specific display
                'appointments_revenue' => (float) $appointmentsRevenue,
                'pharmacy_revenue' => (float) $pharmacyRevenue,
                'laboratory_revenue' => (float) $laboratoryRevenue,
                'departments_revenue' => (float) $departmentsRevenue,
                'source' => 'calculated',
                'is_current_business_day' => true,
            ];
        }
        
        // Fallback: If no day_end_timestamp, get yesterday's data (backwards compatibility)
        $yesterday = Carbon::yesterday();
        $yesterdayStr = $yesterday->toDateString();
        
        // DEBUG: Log the date being queried
        Log::info('DayStatusService getYesterdaySummary - Calculating fresh data for date', [
            'yesterdayStr' => $yesterdayStr,
            'current_time' => now()->toISOString(),
        ]);
        
        // Calculate fresh values from database instead of relying on archived data
        $yesterdayStart = $yesterday->copy()->startOfDay();
        $yesterdayEnd = $yesterday->copy()->endOfDay();
        
        // Calculate revenue from all sources for yesterday
        $appointmentsRevenue = $this->getAppointmentRevenue($yesterdayStart, $yesterdayEnd);
        $departmentsRevenue = $this->getDepartmentRevenue($yesterdayStart, $yesterdayEnd);
        $pharmacyRevenue = $this->getPharmacyRevenue($yesterdayStart, $yesterdayEnd);
        $laboratoryRevenue = $this->getLaboratoryRevenue($yesterdayStart, $yesterdayEnd);
        
        // Get appointments count
        $appointmentsCount = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$yesterdayStart, $yesterdayEnd])
            ->count();
        
        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;
        
        // DEBUG: Log calculated values
        Log::info('DayStatusService getYesterdaySummary - Fresh calculated values', [
            'yesterdayStr' => $yesterdayStr,
            'appointments_count' => $appointmentsCount,
            'appointments_revenue' => $appointmentsRevenue,
            'departments_revenue' => $departmentsRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_revenue' => $laboratoryRevenue,
            'total_revenue' => $totalRevenue,
        ]);
        
        return [
            'date' => $yesterdayStr,
            'date_formatted' => $yesterday->format('M d, Y'),
            'time_range' => $yesterdayStart->format('M d, Y H:i') . ' - ' . $yesterdayEnd->format('M d, Y H:i'),
            'business_day_start' => $yesterdayStart->toISOString(),
            'business_day_end' => $yesterdayEnd->toISOString(),
            'appointments_count' => $appointmentsCount,
            'total_revenue' => $totalRevenue,
            // Return breakdown by revenue type for module-specific display
            'appointments_revenue' => (float) $appointmentsRevenue,
            'pharmacy_revenue' => (float) $pharmacyRevenue,
            'laboratory_revenue' => (float) $laboratoryRevenue,
            'departments_revenue' => (float) $departmentsRevenue,
            'source' => 'calculated',
            'is_current_business_day' => false,
        ];
    }
}