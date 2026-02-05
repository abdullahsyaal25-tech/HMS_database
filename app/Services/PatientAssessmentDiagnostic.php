<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\MedicalRecord;
use App\Models\Appointment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Diagnostic Service for Patient Assessment Validation
 * Identifies inconsistencies and gaps in clinical assessment data
 */
class PatientAssessmentDiagnostic
{
    /**
     * Run comprehensive diagnostic assessment
     */
    public function runDiagnostic(int $patientId = null): array
    {
        $results = [
            'diagnostic_timestamp' => now()->toISOString(),
            'patient_id' => $patientId,
            'findings' => [],
            'red_flags' => [],
            'consistency_issues' => [],
            'recommendations' => [],
        ];

        // Check 1: Verify MedicalRecord data consistency
        $results['findings']['medical_record_analysis'] = $this->analyzeMedicalRecords($patientId);

        // Check 2: Validate appointment-symptom consistency
        $results['findings']['appointment_symptom_consistency'] = $this->checkAppointmentSymptomConsistency($patientId);

        // Check 3: Identify potential fabrication indicators
        $results['findings']['fabrication_indicators'] = $this->identifyFabricationIndicators($patientId);

        // Check 4: Validate vital signs against complaints
        $results['findings']['vital_sign_validation'] = $this->validateVitalSigns($patientId);

        // Check 5: Cross-reference lab results with clinical notes
        $results['findings']['lab_clinical_correlation'] = $this->correlateLabResults($patientId);

        // Generate red flags
        $results['red_flags'] = $this->generateRedFlags($results['findings']);

        // Generate recommendations
        $results['recommendations'] = $this->generateRecommendations($results['findings'], $results['red_flags']);

        return $results;
    }

    /**
     * Analyze medical records for inconsistencies
     */
    private function analyzeMedicalRecords($patientId): array
    {
        $query = MedicalRecord::with(['patient', 'doctor']);

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        $records = $query->orderBy('visit_date', 'desc')->get();

        $analysis = [
            'total_records' => $records->count(),
            'records_with_missing_fields' => [],
            'symptom_pattern_analysis' => [],
            'narrative_coherence_score' => null,
        ];

        foreach ($records as $record) {
            // Check for missing critical fields
            $missingFields = [];
            if (empty($record->chief_complaint)) {
                $missingFields[] = 'chief_complaint';
            }
            if (empty($record->diagnosis)) {
                $missingFields[] = 'diagnosis';
            }
            if (empty($record->present_illness)) {
                $missingFields[] = 'present_illness';
            }

            if (!empty($missingFields)) {
                $analysis['records_with_missing_fields'][] = [
                    'record_id' => $record->id,
                    'record_number' => $record->record_number,
                    'visit_date' => $record->visit_date,
                    'missing_fields' => $missingFields,
                ];
            }

            // Analyze symptom patterns across visits
            $analysis['symptom_pattern_analysis'] = $this->analyzeSymptomPatterns($records);
        }

        // Calculate narrative coherence score (simplified algorithm)
        $analysis['narrative_coherence_score'] = $this->calculateNarrativeCoherence($records);

        return $analysis;
    }

    /**
     * Check consistency between appointments and symptoms
     */
    private function checkAppointmentSymptomConsistency($patientId): array
    {
        $appointments = Appointment::where('patient_id', $patientId)
            ->where('status', 'completed')
            ->with('patient')
            ->orderBy('appointment_date', 'desc')
            ->get();

        $consistencyIssues = [];

        foreach ($appointments as $appointment) {
            $medicalRecord = MedicalRecord::where('appointment_id', $appointment->id)->first();

            if (!$medicalRecord) {
                $consistencyIssues[] = [
                    'appointment_id' => $appointment->id,
                    'appointment_date' => $appointment->appointment_date,
                    'issue' => 'No medical record found for completed appointment',
                    'severity' => 'high',
                ];
                continue;
            }

            // Check if complaint matches appointment reason
            if ($appointment->reason && $medicalRecord->chief_complaint) {
                $similarity = $this->calculateTextSimilarity(
                    strtolower($appointment->reason),
                    strtolower($medicalRecord->chief_complaint)
                );

                if ($similarity < 0.3) {
                    $consistencyIssues[] = [
                        'appointment_id' => $appointment->id,
                        'appointment_date' => $appointment->appointment_date,
                        'issue' => 'Low similarity between appointment reason and chief complaint',
                        'severity' => 'medium',
                        'similarity_score' => $similarity,
                    ];
                }
            }
        }

        return [
            'total_completed_appointments' => $appointments->count(),
            'consistency_issues_count' => count($consistencyIssues),
            'consistency_issues' => $consistencyIssues,
        ];
    }

