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
        $periods = [
            'today' => [Carbon::today(), Carbon::tomorrow()],
            'this_week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'this_month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'this_year' => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
        ];

        $data = [];

        foreach ($periods as $period => $dates) {
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
     */
    private function getAppointmentRevenue(Carbon $start, Carbon $end)
    {
        // Get completed appointments WITHOUT services and calculate only doctor fee (fee - discount)
        // Appointments with services are tracked in department revenue instead
        $appointments = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereBetween('appointment_date', [$start, $end])
            ->whereDoesntHave('services')  // Only appointments without services
            ->get();
        
        return $appointments->sum(function ($appointment) {
            return max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
        });
    }

    /**
     * Get department service revenue for a date range.
     * Calculates from appointment_services (department services used in appointments).
     * This includes all service-based appointment revenue, separate from doctor consultation fees.
     */
    private function getDepartmentRevenue(Carbon $start, Carbon $end)
    {
        // Sum the final_cost from appointment_services for completed appointments
        // These are services selected when creating appointments, NOT doctor consultation fees
        return DB::table('appointment_services')
            ->join('appointments', 'appointment_services.appointment_id', '=', 'appointments.id')
            ->whereIn('appointments.status', ['completed', 'confirmed'])
            ->whereBetween('appointment_services.created_at', [$start, $end])
            ->sum('appointment_services.final_cost');
    }

    /**
     * Get pharmacy revenue for a date range.
     */
    private function getPharmacyRevenue(Carbon $start, Carbon $end)
    {
        // Count completed sales as revenue
        return Sale::where('status', 'completed')
            ->whereBetween('created_at', [$start, $end])
            ->sum('grand_total');
    }

    /**
     * Get laboratory revenue for a date range.
     * Calculates from LabTestResults (completed or performed) joined with LabTest to get costs.
     */
    private function getLaboratoryRevenue(Carbon $start, Carbon $end)
    {
        // Get lab test results that are completed OR have been performed (have performed_at date)
        // This includes results that are technically "pending" but have actually been done
        return DB::table('lab_test_results')
            ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
            ->where(function ($query) {
                $query->where('lab_test_results.status', 'completed')
                      ->orWhereNotNull('lab_test_results.performed_at');
            })
            ->whereBetween('lab_test_results.performed_at', [$start, $end])
            ->sum('lab_tests.cost');
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
}
