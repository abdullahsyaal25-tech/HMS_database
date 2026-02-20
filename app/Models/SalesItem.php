<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'medicine_id',
        'quantity',
        'unit_price',
        'cost_price',
        'total_price',
        'discount',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    /**
     * Get the sale associated with this item.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the medicine associated with this item.
     */
    public function medicine(): BelongsTo
    {
        return $this->belongsTo(Medicine::class);
    }

    /**
     * Calculate the discounted price.
     */
    public function getDiscountedPriceAttribute(): float
    {
        if ($this->discount > 0) {
            return $this->total_price * (1 - ($this->discount / 100));
        }
        return $this->total_price;
    }

    /**
     * Scope for filtering by medicine.
     */
    public function scopeForMedicine($query, int $medicineId)
    {
        return $query->where('medicine_id', $medicineId);
    }

    /**
     * Scope for filtering by sale.
     */
    public function scopeForSale($query, int $saleId)
    {
        return $query->where('sale_id', $saleId);
    }
}
