<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\User;
use App\Models\BillItem;

class Bill extends Model
{
    protected $fillable = [
        'bill_number',
        'patient_id',
        'doctor_id',
        'created_by',
        'bill_date',
        'sub_total',
        'discount',
        'tax',
        'total_amount',
        'amount_paid',
        'amount_due',
        'payment_status',
        'status',
        'notes',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'sub_total' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }
}