    /**
     * Identify potential symptom fabrication indicators
     */
    private function identifyFabricationIndicators($patientId): array
    {
        $indicators = [];
        $records = MedicalRecord::where('patient_id', $patientId)
            ->orderBy('visit_date', 'desc')
            ->get();

        // Indicator 1: Rapid symptom resolution followed by recurrence
        $this->checkRapidSymptomRecurrence($records, $indicators);

        // Indicator 2: Inconsistent symptom descriptions across visits
        $this->checkInconsistentSymptomDescriptions($records, $indicators);

        // Indicator 3: Vague or overly dramatic language
        $this->checkLanguagePatterns($records, $indicators);

        // Indicator 4: Symptoms that don't match clinical findings
        $this->checkSymptomClinicalMismatch($records, $indicators);

        return [
            'total_indicators_found' => count($indicators),
            'indicators' => $indicators,
            'fabrication_risk_level' => $this->calculateFabricationRiskLevel($indicators),
        ];
    }

    /**
     * Validate vital signs against reported symptoms
     */
    private function validateVitalSigns($patientId): array
    {
        $records = MedicalRecord::where('patient_id', $patientId)
            ->whereNotNull('vital_signs_bp')
            ->orderBy('visit_date', 'desc')
            ->get();

        $validationResults = [];

        foreach ($records as $record) {
            $issues = [];

            // Check for inconsistent vital signs with complaints
            if ($record->chief_complaint && str_contains(strtolower($record->chief_complaint), 'pain')) {
                if ($record->vital_signs_pulse && $record->vital_signs_pulse < 60) {
                    $issues[] = 'Patient reports pain but has bradycardia (unusual but possible)';
                }
                if ($record->vital_signs_pulse && $record->vital_signs_pulse > 100) {
                    // This is consistent with pain - no issue
                }
            }

            // Check for impossible vital sign combinations
            if ($record->vital_signs_temp && $record->vital_signs_temp > 42) {
                $issues[] = 'Impossible temperature reading (>42°C)';
            }

            if ($record->vital_signs_pulse && ($record->vital_signs_pulse < 30 || $record->vital_signs_pulse > 250)) {
                $issues[] = 'Impossible pulse rate';
            }

            if (!empty($issues)) {
                $validationResults[] = [
                    'record_id' => $record->id,
                    'record_number' => $record->record_number,
                    'visit_date' => $record->visit_date,
                    'issues' => $issues,
                ];
            }
        }

        return [
            'records_with_vital_signs' => $records->count(),
            'validation_issues_count' => count($validationResults),
            'validation_results' => $validationResults,
        ];
    }

