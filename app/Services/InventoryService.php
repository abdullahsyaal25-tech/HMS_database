<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    protected $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Check if a medicine has sufficient stock available.
     *
     * @param int $medicineId
     * @param int $quantity
     * @return bool
     */
    public function checkAvailability(int $medicineId, int $quantity): bool
    {
        $medicine = Medicine::find($medicineId);
        
        if (!$medicine) {
            return false;
        }
        
        return $medicine->stock_quantity >= $quantity;
    }

    /**
     * Get the current stock level for a medicine.
     *
     * @param int $medicineId
     * @return int
     */
    public function getStockLevel(int $medicineId): int
    {
        $medicine = Medicine::find($medicineId);
        
        return $medicine ? $medicine->stock_quantity : 0;
    }

    /**
     * Deduct stock for a medicine.
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function deductStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            if ($medicine->stock_quantity < $quantity) {
                throw new \Exception(
                    "Insufficient stock for {$medicine->name}. Available: {$medicine->stock_quantity}, Requested: {$quantity}"
                );
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock - $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'out',
                $quantity,
                $previousStock,
                $newStock,
                'sale',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Deduction',
                'Inventory',
                "Deducted {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Restore stock for a medicine (e.g., when voiding a sale).
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function restoreStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock + $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'in',
                $quantity,
                $previousStock,
                $newStock,
                'return',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Restoration',
                'Inventory',
                "Restored {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Adjust stock for a medicine (for corrections, damages, etc.).
     *
     * @param int $medicineId
     * @param int $newQuantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function adjustStock(int $medicineId, int $newQuantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $newQuantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $quantity = abs($newQuantity - $previousStock);
            $type = $newQuantity > $previousStock ? 'in' : 'out';
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newQuantity,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                $type,
                $quantity,
                $previousStock,
                $newQuantity,
                'adjustment',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Adjustment',
                'Inventory',
                "Adjusted stock of {$medicine->name} from {$previousStock} to {$newQuantity}. Reason: {$reason}",
                'warning'
            );
            
            return true;
        });
    }

    /**
     * Add stock for a medicine (e.g., receiving a purchase order).
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function addStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock + $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'in',
                $quantity,
                $previousStock,
                $newStock,
                'purchase',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Addition',
                'Inventory',
                "Added {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Record a stock movement.
     *
     * @param int $medicineId
     * @param string $type
     * @param int $quantity
     * @param int $previousStock
     * @param int $newStock
     * @param string $referenceType
     * @param int|null $referenceId
     * @param string|null $notes
     * @return StockMovement
     */
    protected function recordStockMovement(
        int $medicineId,
        string $type,
        int $quantity,
        int $previousStock,
        int $newStock,
        string $referenceType,
        ?int $referenceId = null,
        ?string $notes = null
    ): StockMovement {
        return StockMovement::create([
            'medicine_id' => $medicineId,
            'type' => $type,
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Get stock movement history for a medicine.
     *
     * @param int $medicineId
     * @param int $limit
     * @return array
     */
    public function getStockHistory(int $medicineId, int $limit = 50): array
    {
        return StockMovement::where('medicine_id', $medicineId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get low stock medicines.
     *
     * @return array
     */
    public function getLowStockMedicines(): array
    {
        return Medicine::whereColumn('stock_quantity', '<=', 'reorder_level')
            ->where('stock_quantity', '>', 0)
            ->with('category')
            ->get()
            ->toArray();
    }

    /**
     * Get out of stock medicines.
     *
     * @return array
     */
    public function getOutOfStockMedicines(): array
    {
        return Medicine::where('stock_quantity', '<=', 0)
            ->with('category')
            ->get()
            ->toArray();
    }

    /**
     * Check if stock is low for a medicine.
     *
     * @param int $medicineId
     * @return bool
     */
    public function isStockLow(int $medicineId): bool
    {
        $medicine = Medicine::find($medicineId);
        
        if (!$medicine) {
            return false;
        }
        
        return $medicine->stock_quantity <= $medicine->reorder_level;
    }
}
