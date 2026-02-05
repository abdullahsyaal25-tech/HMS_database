<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentConsistencyLog extends Model
{
    protected $fillable = [
        'clinical_assessment_id',
        'patient_id',
        'consistency_check_type',
        'previous_value',
        'current_value',
        'analysis_notes',
        'logged_by',
    ];

    protected $casts = [
        'previous_value' => 'array',
        'current_value' => 'array',
    ];

    /**
     * Get the clinical assessment for this log.
     */
    public function clinicalAssessment(): BelongsTo
    {
        return $this->belongsTo(ClinicalAssessment::class);
    }

    /**
     * Get the patient for this log.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the user who logged this entry.
     */
    public function loggedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
