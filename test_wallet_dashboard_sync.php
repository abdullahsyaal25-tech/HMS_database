<?php

/**
 * Test script to verify wallet and dashboard calculations match.
 * 
 * This script compares:
 * 1. Wallet balance vs Dashboard total revenue
 * 2. Individual revenue components (appointments, pharmacy, laboratory, departments)
 * 
 * Run with: php test_wallet_dashboard_sync.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Appointment;
use App\Models\Sale;
use App\Models\LabTestRequest;
use App\Services\DashboardService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "=== Wallet vs Dashboard Calculation Verification ===\n\n";

// Get wallet balance
$wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
$walletBalance = $wallet->balance;
echo "1. WALLET BALANCE: " . number_format($walletBalance, 2) . "\n\n";

// Calculate revenue from transactions table
echo "2. TRANSACTION BREAKDOWN:\n";
$transactionSummary = Transaction::select('type', DB::raw('SUM(amount) as total'))
    ->groupBy('type')
    ->get();
$totalCredits = 0;
$totalDebits = 0;
foreach ($transactionSummary as $summary) {
    echo "   - {$summary->type}: " . number_format($summary->total, 2) . "\n";
    if ($summary->type === 'credit') {
        $totalCredits = $summary->total;
    } elseif ($summary->type === 'debit') {
        $totalDebits = $summary->total;
    }
}
echo "   Calculated Balance: " . number_format($totalCredits - $totalDebits, 2) . "\n\n";

// Get dashboard stats
echo "3. DASHBOARD REVENUE (Today):\n";
$dashboardService = new DashboardService();
$stats = $dashboardService->getDashboardStats('today');
$financial = $stats['financial'] ?? [];
echo "   - Appointment Revenue: " . number_format($financial['appointment_revenue'] ?? 0, 2) . "\n";
echo "   - Department Revenue: " . number_format($financial['department_revenue'] ?? 0, 2) . "\n";
echo "   - Pharmacy Revenue: " . number_format($financial['pharmacy_revenue'] ?? 0, 2) . "\n";
echo "   - Laboratory Revenue: " . number_format($financial['laboratory_revenue'] ?? 0, 2) . "\n";
echo "   - Total Revenue: " . number_format($financial['total_revenue'] ?? 0, 2) . "\n\n";

// Calculate what wallet SHOULD be based on individual sources
echo "4. EXPECTED WALLET BALANCE (Sum of all transaction sources):\n";

// Count transactions by reference type
$transactionByType = Transaction::select('reference_type', DB::raw('SUM(amount) as total'))
    ->where('type', 'credit')
    ->groupBy('reference_type')
    ->get()
    ->pluck('total', 'reference_type')
    ->toArray();

$appointmentTransactions = $transactionByType['App\Models\Appointment'] ?? 0;
$appointmentServiceTransactions = $transactionByType['App\Models\AppointmentService'] ?? 0;
$saleTransactions = $transactionByType['App\Models\Sale'] ?? 0;
$labTestRequestTransactions = $transactionByType['App\Models\LabTestRequest'] ?? 0;
$paymentTransactions = $transactionByType['App\Models\Payment'] ?? 0;

echo "   - From Appointments: " . number_format($appointmentTransactions, 2) . "\n";
echo "   - From Appointment Services: " . number_format($appointmentServiceTransactions, 2) . "\n";
echo "   - From Sales (Pharmacy): " . number_format($saleTransactions, 2) . "\n";
echo "   - From Lab Test Requests: " . number_format($labTestRequestTransactions, 2) . "\n";
echo "   - From Payments: " . number_format($paymentTransactions, 2) . "\n";

$expectedBalance = $totalCredits - $totalDebits;
echo "\n   EXPECTED: " . number_format($expectedBalance, 2) . "\n";
echo "   ACTUAL:   " . number_format($walletBalance, 2) . "\n";
echo "   DIFF:     " . number_format($expectedBalance - $walletBalance, 2) . "\n\n";

// Check for missing observers
echo "5. MISSING TRANSACTION CHECK:\n";

// Check completed sales without transactions
$salesWithoutTransactions = Sale::where('status', 'completed')
    ->where('payment_status', 'paid')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('transactions')
            ->whereColumn('transactions.reference_id', 'sales.id')
            ->where('transactions.reference_type', Sale::class);
    })
    ->count();
echo "   - Sales without transactions: {$salesWithoutTransactions}\n";

// Check completed appointments without transactions
$appointmentsWithoutTransactions = Appointment::whereIn('status', ['completed', 'confirmed'])
    ->whereDoesntHave('services')
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('transactions')
            ->whereColumn('transactions.reference_id', 'appointments.id')
            ->where('transactions.reference_type', Appointment::class);
    })
    ->count();
echo "   - Appointments without transactions: {$appointmentsWithoutTransactions}\n";

// Check completed lab tests without transactions
$labTestsWithoutTransactions = LabTestRequest::where('status', LabTestRequest::STATUS_COMPLETED)
    ->whereNotExists(function ($query) {
        $query->select(DB::raw(1))
            ->from('transactions')
            ->whereColumn('transactions.reference_id', 'lab_test_requests.id')
            ->where('transactions.reference_type', LabTestRequest::class);
    })
    ->count();
echo "   - Lab tests without transactions: {$labTestsWithoutTransactions}\n";

echo "\n6. RECOMMENDATION:\n";
if ($salesWithoutTransactions > 0 || $appointmentsWithoutTransactions > 0 || $labTestsWithoutTransactions > 0) {
    echo "   WARNING: Some completed items are missing wallet transactions.\n";
    echo "   Run 'php artisan wallet:sync' to create missing transactions.\n";
} else {
    echo "   All completed items have corresponding wallet transactions.\n";
}

if (abs($expectedBalance - $walletBalance) > 0.01) {
    echo "   WARNING: Wallet balance mismatch detected!\n";
} else {
    echo "   SUCCESS: Wallet balance is accurate.\n";
}

echo "\n=== End of Verification ===\n";