    /**
     * Cross-reference lab results with clinical notes
     */
    private function correlateLabResults($patientId): array
    {
        $correlations = [];

        // Get all lab results for patient
        $labResults = \App\Models\LabTestResult::where('patient_id', $patientId)
            ->with('test')
            ->orderBy('performed_at', 'desc')
            ->get();

        foreach ($labResults as $labResult) {
            // Find related medical records
            $relatedRecords = MedicalRecord::where('patient_id', $patientId)
                ->whereDate('visit_date', '<=', $labResult->performed_at->toDateString())
                ->orderBy('visit_date', 'desc')
                ->limit(3)
                ->get();

            foreach ($relatedRecords as $record) {
                // Check if diagnosis mentions the lab test results
                $testName = strtolower($labResult->test->name ?? '');
                $diagnosis = strtolower($record->diagnosis ?? '');
                $notes = strtolower($record->notes ?? '');

                if (str_contains($diagnosis, $testName) || str_contains($notes, $testName)) {
                    $correlations[] = [
                        'lab_test_id' => $labResult->id,
                        'lab_test_name' => $labResult->test->name ?? 'Unknown',
                        'lab_result_date' => $labResult->performed_at,
                        'medical_record_id' => $record->id,
                        'medical_record_date' => $record->visit_date,
                        'correlation_type' => 'documented',
                    ];
                }
            }
        }

        return [
            'total_lab_tests' => $labResults->count(),
            'documented_correlations' => count($correlations),
            'correlations' => $correlations,
        ];
    }

    // Helper methods

    private function analyzeSymptomPatterns($records): array
    {
        $patterns = [];

        // Group symptoms by visit and look for patterns
        $symptomsByVisit = $records->groupBy(function ($record) {
            return $record->visit_date->format('Y-m');
        });

        foreach ($symptomsByVisit as $month => $monthRecords) {
            if ($monthRecords->count() > 3) {
                $patterns[] = [
                    'month' => $month,
                    'visit_count' => $monthRecords->count(),
                    'pattern' => 'High frequency of visits in this period',
                ];
            }
        }

        return $patterns;
    }

    private function calculateNarrativeCoherence($records): float
    {
        if ($records->isEmpty()) {
            return 1.0; // Default to high coherence if no records
        }

        $totalScore = 0;
        $recordCount = 0;

        foreach ($records as $record) {
            $score = 0;
            $maxScore = 5;

            // Check for completeness
            if (!empty($record->chief_complaint)) $score++;
            if (!empty($record->present_illness)) $score++;
            if (!empty($record->diagnosis)) $score++;
            if (!empty($record->treatment_plan)) $score++;
            if (!empty($record->physical_examination)) $score++;

            $totalScore += ($score / $maxScore);
            $recordCount++;
        }

        return $recordCount > 0 ? round($totalScore / $recordCount, 2) : 1.0;
    }

    private function calculateTextSimilarity($text1, $text2): float
    {
        $words1 = explode(' ', $text1);
        $words2 = explode(' ', $text2);

        $commonWords = array_intersect($words1, $words2);
        $totalWords = count($words1) + count($words2);

        if ($totalWords === 0) {
            return 1.0;
        }

        return (2 * count($commonWords)) / $totalWords;
    }

    private function checkRapidSymptomRecurrence($records, &$indicators): void
    {
        for ($i = 0; $i < $records->count() - 1; $i++) {
            $currentRecord = $records[$i];
            $nextRecord = $records[$i + 1];

            $daysDiff = $currentRecord->visit_date->diffInDays($nextRecord->visit_date);

            if ($daysDiff < 7) {
                // Check if same symptoms resolved quickly
                if ($currentRecord->present_illness && $nextRecord->present_illness) {
                    $similarity = $this->calculateTextSimilarity(
                        strtolower($currentRecord->present_illness),
                        strtolower($nextRecord->present_illness)
                    );

                    if ($similarity > 0.7) {
                        $indicators[] = [
                            'type' => 'rapid_recurrence',
                            'description' => 'Similar symptoms recurring within 7 days',
                            'dates' => [
                                $currentRecord->visit_date->format('Y-m-d'),
                                $nextRecord->visit_date->format('Y-m-d'),
                            ],
                        ];
                    }
                }
            }
        }
    }

    private function checkInconsistentSymptomDescriptions($records, &$indicators): void
    {
        // This would analyze symptom descriptions for inconsistencies
        // Simplified implementation for demonstration
    }

