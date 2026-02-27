<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use App\Models\LabTest;
use App\Models\LabTestRequest;
use App\Models\Patient;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestResultController extends Controller
{
    protected AuditLogService $auditLogService;

    public function __construct(
        AuditLogService $auditLogService
    ) {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the lab test results.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }
        
        // Get filter parameters
        $statusFilter = $request->input('status', '');
        $patientFilter = $request->input('patient_id', '');
        $testFilter = $request->input('test_id', '');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $searchQuery = $request->input('query', '');
        
        // Build the query
        $query = LabTestResult::with('test', 'patient');
        
        // Apply search filter
        if ($searchQuery) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('result_id', 'like', '%' . $searchQuery . '%')
                  ->orWhereHas('patient', function ($q) use ($searchQuery) {
                      $q->where('first_name', 'like', '%' . $searchQuery . '%')
                        ->orWhere('father_name', 'like', '%' . $searchQuery . '%');
                  })
                  ->orWhereHas('test', function ($q) use ($searchQuery) {
                      $q->where('name', 'like', '%' . $searchQuery . '%');
                  });
            });
        }
        
        // Apply status filter
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }
        
        // Apply patient filter
        if ($patientFilter) {
            $query->where('patient_id', $patientFilter);
        }
        
        // Apply test filter
        if ($testFilter) {
            $query->where('lab_test_id', $testFilter);
        }
        
        // Apply date range filters
        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }
        
        $labTestResults = $query->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(function ($result) {
                // Map 'test' relationship to 'labTest' for frontend compatibility
                $data = $result->toArray();
                $data['labTest'] = $data['test'] ?? null;
                unset($data['test']);
                return $data;
            });
        
        // Get filter options
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $labTests = LabTest::select('id', 'test_code', 'name')->get();
        
        // Calculate stats
        $stats = [
            'total' => LabTestResult::count(),
            'pending' => LabTestResult::where('status', 'pending')->count(),
            'completed' => LabTestResult::where('status', 'completed')->count(),
            'verified' => LabTestResult::where('status', 'verified')->count(),
            'abnormal' => LabTestResult::where('status', 'abnormal')->count(),
            'critical' => LabTestResult::where('status', 'critical')->count(),
        ];
        
        return Inertia::render('Laboratory/LabTestResults/Index', [
            'labTestResults' => $labTestResults,
            'filters' => [
                'status' => $statusFilter,
                'patient_id' => $patientFilter,
                'test_id' => $testFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'query' => $searchQuery,
            ],
            'patients' => $patients,
            'labTests' => $labTests,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new lab test result.
     */
    public function create(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Build a cache of test names to IDs for efficient lookups
        $testNameToIdMap = LabTest::pluck('id', 'name')->toArray();
        
        // Get patients who have lab test requests that are pending or in_progress
        // This allows technicians to see patients with newly created requests (pending)
        // as well as requests that have been started (in_progress)
        $patientsWithRequests = Patient::whereHas('labTestRequests', function ($query) {
            $query->whereIn('status', ['pending', 'in_progress']);
        })->get();
        
        // Filter to exclude patients who already have results for all their tests
        $patients = $patientsWithRequests->filter(function ($patient) use ($testNameToIdMap) {
            $allRequests = $patient->labTestRequests()
                ->whereIn('status', ['pending', 'in_progress'])
                ->get();
            
            // If patient has no pending or in_progress requests, exclude them
            if ($allRequests->isEmpty()) {
                return false;
            }
            
            // Get test IDs from pending/in_progress requests using the cached mapping
            $requestTestIds = $allRequests->map(function ($req) use ($testNameToIdMap) {
                return $testNameToIdMap[$req->test_name] ?? null;
            })->filter()->toArray();
            
            // If we can't map test names to IDs, include the patient (better safe than sorry)
            if (empty($requestTestIds)) {
                return true;
            }
            
            // Get test IDs that already have completed/verified results
            // Only exclude patients whose results are completed or verified
            $resultTestIds = $patient->labTestResults()
                ->whereIn('status', ['completed', 'verified'])
                ->pluck('test_id')
                ->toArray();
            
            // Check if there are any pending/in_progress requests without completed results
            $unresultedTestIds = array_diff($requestTestIds, $resultTestIds);
            
            return !empty($unresultedTestIds);
        })->values();
        
        // Get lab tests that have been requested by these patients but don't have results yet
        $requestedTestNames = [];
        if (!$patients->isEmpty()) {
            $allRequestedTests = \App\Models\LabTestRequest::whereIn('patient_id', $patients->pluck('id'))
                ->whereIn('status', ['pending', 'in_progress', 'completed'])
                ->get();
            
            // Get test IDs that already have completed/verified results for these patients
            $testsWithResults = LabTestResult::whereIn('patient_id', $patients->pluck('id'))
                ->whereIn('status', ['completed', 'verified'])
                ->pluck('test_id')
                ->toArray();
            
            // Map test names to IDs and filter out ones with results
            $requestedTestNames = $allRequestedTests
                ->map(function ($req) use ($testNameToIdMap) {
                    return $testNameToIdMap[$req->test_name] ?? null;
                })
                ->filter()
                ->filter(function ($testId) use ($testsWithResults) {
                    return !in_array($testId, $testsWithResults);
                })
                ->map(function ($testId) {
                    return LabTest::find($testId)?->name;
                })
                ->filter()
                ->unique()
                ->toArray();
        }
            
        // Fetch lab tests that have parameters configured
        // Filter out duplicates by name, keeping only tests with valid parameters
        $labTests = $requestedTestNames 
            ? LabTest::whereIn('name', $requestedTestNames)
                ->whereNotNull('parameters')
                ->where('parameters', '!=', '[]')
                ->where('parameters', '!=', '{}')
                ->get()
                // Remove duplicates by name, keeping the first one (typically the seeder one)
                ->keyBy('name')
                ->values()
            : collect();
        
        // Get patient-specific test requests (map of patient_id to their test requests)
        // Only show pending and in_progress requests that don't have results yet
        $patientTestRequests = [];
        foreach ($patients as $patient) {
            // Get pending and in_progress requests for this patient
            $pendingRequests = $patient->labTestRequests()
                ->whereIn('status', ['pending', 'in_progress'])
                ->get();
            
            // Get test IDs that already have completed/verified results
            $resultTestIds = $patient->labTestResults()
                ->whereIn('status', ['completed', 'verified'])
                ->pluck('test_id')
                ->toArray();
            
            // Filter out tests that already have results using cached mapping
            $patientRequests = $pendingRequests
                ->filter(function ($req) use ($testNameToIdMap, $resultTestIds) {
                    $testId = $testNameToIdMap[$req->test_name] ?? null;
                    if ($testId === null) {
                        // If we can't find the test ID, include it (safer)
                        return true;
                    }
                    return !in_array($testId, $resultTestIds);
                })
                ->map(function ($req) {
                    return [
                        'test_name' => $req->test_name,
                        'request_id' => $req->request_id,
                        'status' => $req->status,
                    ];
                })
                ->toArray();
            $patientTestRequests[$patient->id] = $patientRequests;
        }
        
        // Remove patients who have no remaining tests without results
        $patients = $patients->filter(function ($patient) use ($patientTestRequests) {
            return !empty($patientTestRequests[$patient->id]);
        })->values();
        
        // Get pending lab test requests for the dropdown
        $requests = \App\Models\LabTestRequest::whereIn('status', ['pending', 'in_progress', 'completed'])
            ->with('patient')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'request_id' => $request->request_id,
                    'test_name' => $request->test_name,
                    'patient_id' => $request->patient_id,
                ];
            });
        
        return Inertia::render('Laboratory/LabTestResults/Create', [
            'labTests' => $labTests,
            'patients' => $patients,
            'requests' => $requests,
            'patientTestRequests' => $patientTestRequests,
        ]);
    }

    /**
     * Store a newly created lab test result in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        Log::debug('LabTestResultController store - incoming request', [
            'all_data' => $request->all(),
        ]);
        
        $validator = Validator::make($request->all(), [
            'lab_test_id' => 'required|exists:lab_tests,id',
            'patient_id' => 'required|exists:patients,id',
            'performed_at' => 'required|date',
            'results' => 'required|string',
            'status' => 'required|in:pending,completed,verified',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            Log::warning('LabTestResultController store - validation failed', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        try {
            DB::beginTransaction();

            // Get the lab test details for the test name lookup
            $labTest = LabTest::find($request->lab_test_id);
            
            $resultId = 'RES-' . strtoupper(uniqid());
            
            // Results are already JSON string from frontend, decode and re-encode to ensure valid JSON
            $resultsData = is_string($request->results) ? json_decode($request->results, true) : $request->results;
            
            $labTestResult = LabTestResult::create([
                'result_id' => $resultId,
                'test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => json_encode($resultsData),
                'status' => $request->status,
                'notes' => $request->notes,
                'performed_by' => $user->id,
            ]);

            // Auto-update the associated LabTestRequest status
            // Find the LabTestRequest for this patient and test that is pending or in_progress
            if ($labTest) {
                $labTestRequest = LabTestRequest::where('patient_id', $request->patient_id)
                    ->where('test_name', $labTest->name)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->first();
                
                if ($labTestRequest) {
                    // Handle status transition based on current status
                    // pending -> in_progress -> completed
                    try {
                        if ($labTestRequest->status === 'pending' && $labTestRequest->canTransitionTo('in_progress')) {
                            $labTestRequest->transitionTo('in_progress');
                            Log::info('LabTestRequest auto-transitioned to in_progress', [
                                'request_id' => $labTestRequest->request_id,
                                'result_id' => $labTestResult->id,
                            ]);
                        }
                        
                        if ($labTestRequest->canTransitionTo('completed')) {
                            $labTestRequest->transitionTo('completed');
                            Log::info('LabTestRequest auto-completed', [
                                'request_id' => $labTestRequest->request_id,
                                'result_id' => $labTestResult->id,
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::warning('LabTestRequest auto-transition failed', [
                            'request_id' => $labTestRequest->request_id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            DB::commit();
            
            return redirect()->route('laboratory.lab-test-results.index')
                ->with('success', 'Lab test result created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('LabTestResultController store - error creating result', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->with('error', 'Failed to create lab test result: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified lab test result.
     */
    public function show(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        return Inertia::render('Laboratory/LabTestResults/Show', [
            'labTestResult' => $labTestResult
        ]);
    }

    /**
     * Show the form for editing the specified lab test result.
     */
    public function edit(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        $labTests = LabTest::all();
        $patients = Patient::all();
        
        return Inertia::render('Laboratory/LabTestResults/Edit', [
            'labTestResult' => $labTestResult,
            'labTests' => $labTests,
            'patients' => $patients
        ]);
    }

    /**
     * Update the specified lab test result in storage.
     */
    public function update(Request $request, LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'lab_test_id' => 'required|exists:lab_tests,id',
            'patient_id' => 'required|exists:patients,id',
            'performed_at' => 'required|date',
            'results' => 'required|string',
            'status' => 'required|in:pending,completed,verified',
            'notes' => 'nullable|string',
            'abnormal_flags' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $oldStatus = $labTestResult->status;
        
            $labTestResult->update([
                'lab_test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => $request->results,
                'status' => $request->status,
                'notes' => $request->notes,
                'abnormal_flags' => $request->abnormal_flags,
            ]);

            DB::commit();
        
            return redirect()->route('laboratory.lab-test-results.index')->with('success', 'Lab test result updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating lab test result', [
                'result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to update lab test result: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Show the verify form for the specified lab test result.
     */
    public function verify(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('verify-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        return Inertia::render('Laboratory/LabTestResults/Verify', [
            'labTestResult' => $labTestResult
        ]);
    }

    /**
     * Verify the specified lab test result.
     */
    public function verifyPost(Request $request, LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('verify-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Check if already verified
        if ($labTestResult->status === 'verified') {
            return redirect()->back()->with('error', 'This result has already been verified.');
        }
        
        try {
            DB::beginTransaction();
            
            $labTestResult->update([
                'status' => 'verified',
                'verified_at' => now(),
                'verified_by' => $user->id,
            ]);
            
            // Log the verification
            Log::info('Lab test result verified', [
                'result_id' => $labTestResult->id,
                'verified_by' => $user->id,
            ]);

            DB::commit();
            
            return redirect()->route('laboratory.lab-test-results.index')
                ->with('success', 'Lab test result verified successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error verifying lab test result', [
                'result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to verify lab test result: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified lab test result from storage.
     */
    public function destroy(LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResult->delete();
        
        return redirect()->route('laboratory.lab-test-results.index')
            ->with('success', 'Lab test result deleted successfully.');
    }
}
