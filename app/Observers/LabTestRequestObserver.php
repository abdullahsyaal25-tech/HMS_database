<?php

namespace App\Observers;

use App\Models\LabTestRequest;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LabTestRequestObserver
{
    /**
     * Handle the LabTestRequest "created" event.
     */
    public function created(LabTestRequest $labTestRequest): void
    {
        // Only create transaction if lab test is already completed
        // Usually lab tests start as pending, so transactions are created on status change
        if ($labTestRequest->status === LabTestRequest::STATUS_COMPLETED) {
            $this->createWalletTransaction($labTestRequest, 'Lab test completed');
        }
    }

    /**
     * Handle the LabTestRequest "updated" event.
     */
    public function updated(LabTestRequest $labTestRequest): void
    {
        // Check if status changed to completed
        if ($labTestRequest->wasChanged('status') && $labTestRequest->status === LabTestRequest::STATUS_COMPLETED) {
            $this->createWalletTransaction($labTestRequest, 'Lab test completed');
        }
        
        // Check if cost changed while already completed
        if ($labTestRequest->wasChanged('cost') && $labTestRequest->status === LabTestRequest::STATUS_COMPLETED) {
            // Reverse previous transaction and create new one
            $this->reverseWalletTransaction($labTestRequest, 'Lab test cost updated - reversing previous');
            $this->createWalletTransaction($labTestRequest, 'Lab test cost updated');
        }
        
        // If status changed from completed to something else (cancelled), reverse transaction
        if ($labTestRequest->wasChanged('status') && 
            $labTestRequest->getOriginal('status') === LabTestRequest::STATUS_COMPLETED &&
            $labTestRequest->status !== LabTestRequest::STATUS_COMPLETED) {
            $this->reverseWalletTransaction($labTestRequest, 'Lab test status changed from completed');
        }
    }

    /**
     * Handle the LabTestRequest "deleted" event.
     */
    public function deleted(LabTestRequest $labTestRequest): void
    {
        // Reverse the transaction if it was completed
        if ($labTestRequest->status === LabTestRequest::STATUS_COMPLETED) {
            $this->reverseWalletTransaction($labTestRequest, 'Lab test deleted');
        }
    }

    /**
     * Create wallet transaction for lab test request.
     */
    private function createWalletTransaction(LabTestRequest $labTestRequest, string $description): void
    {
        $amount = $labTestRequest->cost ?? 0;
        
        if ($amount <= 0) {
            Log::info('LabTestRequestObserver: Skipping wallet transaction - zero or negative amount', [
                'lab_test_request_id' => $labTestRequest->id,
                'amount' => $amount,
            ]);
            return;
        }

        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => $description . ' - ' . ($labTestRequest->test_name ?? 'Lab Test') . ' (' . ($labTestRequest->request_id ?? 'ID: ' . $labTestRequest->id) . ')',
                'reference_type' => LabTestRequest::class,
                'reference_id' => $labTestRequest->id,
                'transaction_date' => $labTestRequest->completed_at ?? $labTestRequest->updated_at,
                'created_by' => Auth::id(),
            ]);

            $wallet->updateBalance();
            
            Log::info('LabTestRequestObserver: Created wallet transaction', [
                'lab_test_request_id' => $labTestRequest->id,
                'request_id' => $labTestRequest->request_id,
                'test_name' => $labTestRequest->test_name,
                'amount' => $amount,
                'description' => $description,
            ]);
        } catch (\Exception $e) {
            Log::error('LabTestRequestObserver: Failed to create wallet transaction', [
                'lab_test_request_id' => $labTestRequest->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reverse wallet transaction when lab test is deleted, cancelled, or updated.
     */
    private function reverseWalletTransaction(LabTestRequest $labTestRequest, string $reason): void
    {
        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            // Find existing transactions for this lab test request
            $existingTransactions = Transaction::where('reference_type', LabTestRequest::class)
                ->where('reference_id', $labTestRequest->id)
                ->where('type', 'credit')
                ->get();

            foreach ($existingTransactions as $transaction) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'debit',
                    'amount' => $transaction->amount,
                    'description' => $reason . ' - ' . $transaction->description,
                    'reference_type' => LabTestRequest::class,
                    'reference_id' => $labTestRequest->id,
                    'transaction_date' => now(),
                    'created_by' => Auth::id(),
                ]);
            }

            $wallet->updateBalance();
            
            Log::info('LabTestRequestObserver: Reversed wallet transaction', [
                'lab_test_request_id' => $labTestRequest->id,
                'request_id' => $labTestRequest->request_id,
                'reason' => $reason,
                'reversed_count' => $existingTransactions->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('LabTestRequestObserver: Failed to reverse wallet transaction', [
                'lab_test_request_id' => $labTestRequest->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
