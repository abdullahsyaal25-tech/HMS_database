<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Sale;
use App\Models\LabTestRequest;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SyncWalletTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'wallet:sync 
                            {--dry-run : Show what would be synced without making changes}
                            {--type= : Sync only specific type (appointments,sales,lab_tests,payments,all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync missing wallet transactions for existing records';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $type = $this->option('type') ?? 'all';

        $this->info('=== Wallet Transaction Sync ===');
        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }

        $totalCreated = 0;

        if ($type === 'all' || $type === 'appointments') {
            $totalCreated += $this->syncAppointments($dryRun);
        }

        if ($type === 'all' || $type === 'services') {
            $totalCreated += $this->syncAppointmentServices($dryRun);
        }

        if ($type === 'all' || $type === 'sales') {
            $totalCreated += $this->syncSales($dryRun);
        }

        if ($type === 'all' || $type === 'lab_tests') {
            $totalCreated += $this->syncLabTests($dryRun);
        }

        if ($type === 'all' || $type === 'payments') {
            $totalCreated += $this->syncPayments($dryRun);
        }

        $this->newLine();
        $this->info("Total transactions created: {$totalCreated}");

        if ($dryRun) {
            $this->warn('This was a dry run. No changes were made.');
            $this->info('Run without --dry-run to apply changes.');
        }

        return self::SUCCESS;
    }

    /**
     * Sync missing appointment transactions.
     */
    private function syncAppointments(bool $dryRun): int
    {
        $this->info('Checking appointments...');

        $appointments = Appointment::whereIn('status', ['completed', 'confirmed'])
            ->whereDoesntHave('services')
            ->whereNotIn('department_id', function ($query) {
                $query->select('id')
                    ->from('departments')
                    ->where('name', 'Laboratory');
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reference_id', 'appointments.id')
                    ->where('transactions.reference_type', Appointment::class);
            })
            ->get();

        $count = $appointments->count();
        $this->info("Found {$count} appointments without transactions");

        if ($count === 0) {
            return 0;
        }

        if (!$dryRun) {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($appointments as $appointment) {
                $amount = max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
                
                if ($amount > 0) {
                    Transaction::create([
                        'wallet_id' => $wallet->id,
                        'type' => 'credit',
                        'amount' => $amount,
                        'description' => 'Appointment sync - ' . ($appointment->appointment_id ?? 'ID: ' . $appointment->id),
                        'reference_type' => Appointment::class,
                        'reference_id' => $appointment->id,
                        'transaction_date' => $appointment->created_at,
                        'created_by' => null,
                    ]);
                }
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $wallet->updateBalance();
        }

        return $count;
    }

    /**
     * Sync missing appointment service transactions.
     */
    private function syncAppointmentServices(bool $dryRun): int
    {
        $this->info('Checking appointment services...');

        $services = AppointmentService::whereHas('appointment', function ($query) {
                $query->whereIn('status', ['completed', 'confirmed']);
            })
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reference_id', 'appointment_services.id')
                    ->where('transactions.reference_type', AppointmentService::class);
            })
            ->get();

        $count = $services->count();
        $this->info("Found {$count} appointment services without transactions");

        if ($count === 0) {
            return 0;
        }

        if (!$dryRun) {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($services as $service) {
                $service->load(['appointment', 'departmentService.department']);
                $amount = $service->final_cost ?? 0;
                
                if ($amount > 0) {
                    $departmentName = $service->departmentService?->department?->name ?? 'Unknown';
                    $serviceName = $service->departmentService?->name ?? 'Service';
                    
                    Transaction::create([
                        'wallet_id' => $wallet->id,
                        'type' => 'credit',
                        'amount' => $amount,
                        'description' => "Service sync - {$serviceName} ({$departmentName})",
                        'reference_type' => AppointmentService::class,
                        'reference_id' => $service->id,
                        'transaction_date' => $service->created_at,
                        'created_by' => null,
                    ]);
                }
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $wallet->updateBalance();
        }

        return $count;
    }

    /**
     * Sync missing sale transactions.
     */
    private function syncSales(bool $dryRun): int
    {
        $this->info('Checking sales...');

        $sales = Sale::where('status', 'completed')
            ->where('payment_status', 'paid')
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reference_id', 'sales.id')
                    ->where('transactions.reference_type', Sale::class);
            })
            ->get();

        $count = $sales->count();
        $this->info("Found {$count} sales without transactions");

        if ($count === 0) {
            return 0;
        }

        if (!$dryRun) {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($sales as $sale) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'credit',
                    'amount' => $sale->grand_total,
                    'description' => 'Sale sync - ' . $sale->sale_id,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'transaction_date' => $sale->created_at,
                    'created_by' => null,
                ]);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $wallet->updateBalance();
        }

        return $count;
    }

    /**
     * Sync missing lab test transactions.
     */
    private function syncLabTests(bool $dryRun): int
    {
        $this->info('Checking lab test requests...');

        $labTests = LabTestRequest::where('status', LabTestRequest::STATUS_COMPLETED)
            ->whereNotNull('cost')
            ->where('cost', '>', 0)
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reference_id', 'lab_test_requests.id')
                    ->where('transactions.reference_type', LabTestRequest::class);
            })
            ->get();

        $count = $labTests->count();
        $this->info("Found {$count} lab tests without transactions");

        if ($count === 0) {
            return 0;
        }

        if (!$dryRun) {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($labTests as $labTest) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'credit',
                    'amount' => $labTest->cost,
                    'description' => 'Lab test sync - ' . ($labTest->test_name ?? 'Test') . ' (' . ($labTest->request_id ?? 'ID: ' . $labTest->id) . ')',
                    'reference_type' => LabTestRequest::class,
                    'reference_id' => $labTest->id,
                    'transaction_date' => $labTest->completed_at ?? $labTest->updated_at,
                    'created_by' => null,
                ]);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $wallet->updateBalance();
        }

        return $count;
    }

    /**
     * Sync missing payment transactions.
     */
    private function syncPayments(bool $dryRun): int
    {
        $this->info('Checking payments...');

        $payments = Payment::whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('transactions')
                    ->whereColumn('transactions.reference_id', 'payments.id')
                    ->where('transactions.reference_type', Payment::class);
            })
            ->get();

        $count = $payments->count();
        $this->info("Found {$count} payments without transactions");

        if ($count === 0) {
            return 0;
        }

        if (!$dryRun) {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            foreach ($payments as $payment) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'credit',
                    'amount' => $payment->amount,
                    'description' => 'Payment sync - #' . $payment->transaction_id,
                    'reference_type' => Payment::class,
                    'reference_id' => $payment->id,
                    'transaction_date' => $payment->payment_date,
                    'created_by' => null,
                ]);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
            $wallet->updateBalance();
        }

        return $count;
    }
}
