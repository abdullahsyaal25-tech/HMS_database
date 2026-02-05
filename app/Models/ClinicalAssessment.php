<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClinicalAssessment extends Model
{
    protected $fillable = [
        'assessment_number',
        'medical_record_id',
        'patient_id',
        'assessor_id',
        'assessment_type',
        'symptom_validity_findings',
        'symptom_validity_score',
        'symptom_validity_rating',
        'general_appearance',
        'interaction_style',
        'affect_and_mood',
        'cognitive_presentation',
        'pain_behavior_observations',
        'historical_consistency_analysis',
        'cross_visit_pattern_analysis',
        'symptom_exaggeration_indicators',
        'symptom_minimization_indicators',
        'financial_incentives_present',
        'medication_seeking_present',
        'responsibility_avoidance_present',
        'attention_seeking_present',
        'legal_compensation_present',
        'secondary_gain_analysis',
        'collateral_history_notes',
        'prior_medical_records_review',
        'family_report_notes',
        'primary_diagnosis_impression',
        'differential_diagnosis',
        'assessment_limitations',
        'further_evaluation_recommended',
        'treatment_recommendations',
        'follow_up_plan',
        'overall_reliability_rating',
        'fabrication_suspicion_level',
        'assessment_summary',
        'status',
    ];

    protected $casts = [
        'symptom_validity_score' => 'integer',
        'financial_incentives_present' => 'boolean',
        'medication_seeking_present' => 'boolean',
        'responsibility_avoidance_present' => 'boolean',
        'attention_seeking_present' => 'boolean',
        'legal_compensation_present' => 'boolean',
        'assessment_summary' => 'array',
    ];

    /**
     * Get the medical record for this assessment.
     */
    public function medicalRecord(): BelongsTo
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    /**
     * Get the patient for this assessment.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the assessor (doctor) for this assessment.
     */
    public function assessor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assessor_id');
    }

    /**
     * Get consistency logs for this assessment.
     */
    public function consistencyLogs(): HasMany
    {
        return $this->hasMany(AssessmentConsistencyLog::class);
    }

    /**
     * Scope for finalized assessments.
     */
    public function scopeFinalized($query)
    {
        return $query->where('status', 'finalized');
    }

    /**
     * Scope for assessments by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('assessment_type', $type);
    }

    /**
     * Scope for assessments with fabrication concerns.
     */
    public function scopeWithFabricationConcerns($query)
    {
        return $query->whereIn('fabrication_suspicion_level', ['moderate', 'high']);
    }

    /**
     * Check if assessment is finalized.
     */
    public function isFinalized(): bool
    {
        return $this->status === 'finalized';
    }

    /**
     * Finalize the assessment.
     */
    public function finalize(): bool
    {
        if ($this->isFinalized()) {
            return false;
        }

        return $this->update(['status' => 'finalized']);
    }

    /**
     * Get fabrication risk level as numeric value.
     */
    public function getFabricationRiskScore(): int
    {
        return match ($this->fabrication_suspicion_level) {
            'none' => 0,
            'low' => 25,
            'moderate' => 50,
            'high' => 75,
            default => 0,
        };
    }

    /**
     * Get reliability score as numeric value.
     */
    public function getReliabilityScore(): int
    {
        return match ($this->overall_reliability_rating) {
            'reliable' => 100,
            'moderately_reliable' => 60,
            'unreliable' => 25,
            default => 50,
        };
    }

    /**
     * Generate unique assessment number.
     */
    public static function generateAssessmentNumber(): string
    {
        $prefix = 'CA';
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;

        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }

    /**
     * Boot method to generate assessment number.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($assessment) {
            if (empty($assessment->assessment_number)) {
                $assessment->assessment_number = self::generateAssessmentNumber();
            }
        });
    }
}
