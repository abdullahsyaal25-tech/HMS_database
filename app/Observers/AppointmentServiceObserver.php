<?php

namespace App\Observers;

use App\Models\AppointmentService;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Department;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AppointmentServiceObserver
{
    /**
     * Handle the AppointmentService "created" event.
     * Triggered when a department service is attached to an appointment.
     */
    public function created(AppointmentService $appointmentService): void
    {
        // Load relationships
        $appointmentService->load(['appointment', 'departmentService.department']);
        
        $appointment = $appointmentService->appointment;
        
        // Only create transaction if appointment is completed/confirmed
        if (!$appointment || !in_array($appointment->status, ['completed', 'confirmed'])) {
            return;
        }

        $department = $appointmentService->departmentService?->department;
        
        // Skip if no department found
        if (!$department) {
            return;
        }

        $this->createWalletTransaction($appointmentService, 'Department service added to appointment');
    }

    /**
     * Handle the AppointmentService "updated" event.
     */
    public function updated(AppointmentService $appointmentService): void
    {
        // If final_cost changed, reverse old transaction and create new one
        if ($appointmentService->wasChanged('final_cost')) {
            $this->reverseWalletTransaction($appointmentService, 'Service cost updated - reversing previous');
            
            $appointmentService->load(['appointment', 'departmentService.department']);
            $appointment = $appointmentService->appointment;
            
            if ($appointment && in_array($appointment->status, ['completed', 'confirmed'])) {
                $this->createWalletTransaction($appointmentService, 'Service cost updated');
            }
        }
    }

    /**
     * Handle the AppointmentService "deleted" event.
     * Triggered when a department service is detached from an appointment.
     */
    public function deleted(AppointmentService $appointmentService): void
    {
        // Reverse the transaction
        $this->reverseWalletTransaction($appointmentService, 'Service removed from appointment');
    }

    /**
     * Create wallet transaction for department service.
     */
    private function createWalletTransaction(AppointmentService $appointmentService, string $description): void
    {
        $amount = $appointmentService->final_cost;
        
        if ($amount <= 0) {
            return;
        }

        // Load relationships if not loaded
        $appointmentService->loadMissing(['appointment', 'departmentService.department']);
        
        $appointment = $appointmentService->appointment;
        $department = $appointmentService->departmentService?->department;
        
        if (!$appointment || !$department) {
            return;
        }

        // Determine transaction type based on department
        $isLaboratory = ($department->name === 'Laboratory');
        $serviceName = $appointmentService->departmentService?->name ?? 'Service';
        $appointmentId = $appointment->appointment_id ?? 'ID: ' . $appointment->id;

        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $amount,
                'description' => $description . ' - ' . $serviceName . ' (' . $department->name . ') - ' . $appointmentId,
                'reference_type' => AppointmentService::class,
                'reference_id' => $appointmentService->id,
                'transaction_date' => $appointmentService->created_at,
                'created_by' => Auth::id(),
            ]);

            $wallet->updateBalance();
            
            Log::info('AppointmentServiceObserver: Created wallet transaction', [
                'appointment_service_id' => $appointmentService->id,
                'appointment_id' => $appointment->id,
                'department' => $department->name,
                'amount' => $amount,
                'is_laboratory' => $isLaboratory,
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentServiceObserver: Failed to create wallet transaction', [
                'appointment_service_id' => $appointmentService->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Reverse wallet transaction when service is removed or updated.
     */
    private function reverseWalletTransaction(AppointmentService $appointmentService, string $reason): void
    {
        try {
            $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

            // Find existing transactions for this appointment service
            $existingTransactions = Transaction::where('reference_type', AppointmentService::class)
                ->where('reference_id', $appointmentService->id)
                ->where('type', 'credit')
                ->get();

            foreach ($existingTransactions as $transaction) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'debit',
                    'amount' => $transaction->amount,
                    'description' => $reason . ' - ' . $transaction->description,
                    'reference_type' => AppointmentService::class,
                    'reference_id' => $appointmentService->id,
                    'transaction_date' => now(),
                    'created_by' => Auth::id(),
                ]);
            }

            $wallet->updateBalance();
            
            Log::info('AppointmentServiceObserver: Reversed wallet transaction', [
                'appointment_service_id' => $appointmentService->id,
                'reason' => $reason,
                'reversed_count' => $existingTransactions->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('AppointmentServiceObserver: Failed to reverse wallet transaction', [
                'appointment_service_id' => $appointmentService->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
