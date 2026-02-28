<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'hospital_management_system', 3306);
if ($conn->connect_error) { 
    file_put_contents('debug_output.txt', 'Connection failed: ' . $conn->connect_error); 
    die('Connection failed: ' . $conn->connect_error);
}

ob_start();

// Check if tables exist and have data
echo "=== Tables and row counts ===\n";

$tables = ['appointments', 'sales', 'lab_test_results', 'appointment_services', 'department_services', 'departments'];
foreach ($tables as $table) {
    $result = $conn->query("SELECT COUNT(*) as cnt FROM $table");
    $row = $result->fetch_assoc();
    echo "$table: " . $row['cnt'] . "\n";
}

// Check appointment_date range
$result = $conn->query("SELECT MIN(appointment_date) as min_date, MAX(appointment_date) as max_date FROM appointments");
$row = $result->fetch_assoc();
echo "\nAppointment dates: " . ($row['min_date'] ?? 'null') . " to " . ($row['max_date'] ?? 'null') . "\n";

// Check sales created_at range
$result = $conn->query("SELECT MIN(created_at) as min_date, MAX(created_at) as max_date FROM sales");
$row = $result->fetch_assoc();
echo "Sales dates: " . ($row['min_date'] ?? 'null') . " to " . ($row['max_date'] ?? 'null') . "\n";

// Check lab_test_results performed_at range
$result = $conn->query("SELECT MIN(performed_at) as min_date, MAX(performed_at) as max_date FROM lab_test_results");
$row = $result->fetch_assoc();
echo "Lab test results dates: " . ($row['min_date'] ?? 'null') . " to " . ($row['max_date'] ?? 'null') . "\n";

// Now check revenue for the time range
$start = '2026-02-27 14:44:16';
$end = '2026-02-28 01:46:31';

echo "\n=== Revenue for time range: $start to $end ===\n";

// 1. APPOINTMENTS REVENUE
$sql = "SELECT 
    COUNT(*) as count,
    SUM(COALESCE(fee, 0) - COALESCE(discount, 0)) as revenue
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND appointment_date BETWEEN '$start' AND '$end'
AND (department_id IS NULL OR department_id NOT IN (
    SELECT id FROM departments WHERE name = 'Laboratory'
))
AND id NOT IN (
    SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL
)";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "1. Appointments Revenue (no services, non-Lab): " . ($row['revenue'] ?? 0) . " (count: " . ($row['count'] ?? 0) . ")\n";

// 2. PHARMACY REVENUE
$sql = "SELECT COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as count 
FROM sales 
WHERE status = 'completed' 
AND created_at BETWEEN '$start' AND '$end'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "2. Pharmacy Revenue: " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

// 3. LABORATORY REVENUE (lab_test_results)
$sql = "SELECT COALESCE(SUM(lt.cost), 0) as revenue, COUNT(*) as count
FROM lab_test_results ltr
JOIN lab_tests lt ON ltr.test_id = lt.id
WHERE (ltr.performed_at BETWEEN '$start' AND '$end')
   OR (ltr.performed_at IS NULL AND ltr.status IN ('completed', 'verified'))";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "3. Lab Test Results Revenue: " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

// 4. LAB SERVICES FROM APPOINTMENTS
$sql = "SELECT COALESCE(SUM(asv.final_cost), 0) as revenue, COUNT(*) as count
FROM appointment_services asv
JOIN appointments a ON asv.appointment_id = a.id
JOIN department_services ds ON asv.department_service_id = ds.id
JOIN departments d ON ds.department_id = d.id
WHERE a.status IN ('completed', 'confirmed')
AND d.name = 'Laboratory'
AND a.appointment_date BETWEEN '$start' AND '$end'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "4. Lab Services Revenue (from appointments): " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

// 5. LAB DEPARTMENT APPOINTMENTS (direct fees)
$sql = "SELECT 
    COUNT(*) as count,
    SUM(COALESCE(fee, 0) - COALESCE(discount, 0)) as revenue
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND appointment_date BETWEEN '$start' AND '$end'
AND department_id IN (SELECT id FROM departments WHERE name = 'Laboratory')
AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "5. Lab Department Appointments Revenue: " . ($row['revenue'] ?? 0) . " (count: " . ($row['count'] ?? 0) . ")\n";

// 6. DEPARTMENT REVENUE (non-Lab services)
$sql = "SELECT COALESCE(SUM(asv.final_cost), 0) as revenue, COUNT(*) as count
FROM appointment_services asv
JOIN appointments a ON asv.appointment_id = a.id
JOIN department_services ds ON asv.department_service_id = ds.id
JOIN departments d ON ds.department_id = d.id
WHERE a.status IN ('completed', 'confirmed')
AND d.name != 'Laboratory'
AND a.appointment_date BETWEEN '$start' AND '$end'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "6. Department Revenue (non-Lab): " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

$output = ob_get_clean();
file_put_contents('debug_output.txt', $output);
echo $output;

$conn->close();
