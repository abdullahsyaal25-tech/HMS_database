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
        $now = now();
        
        // Check if we have a day_end_timestamp (meaning today has already been reset before)
        $dayEndTimestamp = Cache::get('day_end_timestamp');
        
        // If there's an existing timestamp, archive the current period's data (from timestamp to now)
        if ($dayEndTimestamp) {
            $periodStart = Carbon::parse($dayEndTimestamp);
            $periodData = $this->getDataForDateRange($periodStart, $now);
            
            // Only archive if there's actual data in this period
            if ($periodData['total_revenue'] > 0 || $periodData['appointments_count'] > 0) {
                // Archive this period's data
                $snapshot = DailySnapshot::create([
                    'snapshot_date' => $todayStr,
                    'appointments_count' => $periodData['appointments_count'],
                    'appointments_revenue' => $periodData['appointments_revenue'],
                    'departments_revenue' => $periodData['departments_revenue'],
                    'pharmacy_revenue' => $periodData['pharmacy_revenue'],
                    'laboratory_revenue' => $periodData['laboratory_revenue'],
                    'total_revenue' => $periodData['total_revenue'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                Log::info('DayStatusService archiveCurrentDay - Archived current period data', [
                    'period_start' => $periodStart->toISOString(),
                    'period_end' => $now->toISOString(),
                    'data' => $periodData,
                    'snapshot_id' => $snapshot->id,
                ]);
            }
        } else {
            // First time clicking - check if yesterday needs to be archived
            $existingSnapshot = DailySnapshot::where('snapshot_date', Carbon::yesterday()->toDateString())->first();
            
            if (!$existingSnapshot) {
                // Archive yesterday's data
                $yesterdayStart = Carbon::yesterday()->copy()->startOfDay();
                $yesterdayEnd = Carbon::yesterday()->copy()->endOfDay();
                $yesterdayData = $this->getDataForDateRange($yesterdayStart, $yesterdayEnd);
                
                if ($yesterdayData['total_revenue'] > 0 || $yesterdayData['appointments_count'] > 0) {
                    DailySnapshot::create([
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
                }
            }
            
            // Archive today's data (before the reset)
            $todayStart = $today->copy()->startOfDay();
            $todayData = $this->getDataForDateRange($todayStart, $now);
            
            if ($todayData['total_revenue'] > 0 || $todayData['appointments_count'] > 0) {
                DailySnapshot::create([
                    // FIXED: Use proper date format for snapshot_date column (date type can't accept _pre_reset suffix)
                    // Store the actual date, and put the _pre_reset info in metadata instead
                    'snapshot_date' => $todayStr,
                    'appointments_count' => $todayData['appointments_count'],
                    'appointments_revenue' => $todayData['appointments_revenue'],
                    'departments_revenue' => $todayData['departments_revenue'],
                    'pharmacy_revenue' => $todayData['pharmacy_revenue'],
                    'laboratory_revenue' => $todayData['laboratory_revenue'],
                    'total_revenue' => $todayData['total_revenue'],
                    'metadata' => [
                        'pre_reset' => true,
                        'reset_time' => $now->toISOString(),
                    ],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                Log::info('DayStatusService archiveCurrentDay - Archived today data before reset', [
                    'today_data' => $todayData,
                ]);
            }
        }
        
        // Clear today's cache to start fresh
        Cache::forget('daily_revenue_' . $todayStr);
        Cache::forget('daily_revenue_calculated_at_' . $todayStr);
        
        // Mark today as acknowledged
        Cache::put('day_acknowledged_' . $todayStr, true, now()->addDays(1));
        
        // Set day_end_timestamp to current time - this is the key!
        // All data created BEFORE this timestamp is now considered "archived"
        // Only data created AFTER this timestamp will be shown
        Cache::put('day_end_timestamp', $now->toISOString(), now()->addDays(365));
        
        Log::info('DayStatusService archiveCurrentDay - Reset complete', [
            'timestamp' => $now->toISOString(),
            'message' => 'Current period archived, display reset to 0',
        ]);
        
        return [
            'success' => true,
            'message' => 'Day reset successfully - display cleared to 0',
            'timestamp' => $now->toISOString(),
            'data' => null,
        ];
    }
    
    /**
     * Get data for a specific date range
     */
    private function getDataForDateRange($start, $end)
    {
        // Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        // Calculate revenue from all sources for the given date range
        $appointmentsRevenue = $this->getAppointmentRevenue($start, $end);
        $departmentsRevenue = $this->getDepartmentRevenue($start, $end);
        $pharmacyRevenue = $this->getPharmacyRevenue($start, $end);
        $laboratoryRevenue = $this->getLaboratoryRevenue($start, $end);

        $totalRevenue = $appointmentsRevenue + $departmentsRevenue + $pharmacyRevenue + $laboratoryRevenue;
        
        // FIXED: Use created_at instead of appointment_date for consistency
        $appointmentsCount = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('created_at', [$startLocal, $endLocal])
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
        // FIXED: Use created_at instead of appointment_date to properly support day_end_timestamp filtering
        // Also ensure proper timezone handling - convert to application timezone
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        $appointments = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('created_at', [$startLocal, $endLocal])
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
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        // to properly support day_end_timestamp filtering
        // Also ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        return \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '!=', 'Laboratory')
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost');
    }

    /**
     * Get pharmacy revenue for a date range
     */
    private function getPharmacyRevenue($start, $end)
    {
        // Ensure proper timezone handling
        $startLocal = $start->setTimezone(config('app.timezone'));
        $endLocal = $end->setTimezone(config('app.timezone'));
        
        return \App\Models\Sale::where('status', 'completed')
            ->whereBetween('created_at', [$startLocal, $endLocal])
            ->sum('grand_total');
    }

    /**
     * Get laboratory revenue for a date range
     */
    private function getLaboratoryRevenue($start, $end)
    {
        // Ensure proper timezone handling
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
            ->sum('lab_tests.cost');

        // Get laboratory services from appointments (department services)
        // FIXED: Use appointment_services.created_at instead of appointments.appointment_date
        // to properly support day_end_timestamp filtering
        $appointmentLabServicesRevenue = \Illuminate\Support\Facades\DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->join('department_services', 'appointment_services.department_service_id', '=', 'department_services.id')
            ->join('departments', 'department_services.department_id', '=', 'departments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->where('departments.name', '=', 'Laboratory')
            ->whereBetween('appointment_services.created_at', [$startLocal, $endLocal])
            ->sum('appointment_services.final_cost');

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
            // Parse timestamp and convert to application timezone for consistent comparison
            $businessDayStart = Carbon::parse($dayEndTimestamp)->setTimezone(config('app.timezone'));
            $now = now()->setTimezone(config('app.timezone'));
            
            // DEBUG: Log the time range being queried
            Log::info('DayStatusService getYesterdaySummary - Calculating fresh data for current business day', [
                'business_day_start' => $businessDayStart->toISOString(),
                'now' => $now->toISOString(),
                'time_range' => $businessDayStart->format('M d, Y H:i') . ' - ' . $now->format('M d, Y H:i'),
            ]);
            
            // IMPORTANT: Use 'created_at' filter to only get records created AFTER the timestamp
            // This ensures that when "Start New Day" is clicked, only NEW records are counted
            $appointmentsCount = \App\Models\Appointment::whereIn('status', ['completed', 'confirmed'])
                ->where('created_at', '>=', $businessDayStart)
                ->count();
            
            // Calculate revenue using the same timestamp-based approach
            $appointmentsRevenue = $this->getAppointmentRevenue($businessDayStart, $now);
            $departmentsRevenue = $this->getDepartmentRevenue($businessDayStart, $now);
            $pharmacyRevenue = $this->getPharmacyRevenue($businessDayStart, $now);
            $laboratoryRevenue = $this->getLaboratoryRevenue($businessDayStart, $now);
            
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