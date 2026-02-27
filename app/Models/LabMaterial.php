<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabMaterial extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'material_id',
        'name',
        'quantity',
        'lab_test_id',
        'description',
        'status',
        'reorder_level',
        'unit',
        'cost_per_unit',
        'supplier',
        'expiry_date',
        'created_by',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reorder_level' => 'integer',
        'cost_per_unit' => 'decimal:2',
        'expiry_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'material_code',
    ];

    /**
     * Accessor to return material_id as material_code for frontend compatibility.
     */
    public function getMaterialCodeAttribute(): string
    {
        return $this->material_id;
    }

    /**
     * Boot method to automatically generate material_id and update status
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->material_id)) {
                $model->material_id = $model->generateMaterialId();
            }
            // Auto-update status based on quantity
            $model->updateStatus();
        });

        static::updating(function ($model) {
            // Auto-update status when quantity changes
            if ($model->isDirty('quantity')) {
                $model->updateStatus();
            }
        });
    }

    /**
     * Generate unique material ID
     */
    public function generateMaterialId(): string
    {
        $prefix = 'MAT-';
        $year = date('Y');
        $month = date('m');
        $lastMaterial = self::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $sequence = $lastMaterial ? intval(substr($lastMaterial->material_id, -4)) + 1 : 1;
        return $prefix . $year . $month . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get the lab test that this material belongs to
     */
    public function labTest()
    {
        return $this->belongsTo(LabTest::class, 'lab_test_id');
    }

    /**
     * Get the user who created this material
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to get materials with low stock
     */
    public function scopeLowStock($query)
    {
        return $query->where('quantity', '<=', 'reorder_level')
                     ->where('status', '!=', 'out_of_stock');
    }

    /**
     * Scope to get materials that are out of stock
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', 0);
    }

    /**
     * Scope to get materials by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Update material quantity
     */
    public function updateQuantity(int $newQuantity): bool
    {
        $this->quantity = $newQuantity;
        $this->updateStatus();
        return $this->save();
    }

    /**
     * Add quantity to existing stock
     */
    public function addStock(int $quantity): bool
    {
        $this->quantity += $quantity;
        $this->updateStatus();
        return $this->save();
    }

    /**
     * Remove quantity from existing stock
     */
    public function removeStock(int $quantity): bool
    {
        if ($this->quantity < $quantity) {
            return false; // Not enough stock
        }
        
        $this->quantity -= $quantity;
        $this->updateStatus();
        return $this->save();
    }

    /**
     * Update material status based on quantity
     */
    protected function updateStatus(): void
    {
        if ($this->quantity == 0) {
            $this->status = 'out_of_stock';
        } elseif ($this->quantity <= $this->reorder_level) {
            $this->status = 'low_stock';
        } else {
            $this->status = 'active';
        }
    }

    /**
     * Check if material is low stock
     */
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->reorder_level && $this->quantity > 0;
    }

    /**
     * Check if material is out of stock
     */
    public function isOutOfStock(): bool
    {
        return $this->quantity == 0;
    }

    /**
     * Check if material is active (sufficient stock)
     */
    public function isActive(): bool
    {
        return $this->quantity > $this->reorder_level;
    }
}
