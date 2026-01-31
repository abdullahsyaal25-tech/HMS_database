<?php

namespace App\Notifications;

use App\Models\LabTestResult;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class LabTestResultsReadyNotification
{
    /**
     * Create a notification for lab test results ready.
     */
    public static function notify(LabTestResult $labTestResult): void
    {
        try {
            // Notify the patient
            if ($labTestResult->patient && $labTestResult->patient->user_id) {
                Notification::create([
                    'user_id' => $labTestResult->patient->user_id,
                    'type' => 'lab_test_results_ready',
                    'title' => 'Lab Test Results Ready',
                    'message' => "Your lab test results for '{$labTestResult->test->name}' are now available.",
                    'data' => [
                        'lab_test_result_id' => $labTestResult->id,
                        'result_id' => $labTestResult->result_id,
                        'test_name' => $labTestResult->test->name,
                        'status' => $labTestResult->status,
                    ],
                    'priority' => $labTestResult->abnormal_flags ? 'high' : 'normal',
                ]);
            }

            // Notify the requesting doctor
            if ($labTestResult->request && $labTestResult->request->doctor && $labTestResult->request->doctor->user_id) {
                Notification::create([
                    'user_id' => $labTestResult->request->doctor->user_id,
                    'type' => 'lab_test_results_ready',
                    'title' => 'Lab Test Results Available',
                    'message' => "Results for '{$labTestResult->test->name}' for patient {$labTestResult->patient->getFullNameAttribute()} are ready.",
                    'data' => [
                        'lab_test_result_id' => $labTestResult->id,
                        'result_id' => $labTestResult->result_id,
                        'test_name' => $labTestResult->test->name,
                        'patient_id' => $labTestResult->patient_id,
                        'abnormal_flags' => $labTestResult->abnormal_flags,
                    ],
                    'priority' => $labTestResult->abnormal_flags ? 'high' : 'normal',
                ]);
            }

            Log::info('Lab test results ready notification sent', [
                'lab_test_result_id' => $labTestResult->id,
                'result_id' => $labTestResult->result_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send lab test results ready notification', [
                'lab_test_result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
