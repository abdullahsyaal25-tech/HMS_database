<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Sale;
use App\Models\LabTestResult;

class Patient extends Model
{
    protected $fillable = [
        'patient_id',
        'first_name',
        'father_name',
        'gender',
        'phone',
        'user_id',
        'date_of_birth',
        'blood_group',
        'blood_type',
        'allergies',
        'emergency_contact_name',
        'emergency_contact_phone',
        'medical_history',
        'address',
    ];

    protected $casts = [
        'address' => 'array',
        'phone' => 'encrypted',
        'metadata' => 'array',
        'date_of_birth' => 'date',
        // Encrypt sensitive medical information
        'allergies' => 'encrypted',
        'medical_history' => 'encrypted',
        'emergency_contact_phone' => 'encrypted',
    ];

    /**
     * Get full name of the patient.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Get age of the patient.
     */
    public function getAgeAttribute(): ?int
    {
        return $this->date_of_birth?->age;
    }

    /**
     * Scope to search patients by name.
     */
    public function scopeSearchByName($query, string $name)
    {
        return $query->where(function ($q) use ($name) {
            $q->where('first_name', 'like', "%{$name}%")
              ->orWhere('last_name', 'like', "%{$name}%");
        });
    }

    /**
     * Get medical records for this patient.
     */
    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function labTestResults()
    {
        return $this->hasMany(LabTestResult::class);
    }
}
