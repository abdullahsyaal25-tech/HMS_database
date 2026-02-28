<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AppointmentObserver
{
    /**
     * Handle the Appointment "created" event.
     */
    public function created(Appointment $appointment): void
    {
        // Only create transaction if appointment is completed/confirmed and has no services
        // Services are tracked separately in department revenue
        if (in_array($appointment->status, ['completed', 'confirmed'])) {
            $this->createWalletTransaction($appointment, 'Appointment created');
        }
    }

    /**
     * Handle the Appointment "updated" event.
     */
    public function updated(Appointment $appointment): void
    {
        // Check if status changed to completed/confirmed
        if ($appointment->wasChanged('status') && in_array($appointment->status, ['completed', 'confirmed'])) {
            // Only create transaction if no services attached
            if (!$appointment->services()->exists()) {
                $this->createWalletTransaction($appointment, 'Appointment completed');
            }
        }
        
        // Check if fee or discount changed while already completed/confirmed
        if (($appointment->wasChanged('fee') || $appointment->wasChanged('discount')) 
            && in_array($appointment->status, ['completed', 'confirmed'])) {
            // Reverse previous transaction and create new one
            if (!$appointment->services()->exists()) {
                $this->reverseWalletTransaction($appointment, 'Appointment updated - reversing previous');
                $this->createWalletTransaction($appointment, 'Appointment updated');
            }
        }
    }

    /**
     * Handle the Appointment "deleted" event.
     */
    public function deleted(Appointment $appointment): void
    {
        // Reverse the transaction if appointment was completed/confirmed
        if (in_array($appointment->status, ['completed', 'confirmed'])) {
            $this->reverseWalletTransaction($appointment, 'Appointment deleted');
        }
    }

    /**
     * Create wallet transaction for appointment.
     */
    private function createWalletTransaction(Appointment $appointment, string $description): void
    {
        // Skip if appointment has services (services are tracked separately)
        if ($appointment->services()->exists()) {
            return;
        }

        // Skip Laboratory department appointments (tracked separately)
        if ($appointment->department && $appointment->department->name === 'Laboratory') {
            return;
        }

        $amount = $this->calculateAmount($appointment);
        
        if ($amount <= 0) {
            return;
        }

        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => $description . ' - ' . ($appointment->appointment_id ?? 'ID: ' . $appointment->id),
                'reference_type' => Appointment::class,
                'reference_id' => $appointment->id,
                'transaction_date' => $appointment->created_at,
                'created_by' => Auth::id(),
            ]);

            $wallet->updateBalance();
            
            Log::info('AppointmentObserver: Created wallet transaction', [
                'appointment_id' => $appointment->id,
                'amount' => $amount,
                'description' => $description,
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentObserver: Failed to create wallet transaction', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reverse wallet transaction when appointment is deleted or updated.
     */
    private function reverseWalletTransaction(Appointment $appointment, string $reason): void
    {
        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            // Find existing transactions for this appointment
            $existingTransactions = Transaction::where('reference_type', Appointment::class)
                ->where('reference_id', $appointment->id)
                ->where('type', 'credit')
                ->get();

            foreach ($existingTransactions as $transaction) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'debit',
                    'amount' => $transaction->amount,
                    'description' => $reason . ' - ' . ($appointment->appointment_id ?? 'ID: ' . $appointment->id),
                    'reference_type' => Appointment::class,
                    'reference_id' => $appointment->id,
                    'transaction_date' => now(),
                    'created_by' => Auth::id(),
                ]);
            }

            $wallet->updateBalance();
            
            Log::info('AppointmentObserver: Reversed wallet transaction', [
                'appointment_id' => $appointment->id,
                'reason' => $reason,
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentObserver: Failed to reverse wallet transaction', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Calculate the appointment amount.
     */
    private function calculateAmount(Appointment $appointment): float
    {
        return max(0, ($appointment->fee ?? 0) - ($appointment->discount ?? 0));
    }
}
