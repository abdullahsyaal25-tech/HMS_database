<?php

namespace App\Console\Commands;

use App\Models\Medicine;
use App\Models\MedicineAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckExpiryAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'alerts:check-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for medicines that are expiring soon and create alerts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expiry alerts...');
        
        // Get medicines that are expiring in the next 30 days
        $expiringSoon = Medicine::whereDate('expiry_date', '>', now())
                            ->whereDate('expiry_date', '<=', now()->addDays(30))
                            ->where('stock_quantity', '>', 0)
                            ->get();
        
        // Get expired medicines
        $expired = Medicine::whereDate('expiry_date', '<', now())
                        ->where('stock_quantity', '>', 0)
                        ->get();
        
        // Get medicines that are low in stock and expiring soon
        $lowStockExpiring = Medicine::where('stock_quantity', '<=', 10)
                                ->where('stock_quantity', '>', 0)
                                ->whereDate('expiry_date', '<=', now()->addDays(30))
                                ->get();
        
        $alertCount = 0;
        
        // Create alerts for expiring soon medicines
        foreach ($expiringSoon as $medicine) {
            $alert = MedicineAlert::firstOrCreate([
                'medicine_id' => $medicine->id,
                'alert_type' => 'expiring_soon',
                'status' => 'pending',
            ], [
                'message' => "Medicine {$medicine->name} is expiring soon on {$medicine->expiry_date->format('Y-m-d')}",
                'severity' => 'warning',
                'data' => [
                    'expiry_date' => $medicine->expiry_date->format('Y-m-d'),
                    'stock_quantity' => $medicine->stock_quantity,
                    'medicine_name' => $medicine->name,
                ],
            ]);
            
            if ($alert->wasRecentlyCreated) {
                $alertCount++;
            }
        }
        
        // Create alerts for expired medicines
        foreach ($expired as $medicine) {
            $alert = MedicineAlert::firstOrCreate([
                'medicine_id' => $medicine->id,
                'alert_type' => 'expired',
                'status' => 'pending',
            ], [
                'message' => "Medicine {$medicine->name} has expired on {$medicine->expiry_date->format('Y-m-d')}",
                'severity' => 'danger',
                'data' => [
                    'expiry_date' => $medicine->expiry_date->format('Y-m-d'),
                    'stock_quantity' => $medicine->stock_quantity,
                    'medicine_name' => $medicine->name,
                ],
            ]);
            
            if ($alert->wasRecentlyCreated) {
                $alertCount++;
            }
        }
        
        // Create alerts for low stock medicines that are expiring soon
        foreach ($lowStockExpiring as $medicine) {
            $alert = MedicineAlert::firstOrCreate([
                'medicine_id' => $medicine->id,
                'alert_type' => 'low_stock_expiring',
                'status' => 'pending',
            ], [
                'message' => "Low stock medicine {$medicine->name} is expiring soon on {$medicine->expiry_date->format('Y-m-d')}",
                'severity' => 'danger',
                'data' => [
                    'expiry_date' => $medicine->expiry_date->format('Y-m-d'),
                    'stock_quantity' => $medicine->stock_quantity,
                    'medicine_name' => $medicine->name,
                ],
            ]);
            
            if ($alert->wasRecentlyCreated) {
                $alertCount++;
            }
        }
        
        $this->info("Created {$alertCount} new expiry alerts");
        
        // Update status of alerts for medicines that are no longer expiring
        $this->updateResolvedAlerts();
        
        $this->info('Expiry alert check completed!');
    }
    
    /**
     * Update status of alerts that have been resolved
     */
    private function updateResolvedAlerts()
    {
        // Find all 'expiring_soon' alerts
        $expiringSoonAlerts = MedicineAlert::where('alert_type', 'expiring_soon')
                                    ->where('status', '!=', 'resolved')
                                    ->get();
        
        foreach ($expiringSoonAlerts as $alert) {
            $medicine = $alert->medicine;
            
            // If the medicine has already expired or is no longer expiring soon, mark alert as resolved
            if ($medicine->expiry_date < now() || $medicine->stock_quantity <= 0) {
                $alert->update(['status' => 'resolved']);
            }
        }
        
        // Find all 'expired' alerts for medicines that have been restocked
        $expiredAlerts = MedicineAlert::where('alert_type', 'expired')
                              ->where('status', '!=', 'resolved')
                              ->get();
        
        foreach ($expiredAlerts as $alert) {
            $medicine = $alert->medicine;
            
            // If the medicine has been removed from inventory, mark alert as resolved
            if ($medicine->stock_quantity <= 0) {
                $alert->update(['status' => 'resolved']);
            }
        }
    }
}