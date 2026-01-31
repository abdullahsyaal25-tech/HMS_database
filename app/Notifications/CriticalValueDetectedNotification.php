<?php

namespace App\Notifications;

use App\Models\LabTestResult;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class CriticalValueDetectedNotification
{
    /**
     * Create a notification for critical lab values detected.
     */
    public static function notify(LabTestResult $labTestResult, string $criticalDetails): void
    {
        try {
            // Notify the patient with high priority
            if ($labTestResult->patient && $labTestResult->patient->user_id) {
                Notification::create([
                    'user_id' => $labTestResult->patient->user_id,
                    'type' => 'critical_value_detected',
                    'title' => '⚠️ Critical Lab Value Detected',
                    'message' => "Critical values detected in your '{$labTestResult->test->name}' test. Please contact your doctor immediately.",
                    'data' => [
                        'lab_test_result_id' => $labTestResult->id,
                        'result_id' => $labTestResult->result_id,
                        'test_name' => $labTestResult->test->name,
                        'critical_details' => $criticalDetails,
                    ],
                    'priority' => 'critical',
                ]);
            }

            // Notify the requesting doctor
            if ($labTestResult->request && $labTestResult->request->doctor && $labTestResult->request->doctor->user_id) {
                Notification::create([
                    'user_id' => $labTestResult->request->doctor->user_id,
                    'type' => 'critical_value_detected',
                    'title' => '⚠️ Critical Lab Value Alert',
                    'message' => "Critical values detected for patient {$labTestResult->patient->getFullNameAttribute()} in '{$labTestResult->test->name}' test.",
                    'data' => [
                        'lab_test_result_id' => $labTestResult->id,
                        'result_id' => $labTestResult->result_id,
                        'test_name' => $labTestResult->test->name,
                        'patient_id' => $labTestResult->patient_id,
                        'patient_name' => $labTestResult->patient->getFullNameAttribute(),
                        'critical_details' => $criticalDetails,
                    ],
                    'priority' => 'critical',
                ]);
            }

            // Notify all lab admins and hospital admins
            $adminUsers = User::whereHas('roleModel', function ($query) {
                $query->whereIn('slug', ['super-admin', 'hospital-admin', 'lab-admin']);
            })->get();

            foreach ($adminUsers as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'type' => 'critical_value_detected',
                    'title' => '⚠️ Critical Lab Value Alert',
                    'message' => "Critical values detected for patient {$labTestResult->patient->getFullNameAttribute()} in '{$labTestResult->test->name}' test.",
                    'data' => [
                        'lab_test_result_id' => $labTestResult->id,
                        'result_id' => $labTestResult->result_id,
                        'test_name' => $labTestResult->test->name,
                        'patient_id' => $labTestResult->patient_id,
                        'patient_name' => $labTestResult->patient->getFullNameAttribute(),
                        'critical_details' => $criticalDetails,
                    ],
                    'priority' => 'critical',
                ]);
            }

            Log::warning('Critical lab value notification sent', [
                'lab_test_result_id' => $labTestResult->id,
                'result_id' => $labTestResult->result_id,
                'critical_details' => $criticalDetails,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send critical value notification', [
                'lab_test_result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
