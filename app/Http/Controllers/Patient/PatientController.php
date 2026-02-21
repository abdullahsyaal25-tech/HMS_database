<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PatientController extends Controller
{
    /**
     * Blood group validation
     */
    private function validateBloodGroup(?string $bloodGroup): ?string
    {
        $validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return in_array($bloodGroup, $validGroups) ? $bloodGroup : null;
    }

    /**
     * Sanitize input data to prevent XSS attacks
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'first_name' => strip_tags($data['first_name'] ?? ''),
            'father_name' => strip_tags($data['father_name'] ?? ''),
            'phone' => preg_replace('/[^0-9+]/', '', $data['phone'] ?? ''),
            'address' => strip_tags($data['address'] ?? ''),
            'age' => (int) ($data['age'] ?? 0),
            'gender' => in_array($data['gender'] ?? '', ['male', 'female', 'other'])
                ? $data['gender']
                : null,
            'blood_group' => $this->validateBloodGroup($data['blood_group'] ?? null),
        ];
    }

    /**
     * Check if the current user can access this patient's data
     */
    private function userCanAccessPatient(Patient $patient): bool
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        // Super admin can access all patients
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Users with broad permissions can access all patients
        if ($user->hasPermission('view-all-patients')) {
            return true;
        }
        
        // Owner access (patients viewing their own data in portal)
        if ($patient->user_id === $user->id) {
            return true;
        }
        
        // Staff with patient access permission
        return $user->hasPermission('view-patients');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $patients = Patient::with('user')->paginate(50);

        $patientsData = [
            'data' => $patients->items(),
            'links' => [
                'first' => $patients->url(1),
                'last' => $patients->url($patients->lastPage()),
                'prev' => $patients->previousPageUrl(),
                'next' => $patients->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $patients->currentPage(),
                'from' => $patients->firstItem(),
                'last_page' => $patients->lastPage(),
                'path' => $patients->path(),
                'per_page' => $patients->perPage(),
                'to' => $patients->lastItem(),
                'total' => $patients->total(),
                'male_count' => Patient::where('gender', 'male')->count(),
                'female_count' => Patient::where('gender', 'female')->count(),
                'today_count' => Patient::whereDate('created_at', today())->count(),
                'monthly_count' => Patient::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)->count(),
                'yearly_count' => Patient::whereYear('created_at', now()->year)->count(),
            ],
        ];

        return Inertia::render('Patient/Index', [
            'patients' => $patientsData
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Patient/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        $sanitizedData = $this->sanitizeInput($validated);

        DB::beginTransaction();
        try {
            // Generate a simple sequential patient ID starting from P00001
            $maxNumber = Patient::where('patient_id', 'LIKE', 'P%')
                ->selectRaw('MAX(CAST(SUBSTRING(patient_id, 2) AS UNSIGNED)) as max_num')
                ->value('max_num') ?? 0;

            $nextNumber = $maxNumber + 1;
            $patientId = 'P' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // Create patient record with sanitized data
            $patient = Patient::create([
                'patient_id' => $patientId,
                'first_name' => $sanitizedData['first_name'],
                'father_name' => $sanitizedData['father_name'],
                'gender' => $sanitizedData['gender'],
                'phone' => $sanitizedData['phone'],
                'address' => $sanitizedData['address'],
                'age' => $sanitizedData['age'],
                'blood_group' => $sanitizedData['blood_group'],
            ]);
            
            // Create user account for patient with secure password
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->father_name,
                'username' => $patientId,
                'password' => bcrypt(Str::password(16, true, true, true, true)),
                'role' => 'patient',
            ]);
            
            // Associate user with patient
            $patient->user()->associate($user);
            $patient->save();
            

            DB::commit();

            return redirect()->route('patients.index')->with('success', 'Patient created successfully.');
        } catch (\Exception $e) {
            DB::rollback();
           
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create patient: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient, Request $request): Response
    {
        // Get pagination information for all patients
        $currentPage = $request->get('page', 1);
        $perPage = 100;
        $patients = Patient::with('user')->orderBy('id')->paginate($perPage, ['*'], 'page', $currentPage);
        
        return Inertia::render('Patient/Show', [
            'patient' => $patient,
            'patients_pagination' => [
                'data' => $patients->items(),
                'meta' => [
                    'current_page' => $patients->currentPage(),
                    'from' => $patients->firstItem(),
                    'last_page' => $patients->lastPage(),
                    'path' => $patients->path(),
                    'per_page' => $patients->perPage(),
                    'to' => $patients->lastItem(),
                    'total' => $patients->total(),
                ],
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient): Response
    {
    
        
        // IDOR Protection - verify access before showing data
        if (!$this->userCanAccessPatient($patient)) {
            abort(403, 'Unauthorized access to patient record');
        }
        
        return Inertia::render('Patient/Edit', [
            'patient' => $patient
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePatientRequest $request, Patient $patient)
    {
        $validated = $request->validated();

        $sanitizedData = $this->sanitizeInput($validated);

        // Update user information if user exists
        if ($patient->user) {
            $patient->user->update([
                'name' => $sanitizedData['first_name'] ?: 'Patient',
            ]);
        }

        // Update patient information with sanitized data
        $patient->update([
            'first_name' => $sanitizedData['first_name'],
            'father_name' => $sanitizedData['father_name'],
            'gender' => $sanitizedData['gender'],
            'phone' => $sanitizedData['phone'],
            'address' => $sanitizedData['address'],
            'age' => $sanitizedData['age'],
            'blood_group' => $sanitizedData['blood_group'],
        ]);

        // Use Inertia's back() for proper SPA behavior and flash message handling
        return Inertia::back()->with('success', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        DB::beginTransaction();
        try {
            $patient->delete();
            $patient->user->delete(); // This will cascade due to foreign key constraint

            DB::commit();
            return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete patient: ' . $e->getMessage()]);
        }
    }

    /**
     * Quick store a newly created patient for pharmacy sales (returns JSON).
     */
    public function quickStore(Request $request)
    {
        $user = auth()->user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-patients')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $sanitizedData = $this->sanitizeInput($validated);

        DB::beginTransaction();
        try {
            // Generate a simple sequential patient ID starting from P00001
            $maxNumber = Patient::where('patient_id', 'LIKE', 'P%')
                ->selectRaw('MAX(CAST(SUBSTRING(patient_id, 2) AS UNSIGNED)) as max_num')
                ->value('max_num') ?? 0;

            $nextNumber = $maxNumber + 1;
            $patientId = 'P' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // Create patient record with sanitized data
            $patient = Patient::create([
                'patient_id' => $patientId,
                'first_name' => $sanitizedData['first_name'],
                'father_name' => $sanitizedData['father_name'],
                'phone' => $sanitizedData['phone'],
            ]);
            
            // Create user account for patient with secure password
            $fullName = $validated['first_name'] . ($validated['father_name'] ? ' ' . $validated['father_name'] : '');
            $user = User::create([
                'name' => $fullName,
                'username' => $patientId,
                'password' => bcrypt(\Illuminate\Support\Str::password(16, true, true, true, true)),
                'role' => 'patient',
            ]);
            
            // Associate user with patient
            $patient->user()->associate($user);
            $patient->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Patient created successfully',
                'data' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'first_name' => $patient->first_name,
                    'father_name' => $patient->father_name,
                    'phone' => $patient->phone,
                ]
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create patient: ' . $e->getMessage()
            ], 500);
        }
    }
}
