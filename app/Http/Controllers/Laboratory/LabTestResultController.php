<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use App\Models\LabTest;
use App\Models\LabTestRequest;
use App\Models\Patient;
use App\Models\LabMaterial;
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
            ->paginate(100)
            ->withQueryString();
        
        // Transform the collection to map 'test' to 'labTest'
        $labTestResults->getCollection()->transform(function ($result) {
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
        
        // Get only patients with incomplete lab test requests (pending or in_progress)
        // Exclude patients whose tests are already completed
        $patients = Patient::whereHas('labTestRequests', function ($query) {
            $query->whereIn('status', ['pending', 'in_progress']);
        })->orderBy('first_name')->get();
        
        // Get all lab tests with parameters
        $labTests = LabTest::whereNotNull('parameters')
            ->where('parameters', '!=', '[]')
            ->where('parameters', '!=', '{}')
            ->orderBy('name')
            ->get()
            ->keyBy('name')
            ->values();
        
        // Get all lab test requests (for reference)
        $requests = \App\Models\LabTestRequest::with('patient')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'request_id' => $request->request_id,
                    'test_name' => $request->test_name,
                    'patient_id' => $request->patient_id,
                ];
            });
        
        // Build patient-specific test request mapping (only incomplete tests without results)
        $patientTestRequests = [];
        foreach ($patients as $patient) {
            // Get test names that already have completed results for this patient
            $completedTestNames = LabTestResult::where('patient_id', $patient->id)
                ->where('status', 'completed')
                ->pluck('test_id')
                ->toArray();
            
            // Get the lab test names from the completed results
            $completedTestNames = LabTest::whereIn('id', $completedTestNames)
                ->pluck('name')
                ->toArray();
            
            $patientRequests = $patient->labTestRequests()
                ->whereIn('status', ['pending', 'in_progress'])
                ->whereNotIn('test_name', $completedTestNames) // Exclude tests that already have results
                ->get()
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
        
        // Filter out patients who no longer have any available tests after filtering
        $patients = $patients->filter(function ($patient) use ($patientTestRequests) {
            return !empty($patientTestRequests[$patient->id]);
        })->values();
        
        // Debug logging
        Log::debug('LabTestResultController create - data being passed', [
            'labTests_count' => $labTests->count(),
            'labTests_names' => $labTests->pluck('name')->toArray(),
            'patients_count' => $patients->count(),
            'patientTestRequests_keys' => array_keys($patientTestRequests),
            'patientTestRequests_sample' => !empty($patientTestRequests) ? array_slice($patientTestRequests, 0, 1, true) : [],
        ]);

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
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            Log::warning('LabTestResultController store - validation failed', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Check if a completed result already exists for this patient and test
        $existingResult = LabTestResult::where('patient_id', $request->patient_id)
            ->where('test_id', $request->lab_test_id)
            ->where('status', 'completed')
            ->first();
            
        if ($existingResult) {
            Log::warning('LabTestResultController store - result already exists', [
                'patient_id' => $request->patient_id,
                'lab_test_id' => $request->lab_test_id,
                'existing_result_id' => $existingResult->result_id,
            ]);
            return redirect()->back()
                ->with('error', 'A result already exists for this patient and test. Please edit the existing result instead.')
                ->withInput();
        }
        
        try {
            DB::beginTransaction();

            // Get the lab test details for the test name lookup
            $labTest = LabTest::find($request->lab_test_id);
            
            $resultId = 'RES-' . strtoupper(uniqid());
            
            // Results are already JSON string from frontend, decode and re-encode to ensure valid JSON
            $resultsData = is_string($request->results) ? json_decode($request->results, true) : $request->results;
            
            // Always set status to completed - simplified workflow
            $status = 'completed';
            
            $labTestResult = LabTestResult::create([
                'result_id' => $resultId,
                'test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => json_encode($resultsData),
                'status' => $status,
                'notes' => $request->notes,
                'performed_by' => $user->id,
                'verified_at' => now(),
                'verified_by' => $user->id,
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

            // Deduct materials associated with this lab test (if any exist)
            $materials = LabMaterial::where('lab_test_id', $request->lab_test_id)
                ->where('status', '!=', 'out_of_stock')
                ->get();
            
            if ($materials->isNotEmpty()) {
                foreach ($materials as $material) {
                    try {
                        if ($material->quantity >= 1) {
                            $material->removeStock(1);
                            Log::info('Lab material deducted', [
                                'material_id' => $material->material_id,
                                'material_name' => $material->name,
                                'lab_test_id' => $request->lab_test_id,
                                'result_id' => $labTestResult->id,
                                'quantity_deducted' => 1,
                                'remaining_quantity' => $material->quantity,
                            ]);
                        } else {
                            Log::warning('Lab material insufficient stock', [
                                'material_id' => $material->material_id,
                                'material_name' => $material->name,
                                'lab_test_id' => $request->lab_test_id,
                                'available_quantity' => $material->quantity,
                            ]);
                        }
                    } catch (\Exception $e) {
                        Log::error('Failed to deduct lab material', [
                            'material_id' => $material->material_id,
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
        
        // Load relationships - include reference_ranges from test
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        // Determine permissions - no verification process, always allow editing
        $canEdit = $user->hasPermission('edit-lab-test-results');
        $canPrint = true; // Always allow printing for users with view permission
        $canEmail = true;
        
        return Inertia::render('Laboratory/LabTestResults/Show', [
            'labTestResult' => $labTestResult,
            'canEdit' => $canEdit,
            'canVerify' => false, // Verification removed - auto-completed on save
            'canPrint' => $canPrint,
            'canEmail' => $canEmail,
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
            'notes' => 'nullable|string',
            'abnormal_flags' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();
        
            $labTestResult->update([
                'lab_test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => $request->results,
                'status' => 'completed',
                'notes' => $request->notes,
                'abnormal_flags' => $request->abnormal_flags,
                'verified_at' => now(),
                'verified_by' => $user->id,
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
     * 
     * NOTE: This method is kept for backward compatibility but verification
     * is no longer required as results are auto-completed on save.
     */
    public function verifyPost(Request $request, LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('verify-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Results are auto-completed on save - no verification needed
        return redirect()->route('laboratory.lab-test-results.index')
            ->with('info', 'Results are automatically completed on save. No additional verification required.');
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
