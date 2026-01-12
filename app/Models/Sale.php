<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;
use App\Models\User;
use App\Models\SalesItem;

class Sale extends Model
{
    protected $fillable = [
        'invoice_number',
        'patient_id',
        'sold_by',
        'total_amount',
        'discount',
        'tax',
        'net_amount',
        'payment_status',
        'status',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'net_amount' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function soldBy()
    {
        return $this->belongsTo(User::class, 'sold_by');
    }

    public function items()
    {
        return $this->hasMany(SalesItem::class);
    }
}
