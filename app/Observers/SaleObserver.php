<?php

namespace App\Observers;

use App\Models\Sale;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Events\WalletUpdated;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Auth;

class SaleObserver
{
    /**
     * Handle the Sale "created" event.
     */
    public function created(Sale $sale): void
    {
        if ($sale->payment_status === 'paid') {
            $this->updateWallet($sale, 'Pharmacy sale');
        }
    }

    /**
     * Handle the Sale "updated" event.
     */
    public function updated(Sale $sale): void
    {
        // Only update if payment status changed to paid
        if ($sale->wasChanged('payment_status') && $sale->payment_status === 'paid') {
            $this->updateWallet($sale, 'Pharmacy sale payment');
        }
    }

    /**
     * Handle the Sale "deleted" event.
     */
    public function deleted(Sale $sale): void
    {
        // Reverse the transaction if it was paid
        if ($sale->payment_status === 'paid') {
            $this->reverseWalletTransaction($sale);
        }
    }

    /**
     * Update wallet balance and create transaction.
     */
    private function updateWallet(Sale $sale, string $description): void
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        // Create transaction record
        Transaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $sale->grand_total,
            'description' => $description . ' - ' . $sale->sale_id,
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'transaction_date' => $sale->created_at,
            'created_by' => Auth::id(),
        ]);

        // Update wallet balance
        $wallet->updateBalance();

        // Broadcast update
        // $this->broadcastWalletUpdate($wallet);
    }

    /**
     * Reverse wallet transaction when sale is deleted.
     */
    private function reverseWalletTransaction(Sale $sale): void
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        // Create reversal transaction
        Transaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $sale->grand_total,
            'description' => 'Sale reversal - ' . $sale->sale_id,
            'reference_type' => Sale::class,
            'reference_id' => $sale->id,
            'transaction_date' => now(),
            'created_by' => Auth::id(),
        ]);

        // Update wallet balance
        $wallet->updateBalance();

        // Broadcast update
        // $this->broadcastWalletUpdate($wallet);
    }

    /**
     * Broadcast wallet update event.
     */
    private function broadcastWalletUpdate(Wallet $wallet): void
    {
        // Get latest data for broadcasting
        $controller = app(WalletController::class);
        $revenueData = $controller->getRevenueData();
        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        broadcast(new WalletUpdated($wallet, $revenueData, $transactions))->toOthers();
    }
}
