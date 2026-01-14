<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\SmartCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PatientController extends Controller
{
    protected SmartCacheService $cacheService;

    public function __construct(SmartCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 10);

            // Validate pagination parameters
            if ($perPage < 1 || $perPage > 100) {
                return response()->json([
                    'message' => 'Invalid per_page parameter. Must be between 1 and 100.',
                    'errors' => ['per_page' => ['Must be between 1 and 100']]
                ], 422);
            }

            $patients = Patient::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            Log::info('Patients list retrieved', [
                'count' => $patients->total(),
                'page' => $patients->currentPage(),
                'per_page' => $perPage
            ]);

            return response()->json([
                'success' => true,
                'data' => $patients->items(),
                'pagination' => [
                    'current_page' => $patients->currentPage(),
                    'last_page' => $patients->lastPage(),
                    'per_page' => $patients->perPage(),
                    'total' => $patients->total(),
                    'from' => $patients->firstItem(),
                    'to' => $patients->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve patients list', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve patients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255|min:2',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|unique:patients,email',
                'phone' => 'nullable|string|max:20|regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'address' => 'nullable|string|max:500',
                'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
                'gender' => 'required|in:male,female,other',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:20',
                'medical_conditions' => 'nullable|string|max:1000',
            ]);

            // Generate unique patient ID
            $year = date('Y');
            $lastPatient = Patient::where('patient_id', 'LIKE', 'P' . $year . '%')
                ->orderByRaw('CAST(SUBSTRING(patient_id, ' . (strlen($year) + 2) . ') AS UNSIGNED) DESC')
                ->first();

            $nextNumber = $lastPatient ? (int)substr($lastPatient->patient_id, strlen('P'.$year)) + 1 : 1;
            $patientId = 'P' . $year . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            $patientData = array_merge($validatedData, [
                'patient_id' => $patientId,
                'metadata' => [
                    'emergency_contact' => [
                        'name' => $validatedData['emergency_contact_name'] ?? null,
                        'phone' => $validatedData['emergency_contact_phone'] ?? null,
                    ],
                    'medical_conditions' => $validatedData['medical_conditions'] ?? null,
                ]
            ]);

            // Remove temporary fields
            unset($patientData['emergency_contact_name'], $patientData['emergency_contact_phone'], $patientData['medical_conditions']);

            $patient = Patient::create($patientData);

            // Clear relevant caches
            $this->cacheService->clearPatientCache($patient->id);

            Log::info('Patient created successfully', [
                'patient_id' => $patient->patient_id,
                'id' => $patient->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Patient created successfully',
                'data' => $patient->load('user:id,name')
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Patient creation validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Patient creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'input' => $request->except(['password']) // Don't log sensitive data
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create patient',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);

        return response()->json([
            'data' => $patient
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:patients,email,' . $id,
            'phone' => 'sometimes|required|string|max:20',
            'address' => 'nullable|string',
            'date_of_birth' => 'sometimes|required|date',
            'gender' => 'sometimes|required|in:male,female,other',
        ]);

        $patient->update($request->all());

        return response()->json([
            'message' => 'Patient updated successfully',
            'data' => $patient
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();

        return response()->json([
            'message' => 'Patient deleted successfully'
        ]);
    }
}