`<?php

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

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = ['test'];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function test()
    {
        return $this->belongsTo(LabTest::class);
    }

    /**
     * Get the labTest relationship for frontend compatibility.
     * This is an alias for the test() relationship.
     */
    public function labTest()
    {
        return $this->belongsTo(LabTest::class, 'test_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Prepare the object for serialization.
     *
     * @return array
     */
    public function toArray()
    {
        $array = parent::toArray();
        
        // Add labTest relationship alias for frontend compatibility
        if ($this->relationLoaded('test')) {
            $array['labTest'] = $this->test;
        }
        
        return $array;
    }
}
