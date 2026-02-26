<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Services\DayStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DayStatusController extends Controller
{
    protected $dayStatusService;

    public function __construct(DayStatusService $dayStatusService)
    {
        $this->dayStatusService = $dayStatusService;
    }

    /**
     * Get current day status
     */
    public function getStatus(): JsonResponse
    {
        try {
            $status = $this->dayStatusService->checkDayStatus();
            
            return response()->json([
                'success' => true,
                'data' => $status,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get day status',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Archive current day and start new day
     */
    public function archiveDay(): JsonResponse
    {
        try {
            $result = $this->dayStatusService->archiveCurrentDay();
            
            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Day archived successfully',
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to archive day',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get yesterday's summary for confirmation dialog
     */
    public function getYesterdaySummary(): JsonResponse
    {
        try {
            $summary = $this->dayStatusService->getYesterdaySummary();
            
            return response()->json([
                'success' => true,
                'data' => $summary,
                'timestamp' => now()->toISOString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get yesterday summary',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}