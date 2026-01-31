<?php

namespace App\Notifications;

use App\Models\LabTestRequest;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class LabTestScheduledNotification
{
    /**
     * Create a notification for lab test scheduled.
     */
    public static function notify(LabTestRequest $labTestRequest): void
    {
        try {
            // Notify the patient
            if ($labTestRequest->patient && $labTestRequest->patient->user_id) {
                Notification::create([
                    'user_id' => $labTestRequest->patient->user_id,
                    'type' => 'lab_test_scheduled',
                    'title' => 'Lab Test Scheduled',
                    'message' => "Your lab test '{$labTestRequest->test_name}' has been scheduled for " . $labTestRequest->scheduled_at->format('M d, Y H:i'),
                    'data' => [
                        'lab_test_request_id' => $labTestRequest->id,
                        'request_id' => $labTestRequest->request_id,
                        'test_name' => $labTestRequest->test_name,
                        'scheduled_at' => $labTestRequest->scheduled_at->toDateTimeString(),
                    ],
                    'priority' => $labTestRequest->test_type === 'stat' ? 'high' : 'normal',
                ]);
            }

            // Notify the doctor
            if ($labTestRequest->doctor && $labTestRequest->doctor->user_id) {
                Notification::create([
                    'user_id' => $labTestRequest->doctor->user_id,
                    'type' => 'lab_test_scheduled',
                    'title' => 'Lab Test Requested',
                    'message' => "Lab test '{$labTestRequest->test_name}' has been scheduled for patient {$labTestRequest->patient->getFullNameAttribute()}",
                    'data' => [
                        'lab_test_request_id' => $labTestRequest->id,
                        'request_id' => $labTestRequest->request_id,
                        'test_name' => $labTestRequest->test_name,
                        'patient_id' => $labTestRequest->patient_id,
                    ],
                    'priority' => $labTestRequest->test_type === 'stat' ? 'high' : 'normal',
                ]);
            }

            Log::info('Lab test scheduled notification sent', [
                'lab_test_request_id' => $labTestRequest->id,
                'request_id' => $labTestRequest->request_id,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send lab test scheduled notification', [
                'lab_test_request_id' => $labTestRequest->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
