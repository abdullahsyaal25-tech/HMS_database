<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'patient_id',
        'prescription_id',
        'sold_by',
        'total_amount',
        'discount',
        'tax',
        'grand_total',
        'payment_method',
        'payment_status',
        'status',
        'notes',
        'void_reason',
        'voided_by',
        'voided_at',
        'is_prescription_sale',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'voided_at' => 'datetime',
        'is_prescription_sale' => 'boolean',
    ];

    /**
     * Get the patient associated with this sale.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the prescription associated with this sale.
     */
    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    /**
     * Get the user who sold the items.
     */
    public function soldBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sold_by');
    }

    /**
     * Get the user who voided the sale.
     */
    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /**
     * Get the items in this sale.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesItem::class);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by payment method.
     */
    public function scopeByPaymentMethod($query, string $paymentMethod)
    {
        return $query->where('payment_method', $paymentMethod);
    }

    /**
     * Scope for date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope for today's sales.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Scope for completed sales only.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Check if the sale can be voided.
     */
    public function canBeVoided(): bool
    {
        return !in_array($this->status, ['cancelled', 'refunded']);
    }

    /**
     * Get the total items count.
     */
    public function getItemsCountAttribute(): int
    {
        return $this->items->sum('quantity');
    }
}