    private function checkLanguagePatterns($records, &$indicators): void
    {
        $exaggerationWords = ['severe', 'excruciating', 'unbearable', 'worst ever'];

        foreach ($records as $record) {
            $text = strtolower($record->present_illness . ' ' . $record->chief_complaint);

            foreach ($exaggerationWords as $word) {
                if (str_contains($text, $word)) {
                    $indicators[] = [
                        'type' => 'exaggerated_language',
                        'description' => "Use of potentially exaggerated language: '{$word}'",
                        'record_id' => $record->id,
                        'record_date' => $record->visit_date,
                    ];
                }
            }
        }
    }

    private function checkSymptomClinicalMismatch($records, &$indicators): void
    {
        foreach ($records as $record) {
            // Check if diagnosis is missing but complaint exists
            if (!empty($record->chief_complaint) && empty($record->diagnosis)) {
                $indicators[] = [
                    'type' => 'unresolved_complaint',
                    'description' => 'Chief complaint recorded without corresponding diagnosis',
                    'record_id' => $record->id,
                    'record_date' => $record->visit_date,
                ];
            }
        }
    }

    private function calculateFabricationRiskLevel($indicators): string
    {
        $count = count($indicators);

        if ($count === 0) {
            return 'low';
        } elseif ($count <= 2) {
            return 'low';
        } elseif ($count <= 5) {
            return 'medium';
        } elseif ($count <= 8) {
            return 'high';
        } else {
            return 'critical';
        }
    }

    private function generateRedFlags($findings): array
    {
        $redFlags = [];

        // High fabrication risk
        if ($findings['fabrication_indicators']['fabrication_risk_level'] ?? '' === 'high' ||
            $findings['fabrication_indicators']['fabrication_risk_level'] ?? '' === 'critical') {
            $redFlags[] = [
                'type' => 'fabrication_risk',
                'description' => 'Multiple indicators suggest potential symptom fabrication',
                'risk_level' => $findings['fabrication_indicators']['fabrication_risk_level'],
            ];
        }

        // Missing medical records for appointments
        if (($findings['appointment_symptom_consistency']['consistency_issues_count'] ?? 0) > 2) {
            $redFlags[] = [
                'type' => 'documentation_gaps',
                'description' => 'Multiple appointments lack corresponding medical records',
            ];
        }

        // Low narrative coherence
        if (($findings['medical_record_analysis']['narrative_coherence_score'] ?? 1.0) < 0.5) {
            $redFlags[] = [
                'type' => 'narrative_coherence',
                'description' => 'Low narrative coherence across medical records',
                'score' => $findings['medical_record_analysis']['narrative_coherence_score'],
            ];
        }

        // Vital sign validation issues
        if (($findings['vital_sign_validation']['validation_issues_count'] ?? 0) > 0) {
            $redFlags[] = [
                'type' => 'vital_sign_inconsistencies',
                'description' => 'Vital signs found that are inconsistent with reported symptoms',
            ];
        }

        return $redFlags;
    }

    private function generateRecommendations($findings, $redFlags): array
    {
        $recommendations = [];

        if (!empty($redFlags)) {
            $recommendations[] = [
                'priority' => 'high',
                'action' => 'Conduct thorough clinical interview to verify symptom consistency',
            ];
            $recommendations[] = [
                'priority' => 'high',
                'action' => 'Review all previous medical records for pattern analysis',
            ];
            $recommendations[] = [
                'priority' => 'medium',
                'action' => 'Consider collateral history from family/previous providers',
            ];
        }

        if (($findings['medical_record_analysis']['narrative_coherence_score'] ?? 1.0) < 0.7) {
            $recommendations[] = [
                'priority' => 'medium',
                'action' => 'Request more detailed documentation from treating physicians',
            ];
        }

        if (($findings['lab_clinical_correlation']['documented_correlations'] ?? 0) <
            ($findings['lab_clinical_correlation']['total_lab_tests'] ?? 0) * 0.5) {
            $recommendations[] = [
                'priority' => 'low',
                'action' => 'Improve documentation of lab result interpretation',
            ];
        }

        $recommendations[] = [
            'priority' => 'general',
            'action' => 'Schedule follow-up assessment in 2-4 weeks to monitor symptom evolution',
        ];

        return $recommendations;
    }
}
