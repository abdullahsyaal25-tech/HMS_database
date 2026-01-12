<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\PurchaseOrder;
use App\Models\Medicine;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'medicine_id',
        'quantity',
        'unit_cost',
        'total_cost',
        'batch_number',
        'expiry_date',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
