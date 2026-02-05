<?php

namespace App\Http\Controllers\Medical;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\ClinicalAssessment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class MedicalRecordController extends Controller
{
    /**
     * Display a listing of medical records.
     */
    public function index(Request $request): \Inertia\Response
    {
        $query = MedicalRecord::with(['patient', 'doctor'])
            ->orderBy('visit_date', 'desc');

        // Apply filters
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('doctor_id')) {
            $query->where('doctor_id', $request->doctor_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('visit_date', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('visit_date', '<=', $request->date_to);
        }

        $records = $query->paginate(15);

        return Inertia::render('Medical/Records/Index', [
            'records' => $records,
            'filters' => $request->all(['patient_id', 'doctor_id', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new medical record.
     */
    public function create(Request $request): \Inertia\Response
    {
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')->get();
        
        $appointment = null;
        if ($request->has('appointment_id')) {
            $appointment = Appointment::with('patient')->find($request->appointment_id);
        }

        return Inertia::render('Medical/Records/Create', [
            'patients' => $patients,
            'doctors' => $doctors,
            'appointment' => $appointment,
        ]);
    }

    /**
     * Store a newly created medical record.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'visit_date' => 'required|date',
            'chief_complaint' => 'nullable|string',
            'present_illness' => 'nullable|string',
            'past_medical_history' => 'nullable|string',
            'family_history' => 'nullable|string',
            'physical_examination' => 'nullable|string',
            'diagnosis' => 'required|string',
            'treatment_plan' => 'nullable|string',
            'prescription' => 'nullable|string',
            'notes' => 'nullable|string',
            'vital_signs_bp' => 'nullable|string',
            'vital_signs_temp' => 'nullable|numeric',
            'vital_signs_pulse' => 'nullable|integer',
            'vital_signs_resp' => 'nullable|integer',
            'vital_signs_weight' => 'nullable|numeric',
            'vital_signs_height' => 'nullable|numeric',
            // Symptom Assessment Fields
            'symptom_duration' => 'nullable|string',
            'symptom_pattern' => 'nullable|string',
            'symptom_severity' => 'nullable|string',
            'symptom_location' => 'nullable|string',
            'symptom_quality' => 'nullable|string',
            'symptom_aggravating_factors' => 'nullable|string',
            'symptom_alleviating_factors' => 'nullable|string',
            // Behavioral Assessment Fields
            'behavioral_observations' => 'nullable|string',
            'patient_cooperation_level' => 'nullable|string',
            'narrative_coherence_notes' => 'nullable|string',
            // Consistency Assessment Fields
            'symptoms_consistent_with_history' => 'nullable|boolean',
            'symptoms_consistent_with_exam' => 'nullable|boolean',
            'consistency_notes' => 'nullable|string',
            // Secondary Gain Assessment
            'secondary_gain_indicators_present' => 'nullable|boolean',
            'secondary_gain_notes' => 'nullable|string',
            // Clinical Validation Fields
            'clinical_validation_status' => 'nullable|string',
            'validation_notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $record = MedicalRecord::create([
                'record_number' => MedicalRecord::generateRecordNumber(),
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'],
                'appointment_id' => $validated['appointment_id'] ?? null,
                'visit_date' => $validated['visit_date'],
                'chief_complaint' => $validated['chief_complaint'],
                'present_illness' => $validated['present_illness'],
                'past_medical_history' => $validated['past_medical_history'],
                'family_history' => $validated['family_history'],
                'physical_examination' => $validated['physical_examination'],
                'diagnosis' => $validated['diagnosis'],
                'treatment_plan' => $validated['treatment_plan'],
                'prescription' => $validated['prescription'],
                'notes' => $validated['notes'],
                'vital_signs_bp' => $validated['vital_signs_bp'],
                'vital_signs_temp' => $validated['vital_signs_temp'],
                'vital_signs_pulse' => $validated['vital_signs_pulse'],
                'vital_signs_resp' => $validated['vital_signs_resp'],
                'vital_signs_weight' => $validated['vital_signs_weight'],
                'vital_signs_height' => $validated['vital_signs_height'],
                'status' => 'draft',
                'created_by' => auth()->id(),
                // Symptom Assessment Fields
                'symptom_duration' => $validated['symptom_duration'] ?? null,
                'symptom_pattern' => $validated['symptom_pattern'] ?? null,
                'symptom_severity' => $validated['symptom_severity'] ?? null,
                'symptom_location' => $validated['symptom_location'] ?? null,
                'symptom_quality' => $validated['symptom_quality'] ?? null,
                'symptom_aggravating_factors' => $validated['symptom_aggravating_factors'] ?? null,
                'symptom_alleviating_factors' => $validated['symptom_alleviating_factors'] ?? null,
                // Behavioral Assessment Fields
                'behavioral_observations' => $validated['behavioral_observations'] ?? null,
                'patient_cooperation_level' => $validated['patient_cooperation_level'] ?? null,
                'narrative_coherence_notes' => $validated['narrative_coherence_notes'] ?? null,
                // Consistency Assessment Fields
                'symptoms_consistent_with_history' => $validated['symptoms_consistent_with_history'] ?? null,
                'symptoms_consistent_with_exam' => $validated['symptoms_consistent_with_exam'] ?? null,
                'consistency_notes' => $validated['consistency_notes'] ?? null,
                // Secondary Gain Assessment
                'secondary_gain_indicators_present' => $validated['secondary_gain_indicators_present'] ?? null,
                'secondary_gain_notes' => $validated['secondary_gain_notes'] ?? null,
                // Clinical Validation Fields
                'clinical_validation_status' => $validated['clinical_validation_status'] ?? null,
                'validation_notes' => $validated['validation_notes'] ?? null,
            ]);

            DB::commit();

            Log::info('Medical record created', [
                'record_id' => $record->id,
                'record_number' => $record->record_number,
                'patient_id' => $record->patient_id,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Medical record created successfully.',
                'data' => $record->load(['patient', 'doctor']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating medical record', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified medical record.
     */
    public function show(MedicalRecord $medicalRecord): \Inertia\Response
    {
        $medicalRecord->load(['patient', 'doctor', 'appointment', 'createdBy', 'updatedBy']);

        // Get related clinical assessments
        $assessments = ClinicalAssessment::where('medical_record_id', $medicalRecord->id)
            ->with('assessor')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get related records for the same patient
        $relatedRecords = MedicalRecord::where('patient_id', $medicalRecord->patient_id)
            ->where('id', '!=', $medicalRecord->id)
            ->with('doctor')
            ->orderBy('visit_date', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Medical/Records/Show', [
            'record' => $medicalRecord,
            'assessments' => $assessments,
            'relatedRecords' => $relatedRecords,
        ]);
    }

    /**
     * Show the form for editing the medical record.
     */
    public function edit(MedicalRecord $medicalRecord): \Inertia\Response
    {
        $medicalRecord->load(['patient', 'doctor', 'appointment']);

        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')->get();

        return Inertia::render('Medical/Records/Edit', [
            'record' => $medicalRecord,
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Update the specified medical record.
     */
    public function update(Request $request, MedicalRecord $medicalRecord): JsonResponse
    {
        if (!$medicalRecord->isEditable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit a finalized medical record.',
            ], 403);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'visit_date' => 'required|date',
            'chief_complaint' => 'nullable|string',
            'present_illness' => 'nullable|string',
            'past_medical_history' => 'nullable|string',
            'family_history' => 'nullable|string',
            'physical_examination' => 'nullable|string',
            'diagnosis' => 'required|string',
            'treatment_plan' => 'nullable|string',
            'prescription' => 'nullable|string',
            'notes' => 'nullable|string',
            'vital_signs_bp' => 'nullable|string',
            'vital_signs_temp' => 'nullable|numeric',
            'vital_signs_pulse' => 'nullable|integer',
            'vital_signs_resp' => 'nullable|integer',
            'vital_signs_weight' => 'nullable|numeric',
            'vital_signs_height' => 'nullable|numeric',
            // Symptom Assessment Fields
            'symptom_duration' => 'nullable|string',
            'symptom_pattern' => 'nullable|string',
            'symptom_severity' => 'nullable|string',
            'symptom_location' => 'nullable|string',
            'symptom_quality' => 'nullable|string',
            'symptom_aggravating_factors' => 'nullable|string',
            'symptom_alleviating_factors' => 'nullable|string',
            // Behavioral Assessment Fields
            'behavioral_observations' => 'nullable|string',
            'patient_cooperation_level' => 'nullable|string',
            'narrative_coherence_notes' => 'nullable|string',
            // Consistency Assessment Fields
            'symptoms_consistent_with_history' => 'nullable|boolean',
            'symptoms_consistent_with_exam' => 'nullable|boolean',
            'consistency_notes' => 'nullable|string',
            // Secondary Gain Assessment
            'secondary_gain_indicators_present' => 'nullable|boolean',
            'secondary_gain_notes' => 'nullable|string',
            // Clinical Validation Fields
            'clinical_validation_status' => 'nullable|string',
            'validation_notes' => 'nullable|string',
        ]);

        try {
            $medicalRecord->update([
                'patient_id' => $validated['patient_id'],
                'doctor_id' => $validated['doctor_id'],
                'appointment_id' => $validated['appointment_id'] ?? null,
                'visit_date' => $validated['visit_date'],
                'chief_complaint' => $validated['chief_complaint'],
                'present_illness' => $validated['present_illness'],
                'past_medical_history' => $validated['past_medical_history'],
                'family_history' => $validated['family_history'],
                'physical_examination' => $validated['physical_examination'],
                'diagnosis' => $validated['diagnosis'],
                'treatment_plan' => $validated['treatment_plan'],
                'prescription' => $validated['prescription'],
                'notes' => $validated['notes'],
                'vital_signs_bp' => $validated['vital_signs_bp'],
                'vital_signs_temp' => $validated['vital_signs_temp'],
                'vital_signs_pulse' => $validated['vital_signs_pulse'],
                'vital_signs_resp' => $validated['vital_signs_resp'],
                'vital_signs_weight' => $validated['vital_signs_weight'],
                'vital_signs_height' => $validated['vital_signs_height'],
                'updated_by' => auth()->id(),
                // Symptom Assessment Fields
                'symptom_duration' => $validated['symptom_duration'] ?? null,
                'symptom_pattern' => $validated['symptom_pattern'] ?? null,
                'symptom_severity' => $validated['symptom_severity'] ?? null,
                'symptom_location' => $validated['symptom_location'] ?? null,
                'symptom_quality' => $validated['symptom_quality'] ?? null,
                'symptom_aggravating_factors' => $validated['symptom_aggravating_factors'] ?? null,
                'symptom_alleviating_factors' => $validated['symptom_alleviating_factors'] ?? null,
                // Behavioral Assessment Fields
                'behavioral_observations' => $validated['behavioral_observations'] ?? null,
                'patient_cooperation_level' => $validated['patient_cooperation_level'] ?? null,
                'narrative_coherence_notes' => $validated['narrative_coherence_notes'] ?? null,
                // Consistency Assessment Fields
                'symptoms_consistent_with_history' => $validated['symptoms_consistent_with_history'] ?? null,
                'symptoms_consistent_with_exam' => $validated['symptoms_consistent_with_exam'] ?? null,
                'consistency_notes' => $validated['consistency_notes'] ?? null,
                // Secondary Gain Assessment
                'secondary_gain_indicators_present' => $validated['secondary_gain_indicators_present'] ?? null,
                'secondary_gain_notes' => $validated['secondary_gain_notes'] ?? null,
                // Clinical Validation Fields
                'clinical_validation_status' => $validated['clinical_validation_status'] ?? null,
                'validation_notes' => $validated['validation_notes'] ?? null,
            ]);

            Log::info('Medical record updated', [
                'record_id' => $medicalRecord->id,
                'record_number' => $medicalRecord->record_number,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Medical record updated successfully.',
                'data' => $medicalRecord->fresh()->load(['patient', 'doctor']),
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating medical record', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update medical record.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Finalize the medical record.
     */
    public function finalize(MedicalRecord $medicalRecord): JsonResponse
    {
        try {
            if ($medicalRecord->finalize()) {
                $medicalRecord->update([
                    'validated_by' => auth()->id(),
                    'validated_at' => now(),
                ]);

                Log::info('Medical record finalized', [
                    'record_id' => $medicalRecord->id,
                    'record_number' => $medicalRecord->record_number,
                    'validated_by' => auth()->id(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Medical record finalized successfully.',
                    'data' => $medicalRecord,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to finalize medical record.',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error finalizing medical record', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error finalizing medical record.',
            ], 500);
        }
    }

    /**
     * Get patient medical history for review.
     */
    public function getPatientHistory(int $patientId): JsonResponse
    {
        $records = MedicalRecord::where('patient_id', $patientId)
            ->with(['doctor', 'createdBy'])
            ->orderBy('visit_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    /**
     * Run diagnostic assessment on a patient's records.
     */
    public function runDiagnostic(int $patientId): JsonResponse
    {
        $diagnosticService = new \App\Services\PatientAssessmentDiagnostic();
        $results = $diagnosticService->runDiagnostic($patientId);

        return response()->json([
            'success' => true,
            'data' => $results,
        ]);
    }
}
