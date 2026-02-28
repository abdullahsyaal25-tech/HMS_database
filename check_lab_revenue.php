<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'hospital_management_system', 3306);
if ($conn->connect_error) { 
    die('Connection failed: ' . $conn->connect_error);
}

$start = '2026-02-27 14:44:16';
$end = '2026-02-28 01:46:31';

ob_start();

// Get lab department ID
$sql = "SELECT id FROM departments WHERE name = 'Laboratory'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
$labDeptId = $row['id'];
echo "Laboratory Department ID: $labDeptId\n\n";

// === Part 1: getLaboratoryRevenue - labTestResultsRevenue ===
echo "=== getLaboratoryRevenue: Part 1 - lab_test_results ===\n";
$sql = "SELECT ltr.id, ltr.test_id, ltr.performed_at, ltr.status, lt.cost, lt.name
FROM lab_test_results ltr
JOIN lab_tests lt ON ltr.test_id = lt.id
WHERE (ltr.performed_at BETWEEN '$start' AND '$end')
   OR (ltr.performed_at IS NULL AND ltr.status IN ('completed', 'verified'))
ORDER BY ltr.performed_at";
$result = $conn->query($sql);
$total1 = 0;
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . ", Performed: " . ($row['performed_at'] ?? 'NULL') . ", Status: " . $row['status'] . ", Cost: " . $row['cost'] . "\n";
    $total1 += $row['cost'];
}
echo "Total Part 1: $total1\n\n";

// === Part 2: appointmentLabServicesRevenue ===
echo "=== getLaboratoryRevenue: Part 2 - appointment_services (Lab department services) ===\n";
$sql = "SELECT asv.appointment_id, a.appointment_date, a.status, ds.name as service_name, asv.final_cost
FROM appointment_services asv
JOIN appointments a ON asv.appointment_id = a.id
JOIN department_services ds ON asv.department_service_id = ds.id
JOIN departments d ON ds.department_id = d.id
WHERE a.status IN ('completed', 'confirmed')
AND d.name = 'Laboratory'
AND a.appointment_date BETWEEN '$start' AND '$end'";
$result = $conn->query($sql);
$total2 = 0;
while ($row = $result->fetch_assoc()) {
    echo "ApptID: " . $row['appointment_id'] . ", Date: " . $row['appointment_date'] . ", Service: " . $row['service_name'] . ", FinalCost: " . $row['final_cost'] . "\n";
    $total2 += $row['final_cost'];
}
echo "Total Part 2: $total2\n\n";

// === Part 3: labDepartmentAppointmentsRevenue - THE BUG! ===
echo "=== getLaboratoryRevenue: Part 3 - Lab Department Appointments (DIRECT FEES) ===\n";
// This query is from the code - but it DOESN'T filter by date range!
$sql = "SELECT id, appointment_date, status, fee, discount, department_id 
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND department_id = $labDeptId
AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)
ORDER BY appointment_date";
$result = $conn->query($sql);
$total3 = 0;
while ($row = $result->fetch_assoc()) {
    $rev = max(0, ($row['fee'] ?? 0) - ($row['discount'] ?? 0));
    echo "ID: " . $row['id'] . ", Date: " . $row['appointment_date'] . ", Fee: " . ($row['fee'] ?? 0) . ", Discount: " . ($row['discount'] ?? 0) . ", Revenue: " . $rev . "\n";
    $total3 += $rev;
}
echo "Total Part 3 (NO DATE FILTER): $total3\n";

// Now let's add the date filter to see what it SHOULD be:
$sql = "SELECT id, appointment_date, status, fee, discount, department_id 
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND department_id = $labDeptId
AND appointment_date BETWEEN '$start' AND '$end'
AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)
ORDER BY appointment_date";
$result = $conn->query($sql);
$total3_correct = 0;
while ($row = $result->fetch_assoc()) {
    $rev = max(0, ($row['fee'] ?? 0) - ($row['discount'] ?? 0));
    $total3_correct += $rev;
}
echo "Total Part 3 (WITH DATE FILTER - CORRECT): $total3_correct\n\n";

// Now let's check what the code actually does (without date filter)
echo "=== SUMMARY ===\n";
echo "Part 1 (lab_test_results): $total1\n";
echo "Part 2 (appointment_services): $total2\n";
echo "Part 3 as-is (NO date filter - BUG): $total3\n";
echo "Part 3 with date filter (CORRECT): $total3_correct\n";
echo "TOTAL (with bug): " . ($total1 + $total2 + $total3) . "\n";
echo "TOTAL (correct): " . ($total1 + $total2 + $total3_correct) . "\n";

$output = ob_get_clean();
file_put_contents('check_lab_output.txt', $output);
echo $output;

$conn->close();
