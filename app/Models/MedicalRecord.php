<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRecord extends Model
{
    protected $fillable = [
        'record_number',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'visit_date',
        'chief_complaint',
        'present_illness',
        'past_medical_history',
        'family_history',
        'physical_examination',
        'diagnosis',
        'treatment_plan',
        'prescription',
        'notes',
        'vital_signs_bp',
        'vital_signs_temp',
        'vital_signs_pulse',
        'vital_signs_resp',
        'vital_signs_weight',
        'vital_signs_height',
        'status',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'vital_signs_temp' => 'decimal:1',
        'vital_signs_pulse' => 'integer',
        'vital_signs_resp' => 'integer',
        'vital_signs_weight' => 'decimal:2',
        'vital_signs_height' => 'decimal:2',
        // Encrypt sensitive medical data
        'diagnosis' => 'encrypted',
        'prescription' => 'encrypted',
        'medical_history' => 'encrypted',
    ];

    /**
     * Get the patient for this record.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor for this record.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the associated appointment.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the user who created this record.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this record.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope for finalized records.
     */
    public function scopeFinalized($query)
    {
        return $query->where('status', 'finalized');
    }

    /**
     * Scope for draft records.
     */
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    /**
     * Check if record can be edited.
     */
    public function isEditable(): bool
    {
        return $this->status !== 'finalized';
    }

    /**
     * Finalize the record.
     */
    public function finalize(): bool
    {
        if ($this->status === 'finalized') {
            return false;
        }

        return $this->update(['status' => 'finalized']);
    }

    /**
     * Generate unique record number.
     */
    public static function generateRecordNumber(): string
    {
        $prefix = 'MR';
        $date = now()->format('Ymd');
        $count = static::whereDate('created_at', today())->count() + 1;
        
        return sprintf('%s-%s-%04d', $prefix, $date, $count);
    }
}
