<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model for the appointment_services pivot table.
 * Represents a department service attached to an appointment.
 */
class AppointmentService extends Model
{
    use HasFactory;

    protected $table = 'appointment_services';

    protected $fillable = [
        'appointment_id',
        'department_service_id',
        'custom_cost',
        'discount_percentage',
        'final_cost',
    ];

    protected $casts = [
        'custom_cost' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'final_cost' => 'decimal:2',
    ];

    /**
     * Get the appointment that owns this service.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the department service.
     */
    public function departmentService(): BelongsTo
    {
        return $this->belongsTo(DepartmentService::class);
    }
}
