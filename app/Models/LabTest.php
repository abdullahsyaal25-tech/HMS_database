<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\LabTestResult;

class LabTest extends Model
{
    protected $fillable = [
        'test_code',
        'name',
        'description',
        'procedure',
        'cost',
        'turnaround_time',
        'unit',
        'normal_values',
        'status',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
    ];

    public function labTestResults()
    {
        return $this->hasMany(LabTestResult::class);
    }
}
