<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate what the controller does
$testNameToIdMap = App\Models\LabTest::pluck('id', 'name')->toArray();

// Get patients who have lab test requests that are pending or in_progress
$patientsWithRequests = App\Models\Patient::whereHas('labTestRequests', function ($query) {
    $query->whereIn('status', ['pending', 'in_progress']);
})->get();

echo "Patients with pending/in_progress requests: " . $patientsWithRequests->count() . "\n\n";

// Check first patient
$patient = $patientsWithRequests->first();
if ($patient) {
    echo "Patient: {$patient->first_name} {$patient->father_name} (ID: {$patient->id})\n";
    
    $allRequests = $patient->labTestRequests()
        ->whereIn('status', ['pending', 'in_progress'])
        ->get();
    
    echo "Requests:\n";
    $requestTestIds = [];
    foreach ($allRequests as $req) {
        $testId = $testNameToIdMap[$req->test_name] ?? null;
        echo "  - {$req->test_name} => " . ($testId ? "ID: $testId" : "NO MATCH") . "\n";
        if ($testId) {
            $requestTestIds[] = $testId;
        }
    }
    
    // Get result test IDs
    $resultTestIds = $patient->labTestResults()
        ->whereIn('status', ['completed', 'verified'])
        ->pluck('test_id')
        ->toArray();
    
    echo "\nResult Test IDs (completed/verified): " . implode(', ', $resultTestIds) . "\n";
    
    // Check unresulted
    $unresultedTestIds = array_diff($requestTestIds, $resultTestIds);
    echo "Unresulted Test IDs: " . implode(', ', $unresultedTestIds) . "\n";
    
    // Get requested test names
    $requestedTestNames = $allRequests
        ->map(function ($req) use ($testNameToIdMap) {
            $testId = $testNameToIdMap[$req->test_name] ?? null;
            return $testId ? App\Models\LabTest::find($testId)?->name : null;
        })
        ->filter()
        ->unique()
        ->toArray();
    
    echo "\nRequested Test Names for labTests query:\n";
    foreach ($requestedTestNames as $name) {
        echo "  - $name\n";
    }
    
    // Simulate labTests query
    $labTests = App\Models\LabTest::whereIn('name', $requestedTestNames)
        ->whereNotNull('parameters')
        ->where('parameters', '!=', '[]')
        ->where('parameters', '!=', '{}')
        ->get();
    
    echo "\nLabTests that would be passed to frontend: " . $labTests->count() . "\n";
    foreach ($labTests as $test) {
        echo "  - {$test->name} (ID: {$test->id})\n";
    }
    
    // Simulate patientTestRequests
    echo "\nPatientTestRequests that would be passed:\n";
    $patientRequests = $allRequests
        ->filter(function ($req) use ($testNameToIdMap, $resultTestIds) {
            $testId = $testNameToIdMap[$req->test_name] ?? null;
            if ($testId === null) return true;
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
    
    foreach ($patientRequests as $pr) {
        echo "  - {$pr['test_name']} ({$pr['request_id']})\n";
    }
    
    // Check intersection
    $labTestNames = $labTests->pluck('name')->toArray();
    $patientTestNames = array_column($patientRequests, 'test_name');
    echo "\nIntersection check:\n";
    echo "  LabTest names: " . implode(', ', $labTestNames) . "\n";
    echo "  Patient request names: " . implode(', ', $patientTestNames) . "\n";
    $intersection = array_intersect($labTestNames, $patientTestNames);
    echo "  Common: " . (empty($intersection) ? 'NONE' : implode(', ', $intersection)) . "\n";
}
