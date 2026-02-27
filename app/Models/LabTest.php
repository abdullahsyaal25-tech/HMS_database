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
        'sample_type',
        'cost',
        'turnaround_time',
        'unit',
        'normal_values',
        'status',
        'category',
        'parameters',
        'reference_ranges',
    ];

    protected $casts = [
        'cost' => 'decimal:2',
        'reference_ranges' => 'array',
        'parameters' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'test_id',
    ];

    /**
     * Accessor to return test_code as test_id for frontend compatibility.
     * The frontend expects test_id but the database uses test_code.
     *
     * @return string
     */
    public function getTestIdAttribute(): string
    {
        return $this->test_code;
    }

    public function labTestResults()
    {
        return $this->hasMany(LabTestResult::class);
    }

    /**
     * Get the lab test requests for this test.
     */
    public function labTestRequests()
    {
        return $this->hasMany(LabTestRequest::class);
    }
}
