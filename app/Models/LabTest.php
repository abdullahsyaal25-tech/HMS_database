<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\LabTestResult;

class LabTest extends Model
{
    use HasFactory;
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
