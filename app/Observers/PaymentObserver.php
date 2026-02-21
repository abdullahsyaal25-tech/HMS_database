<?php

namespace App\Observers;

use App\Models\Payment;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Events\WalletUpdated;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Auth;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        $this->updateWallet($payment, 'Payment received');
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        // Only update if payment status changed or amount changed
        if ($payment->wasChanged(['amount', 'status'])) {
            $this->updateWallet($payment, 'Payment updated');
        }
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        // Reverse the transaction
        $this->reverseWalletTransaction($payment);
    }

    /**
     * Update wallet balance and create transaction.
     */
    private function updateWallet(Payment $payment, string $description): void
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        // Create transaction record
        Transaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'credit',
            'amount' => $payment->amount,
            'description' => $description . ' - Payment #' . $payment->transaction_id,
            'reference_type' => Payment::class,
            'reference_id' => $payment->id,
            'transaction_date' => $payment->payment_date,
            'created_by' => Auth::id(),
        ]);

        // Update wallet balance
        $wallet->updateBalance();

        // Broadcast update
        // $this->broadcastWalletUpdate($wallet);
    }

    /**
     * Reverse wallet transaction when payment is deleted.
     */
    private function reverseWalletTransaction(Payment $payment): void
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        // Create reversal transaction
        Transaction::create([
            'wallet_id' => $wallet->id,
            'type' => 'debit',
            'amount' => $payment->amount,
            'description' => 'Payment reversal - Payment #' . $payment->transaction_id,
            'reference_type' => Payment::class,
            'reference_id' => $payment->id,
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
        $revenueData = app(WalletController::class)->getRevenueData();
        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        broadcast(new WalletUpdated($wallet, $revenueData, $transactions))->toOthers();
    }
}
