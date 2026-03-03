<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the laboratory dashboard.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Check if user has appropriate permission
        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        // Check if user has dashboard view permission
        if (!$user->hasPermission('view-dashboard')) {
            return Inertia::render('Errors/AccessDenied', [
                'message' => 'You do not have permission to access the laboratory dashboard.'
            ]);
        }

        // Get statistics for dashboard
        $totalTests = LabTest::count();
        $activeTests = LabTest::where('status', 'active')->count();
        $inactiveTests = LabTest::where('status', 'inactive')->count();

        // Get recent lab test requests
        $recentRequests = \App\Models\LabTestRequest::with(['patient', 'doctor'])
            ->latest()
            ->take(5)
            ->get();

        // Get recent results
        $recentResults = \App\Models\LabTestResult::with(['patient', 'test'])
            ->latest()
            ->take(5)
            ->get();

        // Get pending requests count
        $pendingRequests = \App\Models\LabTestRequest::where('status', 'pending')->count();
        $inProgressRequests = \App\Models\LabTestRequest::where('status', 'in_progress')->count();
        $completedRequests = \App\Models\LabTestRequest::where('status', 'completed')->count();

        // Get critical/abnormal results count
        $criticalResults = \App\Models\LabTestResult::where('status', 'critical')->count();
        $abnormalResults = \App\Models\LabTestResult::where('status', 'abnormal')->count();

        // Build activities array from recent requests and results
        $activities = [];
        foreach ($recentRequests as $request) {
            $activities[] = [
                'id' => 'req_' . $request->id,
                'type' => 'request',
                'title' => 'New Test Request',
                'description' => $request->test_name . ' for ' . ($request->patient->first_name ?? 'Unknown'),
                'timestamp' => $request->created_at->toISOString(),
                'status' => $request->status,
                'priority' => $request->test_type,
            ];
        }
        foreach ($recentResults as $result) {
            $activities[] = [
                'id' => 'res_' . $result->id,
                'type' => 'result',
                'title' => 'Test Result Added',
                'description' => ($result->test->name ?? 'Unknown Test') . ' for ' . ($result->patient->first_name ?? 'Unknown'),
                'timestamp' => $result->created_at->toISOString(),
                'status' => $result->status,
            ];
        }
        // Sort activities by timestamp
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        $activities = array_slice($activities, 0, 10);

        // Get STAT requests count
        $statRequests = \App\Models\LabTestRequest::where('test_type', 'stat')
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        // Get current day laboratory revenue data for DayStatusBanner
        $currentDayLaboratoryRevenue = $this->getLaboratoryRevenueForDayStatusBanner();

        return Inertia::render('Laboratory/Index', [
            'stats' => [
                'totalTests' => $totalTests,
                'activeTests' => $activeTests,
                'inactiveTests' => $inactiveTests,
                'pendingRequests' => $pendingRequests,
                'inProgressRequests' => $inProgressRequests,
                'completedRequests' => $completedRequests,
                'criticalResults' => $criticalResults,
                'abnormalResults' => $abnormalResults,
            ],
            'recentRequests' => $recentRequests,
            'recentResults' => $recentResults,
            'activities' => $activities,
            'criticalResults' => $criticalResults,
            'statRequests' => $statRequests,
            'currentDayData' => [
                'appointments_count' => 0, // Laboratory doesn't have appointments
                'total_revenue' => $currentDayLaboratoryRevenue, // Total is just laboratory revenue
                'appointments_revenue' => 0, // No appointments in laboratory
                'pharmacy_revenue' => 0, // No pharmacy in laboratory
                'laboratory_revenue' => $currentDayLaboratoryRevenue,
                'departments_revenue' => 0, // No departments in laboratory
                'source' => 'Laboratory Dashboard',
            ],
        ]);
    }

    /**
     * Get the laboratory revenue for the day status banner
     */
    private function getLaboratoryRevenueForDayStatusBanner(): float
    {
        // Default to today's start if no cache exists
        $defaultStartDate = \Carbon\Carbon::today()->startOfDay();

        // Check if day_end_timestamp exists - Manual day detection
        $dayEndTimestamp = \Illuminate\Support\Facades\Cache::get('day_end_timestamp');

        // Determine the effective start time for today queries
        $effectiveStartTime = $defaultStartDate;
        if ($dayEndTimestamp) {
            $effectiveStartTime = \Carbon\Carbon::parse($dayEndTimestamp);
        }

        // Calculate laboratory revenue from completed lab test requests
        $laboratoryRevenue = \App\Models\LabTestRequest::where('status', 'completed')
            ->where('updated_at', '>=', $effectiveStartTime)
            ->sum('cost');

        return (float) $laboratoryRevenue;
    }
}
