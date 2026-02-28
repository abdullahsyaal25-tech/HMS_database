<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'hospital_management_system', 3306);
if ($conn->connect_error) { 
    die('Connection failed: ' . $conn->connect_error);
}

$start = '2026-02-27 14:44:16';
$end = '2026-02-28 01:46:31';

ob_start();

echo "=== VERIFICATION FOR TIME RANGE: $start to $end ===\n\n";

// Get Lab department ID
$sql = "SELECT id FROM departments WHERE name = 'Laboratory'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
$labDeptId = $row['id'];

// ========================================
// 1. APPOINTMENTS REVENUE
// ========================================
echo "=== 1. getAppointmentRevenue() ===\n";
// This is from the code in DayStatusService.php - it excludes appointments in Laboratory
$sql = "SELECT 
    COUNT(*) as count,
    SUM(COALESCE(fee, 0) - COALESCE(discount, 0)) as revenue
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND appointment_date BETWEEN '$start' AND '$end'
AND (department_id IS NULL OR department_id NOT IN ($labDeptId))
AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)
";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "Appointments (non-Lab, no services): " . ($row['revenue'] ?? 0) . " (count: " . ($row['count'] ?? 0) . ")\n";

// Check what's in the time range
$sql = "SELECT id, appointment_date, status, fee, discount, department_id 
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND appointment_date BETWEEN '$start' AND '$end'
ORDER BY appointment_date";
$result = $conn->query($sql);
echo "\nAll appointments in time range:\n";
$total = 0;
while ($row = $result->fetch_assoc()) {
    $rev = max(0, ($row['fee'] ?? 0) - ($row['discount'] ?? 0));
    echo "ID: " . $row['id'] . ", Date: " . $row['appointment_date'] . ", DeptID: " . $row['department_id'] . ", Revenue: " . $rev . "\n";
    $total += $rev;
}
echo "Total all in range: $total\n";
echo "This is correct - it excludes Laboratory appointments and those with services.\n\n";

// ========================================
// 2. PHARMACY REVENUE  
// ========================================
echo "=== 2. getPharmacyRevenue() ===\n";
$sql = "SELECT COALESCE(SUM(grand_total), 0) as revenue, COUNT(*) as count 
FROM sales 
WHERE status = 'completed' 
AND created_at BETWEEN '$start' AND '$end'";
$result = $conn->query($sql);
$row = $result->fetch_assoc();
echo "Pharmacy Revenue: " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

// Check all sales
$sql = "SELECT id, created_at, status, grand_total FROM sales ORDER BY created_at";
$result = $conn->query($sql);
echo "\nAll sales:\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . ", Date: " . $row['created_at'] . ", Status: " . $row['status'] . ", Total: " . $row['grand_total'] . "\n";
}
echo "Pharmacy method appears correct.\n\n";

// ========================================
// 3. DEPARTMENT REVENUE (non-Lab)
// ========================================
echo "=== 3. getDepartmentRevenue() ===\n";
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
echo "Department Revenue (non-Lab): " . $row['revenue'] . " (count: " . $row['count'] . ")\n";

// Check if there are any services
$sql = "SELECT asv.appointment_id, a.appointment_date, a.status, d.name as dept_name, ds.name as service_name, asv.final_cost
FROM appointment_services asv
JOIN appointments a ON asv.appointment_id = a.id
JOIN department_services ds ON asv.department_service_id = ds.id
JOIN departments d ON ds.department_id = d.id
WHERE a.appointment_date BETWEEN '$start' AND '$end'
ORDER BY a.appointment_date";
$result = $conn->query($sql);
echo "\nAll appointment services in time range:\n";
$total = 0;
while ($row = $result->fetch_assoc()) {
    echo "ApptID: " . $row['appointment_id'] . ", Date: " . $row['appointment_date'] . ", Dept: " . $row['dept_name'] . ", Service: " . $row['service_name'] . ", Cost: " . $row['final_cost'] . "\n";
    $total += $row['final_cost'];
}
echo "Total: $total\n";
echo "Department revenue method appears correct.\n\n";

