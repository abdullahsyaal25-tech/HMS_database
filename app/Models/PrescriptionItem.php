<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_id',
        'medicine_id',
        'dosage',
        'frequency',
        'duration',
        'quantity',
        'instructions',
        'dispensed_quantity',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'dispensed_quantity' => 'integer',
    ];

    /**
     * Get the prescription associated with this item.
     */
    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    /**
     * Get the medicine associated with this item.
     */
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    /**
     * Get the remaining quantity to be dispensed.
     */
    public function getRemainingQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->dispensed_quantity);
    }

    /**
     * Check if the item is fully dispensed.
     */
    public function isFullyDispensed(): bool
    {
        return $this->dispensed_quantity >= $this->quantity;
    }

    /**
     * Check if the item is partially dispensed.
     */
    public function isPartiallyDispensed(): bool
    {
        return $this->dispensed_quantity > 0 && $this->dispensed_quantity < $this->quantity;
    }

    /**
     * Dispense a quantity of this item.
     */
    public function dispense(int $quantity): bool
    {
        if ($quantity > $this->getRemainingQuantityAttribute()) {
            return false;
        }

        $this->dispensed_quantity += $quantity;
        $this->save();

        // Update parent prescription status
        $this->prescription->updateStatus();

        return true;
    }

    /**
     * Scope for items that need dispensing.
     */
    public function scopeNeedsDispensing($query)
    {
        return $query->whereRaw('dispensed_quantity < quantity');
    }

    /**
     * Scope for fully dispensed items.
     */
    public function scopeFullyDispensed($query)
    {
        return $query->whereRaw('dispensed_quantity >= quantity');
    }

    /**
     * Scope for items by medicine.
     */
    public function scopeForMedicine($query, int $medicineId)
    {
        return $query->where('medicine_id', $medicineId);
    }
}
