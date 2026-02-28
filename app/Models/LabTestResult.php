<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Patient;
use App\Models\LabTest;
use App\Models\User;

class LabTestResult extends Model
{
    protected $fillable = [
        'result_id',
        'patient_id',
        'test_id',
        'performed_by',
        'results',
        'notes',
        'abnormal_flags',
        'status',
        'performed_at',
        'verified_at',
        'verified_by',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function test()
    {
        return $this->belongsTo(LabTest::class);
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
