<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Bill;

class BillItem extends Model
{
    protected $fillable = [
        'bill_id',
        'item_description',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }
}
