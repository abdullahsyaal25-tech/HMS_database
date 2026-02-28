<?php
$conn = new mysqli('127.0.0.1', 'root', '', 'hospital_management_system', 3306);
if ($conn->connect_error) { 
    die('Connection failed: ' . $conn->connect_error);
}

ob_start();

// Check all appointments around that time range
$sql = "SELECT id, appointment_date, status, fee, discount, department_id 
FROM appointments 
WHERE appointment_date >= '2026-02-27 14:00:00' AND appointment_date <= '2026-02-27 23:59:59'
ORDER BY appointment_date";
$result = $conn->query($sql);
echo "=== Appointments on Feb 27 afternoon/evening ===\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . ", Date: " . $row['appointment_date'] . ", Status: " . $row['status'] . ", Fee: " . ($row['fee'] ?? 0) . ", Discount: " . ($row['discount'] ?? 0) . ", DeptID: " . ($row['department_id'] ?? 'null') . "\n";
}

// Check appointment_services
$sql = "SELECT asv.*, a.appointment_date, a.status, ds.name as service_name, d.name as dept_name
FROM appointment_services asv
JOIN appointments a ON asv.appointment_id = a.id
JOIN department_services ds ON asv.department_service_id = ds.id
JOIN departments d ON ds.department_id = d.id
WHERE a.appointment_date >= '2026-02-27 14:00:00'
ORDER BY a.appointment_date";
$result = $conn->query($sql);
echo "\n=== Appointment services on Feb 27 afternoon ===\n";
while ($row = $result->fetch_assoc()) {
    echo "ApptID: " . $row['appointment_id'] . ", Date: " . $row['appointment_date'] . ", Status: " . $row['status'] . ", Service: " . $row['service_name'] . ", Dept: " . $row['dept_name'] . ", FinalCost: " . $row['final_cost'] . "\n";
}

// Check departments
$sql = "SELECT id, name FROM departments";
$result = $conn->query($sql);
echo "\n=== Departments ===\n";
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . ", Name: " . $row['name'] . "\n";
}

// Check what getAppointmentRevenue would return (Eloquent query as in DayStatusService)
echo "\n=== Simulating getAppointmentRevenue() ===\n";
$start = '2026-02-27 14:44:16';
$end = '2026-02-28 01:46:31';

// First get Lab department IDs
$labDeptIds = [];
$sql = "SELECT id FROM departments WHERE name = 'Laboratory'";
$result = $conn->query($sql);
while ($row = $result->fetch_assoc()) {
    $labDeptIds[] = $row['id'];
}
$labDeptIdsStr = implode(',', $labDeptIds);

// Get appointments with services (IDs)
$appointmentsWithServices = [];
$sql = "SELECT DISTINCT appointment_id FROM appointment_services WHERE appointment_id IS NOT NULL";
$result = $conn->query($sql);
while ($row = $result->fetch_assoc()) {
    $appointmentsWithServices[] = $row['appointment_id'];
}
$withServicesStr = empty($appointmentsWithServices) ? '0' : implode(',', $appointmentsWithServices);

// Query appointments matching getAppointmentRevenue criteria
$sql = "SELECT id, appointment_date, status, fee, discount, department_id 
FROM appointments 
WHERE status IN ('completed', 'confirmed')
AND appointment_date BETWEEN '$start' AND '$end'
AND (department_id IS NULL " . ($labDeptIdsStr ? "OR department_id NOT IN ($labDeptIdsStr)" : "") . ")
AND id NOT IN ($withServicesStr)
ORDER BY appointment_date";
$result = $conn->query($sql);
echo "Appointments matching getAppointmentRevenue criteria:\n";
$totalRevenue = 0;
while ($row = $result->fetch_assoc()) {
    $revenue = max(0, ($row['fee'] ?? 0) - ($row['discount'] ?? 0));
    $totalRevenue += $revenue;
    echo "ID: " . $row['id'] . ", Date: " . $row['appointment_date'] . ", Fee: " . ($row['fee'] ?? 0) . ", Discount: " . ($row['discount'] ?? 0) . ", Revenue: " . $revenue . "\n";
}
echo "Total: " . $totalRevenue . "\n";

// Now check getLaboratoryRevenue query - lab test results
echo "\n=== Simulating getLaboratoryRevenue() - Lab Test Results ===\n";
$sql = "SELECT ltr.id, ltr.test_id, ltr.performed_at, ltr.status, lt.cost, lt.name
FROM lab_test_results ltr
JOIN lab_tests lt ON ltr.test_id = lt.id
WHERE (ltr.performed_at BETWEEN '$start' AND '$end')
   OR (ltr.performed_at IS NULL AND ltr.status IN ('completed', 'verified'))
ORDER BY ltr.performed_at";
$result = $conn->query($sql);
echo "Lab test results:\n";
$total = 0;
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . ", TestID: " . $row['test_id'] . ", Performed: " . ($row['performed_at'] ?? 'NULL') . ", Status: " . $row['status'] . ", Cost: " . $row['cost'] . ", Name: " . $row['name'] . "\n";
    $total += $row['cost'];
}
echo "Total: " . $total . "\n";

$output = ob_get_clean();
file_put_contents('check_output.txt', $output);
echo $output;

$conn->close();
