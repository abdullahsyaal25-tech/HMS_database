<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    use HasFactory;

    protected $fillable = [
        'prescription_code',
        'patient_id',
        'doctor_id',
        'diagnosis',
        'notes',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the patient associated with this prescription.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor who created this prescription.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the items in this prescription.
     */
    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    /**
     * Get the sales associated with this prescription.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for pending prescriptions.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for today's prescriptions.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Check if the prescription is fully dispensed.
     */
    public function isFullyDispensed(): bool
    {
        foreach ($this->items as $item) {
            if ($item->dispensed_quantity < $item->quantity) {
                return false;
            }
        }
        return true;
    }

    /**
     * Update prescription status based on dispensed items.
     */
    public function updateStatus(): void
    {
        $totalItems = $this->items->count();
        $fullyDispensed = $this->items->filter(function ($item) {
            return $item->dispensed_quantity >= $item->quantity;
        })->count();
        
        $partiallyDispensed = $this->items->filter(function ($item) {
            return $item->dispensed_quantity > 0 && $item->dispensed_quantity < $item->quantity;
        })->count();

        if ($fullyDispensed === $totalItems) {
            $this->update(['status' => 'dispensed']);
        } elseif ($partiallyDispensed > 0 || $fullyDispensed > 0) {
            $this->update(['status' => 'partial']);
        }
    }

    /**
     * Boot method to generate prescription code.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($prescription) {
            if (empty($prescription->prescription_code)) {
                $prescription->prescription_code = self::generatePrescriptionCode();
            }
        });
    }

    /**
     * Generate a unique prescription code.
     */
    public static function generatePrescriptionCode(): string
    {
        $prefix = 'RX';
        $date = now()->format('Ymd');
        
        // Get the last prescription ID for today
        $lastPrescription = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastPrescription ? (int) substr($lastPrescription->prescription_code, -4) + 1 : 1;
        
        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }
}
