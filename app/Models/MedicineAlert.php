<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Medicine;

class MedicineAlert extends Model
{
    protected $fillable = [
        'medicine_id',
        'alert_type',
        'message',
        'priority',
        'status',
        'is_read',
        'triggered_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'triggered_at' => 'datetime',
        'status' => 'string',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
