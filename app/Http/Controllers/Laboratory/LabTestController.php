<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestController extends Controller
{
    /**
     * Display a listing of the lab tests.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Debug logging
        \Log::debug('LabTestController index access attempt', [
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'has_view_laboratory_permission' => $user->hasPermission('view-laboratory'),
            'has_required_roles' => $user->hasAnyRole(['Hospital Admin', 'Laboratory Admin']),
        ]);

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    \Log::warning('LabTestController index access denied - permission check failed', [
        'user_id' => $user->id,
        'username' => $user->username,
        'role' => $user->role,
    ]);
    abort(403, 'Unauthorized access');
}

        $labTests = LabTest::paginate(10);

        return Inertia::render('Laboratory/LabTests/Index', [
            'labTests' => $labTests
        ]);
    }

    /**
     * Show the form for creating a new lab test.
     */
    public function create(): Response
    {
        $user = Auth::user();

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('create-lab-tests')) {
    abort(403, 'Unauthorized access');
}

        return Inertia::render('Laboratory/LabTests/Create');
    }

    /**
     * Store a newly created lab test in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user has appropriate role (super admin bypass)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'duration' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Generate test code automatically
        $testCode = $this->generateTestCode($request->input('name'));

        // Map frontend field names to database field names
        $validatedData = [
            'test_code' => $testCode,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'cost' => $request->input('price'),
            'procedure' => $request->input('category'),
            'turnaround_time' => $this->parseDurationToHours($request->input('duration')),
            'unit' => $this->extractUnitFromDuration($request->input('duration')),
        ];

        LabTest::create($validatedData);

        return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test created successfully.');
    }

    /**
     * Display the specified lab test.
     */
public function show(LabTest $labTest): Response
{
    $user = Auth::user();

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}

    return Inertia::render('Laboratory/LabTests/Show', [
        'labTest' => $labTest
    ]);
}

    /**
     * Show the form for editing the specified lab test.
     */
public function edit(LabTest $labTest): Response
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    return Inertia::render('Laboratory/LabTests/Edit', [
        'labTest' => $labTest
    ]);
}

    /**
     * Update the specified lab test in storage.
     */
public function update(Request $request, LabTest $labTest): RedirectResponse
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'cost' => 'required|numeric|min:0',
        'procedure' => 'nullable|string',
        'turnaround_time' => 'nullable|integer|min:0',
        'unit' => 'nullable|string|max:100',
        'normal_values' => 'nullable|string',
    ]);

    if ($validator->fails()) {
        return redirect()->back()->withErrors($validator)->withInput();
    }

    $labTest->update($validator->validated());

    return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test updated successfully.');
}

    /**
     * Remove the specified lab test from storage.
     */
public function destroy(LabTest $labTest): RedirectResponse
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('delete-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    $labTest->delete();

    return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test deleted successfully.');
}

    /**
     * Generate a unique test code for the lab test.
     */
    private function generateTestCode(string $name): string
    {
        // Create an acronym from the test name
        $words = preg_split('/\s+/', $name);
        $acronym = '';
        
        foreach ($words as $word) {
            // Skip common words and only take letters
            $cleanWord = preg_replace('/[^a-zA-Z]/', '', $word);
            if (strlen($cleanWord) > 0) {
                $acronym .= strtoupper(substr($cleanWord, 0, 1));
            }
        }
        
        // Ensure we have at least 3 characters
        if (strlen($acronym) < 3) {
            // If acronym is too short, use first 3 letters of the name
            $cleanName = preg_replace('/[^a-zA-Z]/', '', $name);
            $acronym = strtoupper(substr($cleanName, 0, 3));
        }
        
        // Add a number suffix to ensure uniqueness
        $baseCode = $acronym;
        $counter = 1;
        
        do {
            $testCode = $baseCode . str_pad($counter, 3, '0', STR_PAD_LEFT);
            $exists = LabTest::where('test_code', $testCode)->exists();
            $counter++;
        } while ($exists && $counter <= 999);
        
        // If we can't find a unique code with 3 digits, use timestamp
        if ($counter > 999) {
            $testCode = $baseCode . now()->format('His');
        }
        
        return $testCode;
    }

    /**
     * Parse duration string to hours (e.g., "24 hours" -> 24, "1 week" -> 168).
     */
    private function parseDurationToHours(string $duration): int
    {
        $duration = strtolower(trim($duration));
        
        // Extract number from duration string
        if (preg_match('/(\d+)/', $duration, $matches)) {
            $number = (int)$matches[1];
            
            // Determine unit and convert to hours
            if (str_contains($duration, 'week') || str_contains($duration, 'weeks')) {
                return $number * 168; // 168 hours in a week
            } elseif (str_contains($duration, 'day') || str_contains($duration, 'days')) {
                return $number * 24; // 24 hours in a day
            } elseif (str_contains($duration, 'hour') || str_contains($duration, 'hours')) {
                return $number;
            } elseif (str_contains($duration, 'minute') || str_contains($duration, 'minutes')) {
                return ceil($number / 60); // Convert minutes to hours
            } elseif (str_contains($duration, 'month') || str_contains($duration, 'months')) {
                return $number * 720; // Approximate 30 days in a month
            }
        }
        
        // Default to 24 hours if parsing fails
        return 24;
    }

    /**
     * Extract unit from duration string (e.g., "24 hours" -> "hours").
     */
    private function extractUnitFromDuration(string $duration): string
    {
        $duration = strtolower(trim($duration));
        
        if (str_contains($duration, 'week') || str_contains($duration, 'weeks')) {
            return 'weeks';
        } elseif (str_contains($duration, 'day') || str_contains($duration, 'days')) {
            return 'days';
        } elseif (str_contains($duration, 'hour') || str_contains($duration, 'hours')) {
            return 'hours';
        } elseif (str_contains($duration, 'minute') || str_contains($duration, 'minutes')) {
            return 'minutes';
        } elseif (str_contains($duration, 'month') || str_contains($duration, 'months')) {
            return 'months';
        }
        
        // Default unit
        return 'hours';
    }

    /**
     * Search lab tests by name or category.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}

        $query = $request->input('query');

        $labTests = LabTest::where('name', 'like', '%' . $query . '%')
                    ->orWhere('description', 'like', '%' . $query . '%')
                    ->orWhere('procedure', 'like', '%' . $query . '%')
                    ->orWhere('unit', 'like', '%' . $query . '%')
                    ->paginate(10);

        return Inertia::render('Laboratory/LabTests/Index', [
            'labTests' => $labTests,
            'query' => $query
        ]);
    }
}
