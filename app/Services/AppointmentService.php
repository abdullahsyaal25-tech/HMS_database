<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    /**
     * Get all appointments with related data
     */
    public function getAllAppointments($perPage = 10)
    {
        return Appointment::with(['patient', 'doctor', 'department'])
            ->latest()
            ->paginate($perPage)
            ->through(function ($appointment) {
                return $this->transformAppointment($appointment);
            });
    }

    /**
     * Get appointment by ID with related data
     */
    public function getAppointmentById($id)
    {
        $appointment = Appointment::with(['patient', 'doctor', 'department'])->findOrFail($id);
        return $this->transformAppointment($appointment);
    }

    /**
     * Get all related data needed for appointment forms
     * Optimized to load only necessary fields for performance
     */
    public function getAppointmentFormData()
    {
        return [
            'patients' => Patient::select('id', 'first_name', 'father_name', 'patient_id')
                ->orderBy('first_name')
                ->get()
                ->map(function($patient) {
                    return [
                        'id' => $patient->id,
                        'patient_id' => $patient->patient_id,
                        'full_name' => trim($patient->first_name),
                    ];
                }),
            'doctors' => Doctor::select('id', 'doctor_id', 'full_name', 'specialization', 'fees')
                ->where('status', 'active')
                ->orderBy('full_name')
                ->get()
                ->map(function($doctor) {
                    return [
                        'id' => $doctor->id,
                        'doctor_id' => $doctor->doctor_id,
                        'full_name' => $doctor->full_name,
                        'specialization' => $doctor->specialization,
                        'fees' => $doctor->fees,
                    ];
                }),
            'departments' => Department::select('id', 'name')
                ->orderBy('name')
                ->get(),
        ];
    }

    /**
     * Create a new appointment
     */
    public function createAppointment(array $data)
    {
        DB::beginTransaction();

        try {
            // Generate appointment ID using database auto-increment for thread safety
            $nextId = DB::selectOne("
                SELECT AUTO_INCREMENT as next_id
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'appointments'
            ")->next_id ?? 1;

            $appointment = Appointment::create([
                'appointment_id' => 'APPT' . date('Y') . str_pad($nextId, 5, '0', STR_PAD_LEFT),
                'patient_id' => $data['patient_id'],
                'doctor_id' => $data['doctor_id'],
                'department_id' => $data['department_id'],
                'appointment_date' => $data['appointment_date'],
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'fee' => $data['fee'],
                'discount' => $data['discount'] ?? 0,
            ]);

            DB::commit();
            
            return $appointment;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing appointment
     */
    public function updateAppointment($id, array $data)
    {
        $appointment = Appointment::findOrFail($id);
        
        $updateData = [
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'],
            'appointment_date' => $data['appointment_date'],
            'status' => $data['status'],
            'reason' => $data['reason'] ?? null,
        ];

        // Add fee and discount if provided
        if (isset($data['fee'])) {
            $updateData['fee'] = $data['fee'];
        }
        if (isset($data['discount'])) {
            $updateData['discount'] = $data['discount'];
        }

        $appointment->update($updateData);

        return $appointment;
    }

    /**
     * Delete an appointment
     */
    public function deleteAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        return $appointment->delete();
    }

    /**
     * Transform appointment data for frontend consumption
     */
    private function transformAppointment($appointment)
    {
        $appointmentArray = $appointment->toArray();
        
        // Extract date and time from appointment_date
        $date = $appointment->appointment_date;
        $appointmentArray['appointment_date'] = $date->format('Y-m-d');
        $appointmentArray['appointment_time'] = $date->format('H:i');
        
        // Transform patient data
        if ($appointment->patient) {
            $appointmentArray['patient'] = [
                'id' => $appointment->patient->id,
                'patient_id' => $appointment->patient->patient_id,
                'full_name' => trim($appointment->patient->first_name . ' '),
            ];
        }
        
        // Transform doctor data
        if ($appointment->doctor) {
            $appointmentArray['doctor'] = [
                'id' => $appointment->doctor->id,
                'doctor_id' => $appointment->doctor->doctor_id,
                'full_name' => $appointment->doctor->full_name,
                'specialization' => $appointment->doctor->specialization,
            ];
        }
        
        return $appointmentArray;
    }

    /**
     * Cancel an appointment
     */
    public function cancelAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->status = 'cancelled';
        return $appointment->save();
    }
}