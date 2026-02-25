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
        'category',
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
}