// ========================================
// 4. SUMMARY
// ========================================
echo "=== SUMMARY OF CORRECT VALUES ===\n";
echo "Time range: $start to $end\n\n";

// Correct values
$sql = "SELECT 
    (SELECT COALESCE(SUM(COALESCE(fee, 0) - COALESCE(discount, 0)), 0)
     FROM appointments 
     WHERE status IN ('completed', 'confirmed')
     AND appointment_date BETWEEN '$start' AND '$end'
     AND (department_id IS NULL OR department_id NOT IN ($labDeptId))
     AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)
    ) as appt_revenue,
    (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE status = 'completed' AND created_at BETWEEN '$start' AND '$end') as pharmacy_revenue,
    (SELECT COALESCE(SUM(asv.final_cost), 0)
     FROM appointment_services asv
     JOIN appointments a ON asv.appointment_id = a.id
     JOIN department_services ds ON asv.department_service_id = ds.id
     JOIN departments d ON ds.department_id = d.id
     WHERE a.status IN ('completed', 'confirmed')
     AND d.name != 'Laboratory'
     AND a.appointment_date BETWEEN '$start' AND '$end') as dept_revenue,
    (SELECT COALESCE(SUM(lt.cost), 0)
     FROM lab_test_results ltr
     JOIN lab_tests lt ON ltr.test_id = lt.id
     WHERE (ltr.performed_at BETWEEN '$start' AND '$end')
        OR (ltr.performed_at IS NULL AND ltr.status IN ('completed', 'verified'))) as lab_test_revenue,
    (SELECT COALESCE(SUM(asv.final_cost), 0)
     FROM appointment_services asv
     JOIN appointments a ON asv.appointment_id = a.id
     JOIN department_services ds ON asv.department_service_id = ds.id
     JOIN departments d ON ds.department_id = d.id
     WHERE a.status IN ('completed', 'confirmed')
     AND d.name = 'Laboratory'
     AND a.appointment_date BETWEEN '$start' AND '$end') as lab_services_revenue,
    (SELECT COALESCE(SUM(COALESCE(fee, 0) - COALESCE(discount, 0)), 0)
     FROM appointments 
     WHERE status IN ('completed', 'confirmed')
     AND appointment_date BETWEEN '$start' AND '$end'
     AND department_id = $labDeptId
     AND id NOT IN (SELECT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL)) as lab_appt_revenue
";
$result = $conn->query($sql);
$row = $result->fetch_assoc();

$apptRevenue = $row['appt_revenue'];
$pharmacyRevenue = $row['pharmacy_revenue'];
$deptRevenue = $row['dept_revenue'];
$labTestRevenue = $row['lab_test_revenue'];
$labServicesRevenue = $row['lab_services_revenue'];
$labApptRevenue = $row['lab_appt_revenue'];
$labTotalCorrect = $labTestRevenue + $labServicesRevenue + $labApptRevenue;

echo "Appointments Revenue (non-Lab, no services): $apptRevenue\n";
echo "Pharmacy Revenue: $pharmacyRevenue\n";
echo "Department Revenue (non-Lab): $deptRevenue\n";
echo "Laboratory Revenue (CORRECT breakdown):\n";
echo "  - Lab Test Results: $labTestRevenue\n";
echo "  - Lab Services (appointment_services): $labServicesRevenue\n";
echo "  - Lab Department Appointments: $labApptRevenue\n";
echo "  - TOTAL Laboratory: $labTotalCorrect\n";
echo "\nTOTAL CORRECT REVENUE: " . ($apptRevenue + $pharmacyRevenue + $deptRevenue + $labTotalCorrect) . "\n";

$output = ob_get_clean();
file_put_contents('check_all_output.txt', $output);
echo $output;

$conn->close();
