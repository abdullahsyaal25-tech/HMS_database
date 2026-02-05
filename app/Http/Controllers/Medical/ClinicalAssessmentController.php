<?php

namespace App\Http\Controllers\Medical;

use App\Http\Controllers\Controller;
use App\Models\ClinicalAssessment;
use App\Models\AssessmentConsistencyLog;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ClinicalAssessmentController extends Controller
{
    /**
     * Display a listing of clinical assessments.
     */
    public function index(Request $request): \Inertia\Response
    {
        $query = ClinicalAssessment::with(['patient', 'assessor', 'medicalRecord'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->has('assessment_type')) {
            $query->byType($request->assessment_type);
        }

        if ($request->has('fabrication_suspicion_level')) {
            $query->where('fabrication_suspicion_level', $request->fabrication_suspicion_level);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $assessments = $query->paginate(15);

        return Inertia::render('Medical/Assessments/Index', [
            'assessments' => $assessments,
            'filters' => $request->all(['patient_id', 'assessment_type', 'fabrication_suspicion_level', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new clinical assessment.
     */
    public function create(Request $request): \Inertia\Response
    {
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $medicalRecords = MedicalRecord::with(['patient', 'doctor'])->get();
        
        $preselectedRecord = null;
        if ($request->has('medical_record_id')) {
            $preselectedRecord = MedicalRecord::with(['patient', 'doctor'])
                ->find($request->medical_record_id);
        }

        return Inertia::render('Medical/Assessments/Create', [
            'patients' => $patients,
            'medicalRecords' => $medicalRecords,
            'preselectedRecord' => $preselectedRecord,
        ]);
    }

    /**
     * Store a newly created clinical assessment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'medical_record_id' => 'required|exists:medical_records,id',
            'patient_id' => 'required|exists:patients,id',
            'assessment_type' => 'required|string',
            // Symptom Validity Assessment
            'symptom_validity_findings' => 'nullable|string',
            'symptom_validity_score' => 'nullable|integer|min:0|max:100',
            'symptom_validity_rating' => 'nullable|string',
            // Behavioral Observations
            'general_appearance' => 'nullable|string',
            'interaction_style' => 'nullable|string',
            'affect_and_mood' => 'nullable|string',
            'cognitive_presentation' => 'nullable|string',
            'pain_behavior_observations' => 'nullable|string',
            // Consistency Analysis
            'historical_consistency_analysis' => 'nullable|string',
            'cross_visit_pattern_analysis' => 'nullable|string',
            'symptom_exaggeration_indicators' => 'nullable|string',
            'symptom_minimization_indicators' => 'nullable|string',
            // Secondary Gain Factors
            'financial_incentives_present' => 'nullable|boolean',
            'medication_seeking_present' => 'nullable|boolean',
            'responsibility_avoidance_present' => 'nullable|boolean',
            'attention_seeking_present' => 'nullable|boolean',
            'legal_compensation_present' => 'nullable|boolean',
            'secondary_gain_analysis' => 'nullable|string',
            // Collateral Information
            'collateral_history_notes' => 'nullable|string',
            'prior_medical_records_review' => 'nullable|string',
            'family_report_notes' => 'nullable|string',
            // Diagnostic Impressions
            'primary_diagnosis_impression' => 'nullable|string',
            'differential_diagnosis' => 'nullable|string',
            'assessment_limitations' => 'nullable|string',
            // Recommendations
            'further_evaluation_recommended' => 'nullable|string',
            'treatment_recommendations' => 'nullable|string',
            'follow_up_plan' => 'nullable|string',
            // Overall Assessment
            'overall_reliability_rating' => 'nullable|string',
            'fabrication_suspicion_level' => 'nullable|string',
            'assessment_summary' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $assessment = ClinicalAssessment::create([
                'medical_record_id' => $validated['medical_record_id'],
                'patient_id' => $validated['patient_id'],
                'assessor_id' => auth()->id(),
                'assessment_type' => $validated['assessment_type'],
                // Symptom Validity Assessment
                'symptom_validity_findings' => $validated['symptom_validity_findings'] ?? null,
                'symptom_validity_score' => $validated['symptom_validity_score'] ?? null,
                'symptom_validity_rating' => $validated['symptom_validity_rating'] ?? null,
                // Behavioral Observations
                'general_appearance' => $validated['general_appearance'] ?? null,
                'interaction_style' => $validated['interaction_style'] ?? null,
                'affect_and_mood' => $validated['affect_and_mood'] ?? null,
                'cognitive_presentation' => $validated['cognitive_presentation'] ?? null,
                'pain_behavior_observations' => $validated['pain_behavior_observations'] ?? null,
                // Consistency Analysis
                'historical_consistency_analysis' => $validated['historical_consistency_analysis'] ?? null,
                'cross_visit_pattern_analysis' => $validated['cross_visit_pattern_analysis'] ?? null,
                'symptom_exaggeration_indicators' => $validated['symptom_exaggeration_indicators'] ?? null,
                'symptom_minimization_indicators' => $validated['symptom_minimization_indicators'] ?? null,
                // Secondary Gain Factors
                'financial_incentives_present' => $validated['financial_incentives_present'] ?? null,
                'medication_seeking_present' => $validated['medication_seeking_present'] ?? null,
                'responsibility_avoidance_present' => $validated['responsibility_avoidance_present'] ?? null,
                'attention_seeking_present' => $validated['attention_seeking_present'] ?? null,
                'legal_compensation_present' => $validated['legal_compensation_present'] ?? null,
                'secondary_gain_analysis' => $validated['secondary_gain_analysis'] ?? null,
                // Collateral Information
                'collateral_history_notes' => $validated['collateral_history_notes'] ?? null,
                'prior_medical_records_review' => $validated['prior_medical_records_review'] ?? null,
                'family_report_notes' => $validated['family_report_notes'] ?? null,
                // Diagnostic Impressions
                'primary_diagnosis_impression' => $validated['primary_diagnosis_impression'] ?? null,
                'differential_diagnosis' => $validated['differential_diagnosis'] ?? null,
                'assessment_limitations' => $validated['assessment_limitations'] ?? null,
                // Recommendations
                'further_evaluation_recommended' => $validated['further_evaluation_recommended'] ?? null,
                'treatment_recommendations' => $validated['treatment_recommendations'] ?? null,
                'follow_up_plan' => $validated['follow_up_plan'] ?? null,
                // Overall Assessment
                'overall_reliability_rating' => $validated['overall_reliability_rating'] ?? null,
                'fabrication_suspicion_level' => $validated['fabrication_suspicion_level'] ?? null,
                'assessment_summary' => $validated['assessment_summary'] ?? null,
                'status' => 'draft',
            ]);

            // Log consistency check
            $this->logConsistencyCheck($assessment, 'initial_assessment', null, $assessment->assessment_summary);

            DB::commit();

            Log::info('Clinical assessment created', [
                'assessment_id' => $assessment->id,
                'assessment_number' => $assessment->assessment_number,
                'patient_id' => $assessment->patient_id,
                'assessor_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clinical assessment created successfully.',
                'data' => $assessment->load(['patient', 'assessor', 'medicalRecord']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error creating clinical assessment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create clinical assessment.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified clinical assessment.
     */
    public function show(ClinicalAssessment $clinicalAssessment): \Inertia\Response
    {
        $clinicalAssessment->load(['patient', 'assessor', 'medicalRecord', 'consistencyLogs']);

        return Inertia::render('Medical/Assessments/Show', [
            'assessment' => $clinicalAssessment,
        ]);
    }

    /**
     * Show the form for editing the clinical assessment.
     */
    public function edit(ClinicalAssessment $clinicalAssessment): \Inertia\Response
    {
        $clinicalAssessment->load(['patient', 'assessor', 'medicalRecord']);
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $medicalRecords = MedicalRecord::with(['patient', 'doctor'])->get();

        return Inertia::render('Medical/Assessments/Edit', [
            'assessment' => $clinicalAssessment,
            'patients' => $patients,
            'medicalRecords' => $medicalRecords,
        ]);
    }

    /**
     * Update the specified clinical assessment.
     */
    public function update(Request $request, ClinicalAssessment $clinicalAssessment): JsonResponse
    {
        if ($clinicalAssessment->isFinalized()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit a finalized assessment.',
            ], 403);
        }

        $validated = $request->validate([
            'medical_record_id' => 'required|exists:medical_records,id',
            'patient_id' => 'required|exists:patients,id',
            'assessment_type' => 'required|string',
            'symptom_validity_findings' => 'nullable|string',
            'symptom_validity_score' => 'nullable|integer|min:0|max:100',
            'symptom_validity_rating' => 'nullable|string',
            'general_appearance' => 'nullable|string',
            'interaction_style' => 'nullable|string',
            'affect_and_mood' => 'nullable|string',
            'cognitive_presentation' => 'nullable|string',
            'pain_behavior_observations' => 'nullable|string',
            'historical_consistency_analysis' => 'nullable|string',
            'cross_visit_pattern_analysis' => 'nullable|string',
            'symptom_exaggeration_indicators' => 'nullable|string',
            'symptom_minimization_indicators' => 'nullable|string',
            'financial_incentives_present' => 'nullable|boolean',
            'medication_seeking_present' => 'nullable|boolean',
            'responsibility_avoidance_present' => 'nullable|boolean',
            'attention_seeking_present' => 'nullable|boolean',
            'legal_compensation_present' => 'nullable|boolean',
            'secondary_gain_analysis' => 'nullable|string',
            'collateral_history_notes' => 'nullable|string',
            'prior_medical_records_review' => 'nullable|string',
            'family_report_notes' => 'nullable|string',
            'primary_diagnosis_impression' => 'nullable|string',
            'differential_diagnosis' => 'nullable|string',
            'assessment_limitations' => 'nullable|string',
            'further_evaluation_recommended' => 'nullable|string',
            'treatment_recommendations' => 'nullable|string',
            'follow_up_plan' => 'nullable|string',
            'overall_reliability_rating' => 'nullable|string',
            'fabrication_suspicion_level' => 'nullable|string',
            'assessment_summary' => 'nullable|string',
        ]);

        try {
            $previousSummary = $clinicalAssessment->assessment_summary;
            
            $clinicalAssessment->update($validated);

            // Log changes if summary changed
            if ($previousSummary !== $validated['assessment_summary']) {
                $this->logConsistencyCheck(
                    $clinicalAssessment,
                    'summary_update',
                    $previousSummary,
                    $validated['assessment_summary']
                );
            }

            Log::info('Clinical assessment updated', [
                'assessment_id' => $clinicalAssessment->id,
                'assessment_number' => $clinicalAssessment->assessment_number,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clinical assessment updated successfully.',
                'data' => $clinicalAssessment->fresh()->load(['patient', 'assessor', 'medicalRecord']),
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating clinical assessment', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update clinical assessment.',
            ], 500);
        }
    }

    /**
     * Finalize the clinical assessment.
     */
    public function finalize(ClinicalAssessment $clinicalAssessment): JsonResponse
    {
        try {
            if ($clinicalAssessment->finalize()) {
                Log::info('Clinical assessment finalized', [
                    'assessment_id' => $clinicalAssessment->id,
                    'assessment_number' => $clinicalAssessment->assessment_number,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Clinical assessment finalized successfully.',
                    'data' => $clinicalAssessment,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to finalize assessment.',
            ], 400);

        } catch (\Exception $e) {
            Log::error('Error finalizing clinical assessment', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error finalizing assessment.',
            ], 500);
        }
    }

    /**
     * Log a consistency check.
     */
    private function logConsistencyCheck(ClinicalAssessment $assessment, string $type, $previousValue, $currentValue): void
    {
        AssessmentConsistencyLog::create([
            'clinical_assessment_id' => $assessment->id,
            'patient_id' => $assessment->patient_id,
            'consistency_check_type' => $type,
            'previous_value' => $previousValue,
            'current_value' => $currentValue,
            'logged_by' => auth()->id(),
        ]);
    }
}
