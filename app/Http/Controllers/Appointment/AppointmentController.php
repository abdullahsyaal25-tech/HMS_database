<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $appointments = Appointment::with('patient', 'doctor', 'department')->paginate(10);
        return Inertia::render('Appointment/Index', [
            'appointments' => $appointments
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $patients = Patient::all();
        $doctors = Doctor::all();
        $departments = Department::all();
        return Inertia::render('Appointment/Create', [
            'patients' => $patients,
            'doctors' => $doctors,
            'departments' => $departments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
        ]);

        try {
            $appointment = Appointment::create([
                'appointment_id' => 'APPT' . date('Y') . str_pad(Appointment::count() + 1, 5, '0', STR_PAD_LEFT),
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'department_id' => $request->department_id,
                'appointment_date' => $request->appointment_date,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'fee' => $request->fee,
            ]);

            return redirect()->route('appointments.index')->with('success', 'Appointment created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $appointment = Appointment::with('patient', 'doctor', 'department')->findOrFail($id);
        return Inertia::render('Appointment/Show', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $appointment = Appointment::with('patient', 'doctor', 'department')->findOrFail($id);
        $patients = Patient::all();
        $doctors = Doctor::all();
        $departments = Department::all();
        return Inertia::render('Appointment/Edit', [
            'appointment' => $appointment,
            'patients' => $patients,
            'doctors' => $doctors,
            'departments' => $departments
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'status' => 'required|in:scheduled,completed,cancelled,no_show',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
        ]);

        $appointment = Appointment::findOrFail($id);

        $appointment->update([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'department_id' => $request->department_id,
            'appointment_date' => $request->appointment_date,
            'status' => $request->status,
            'reason' => $request->reason,
            'notes' => $request->notes,
            'fee' => $request->fee,
        ]);

        return redirect()->route('appointments.index')->with('success', 'Appointment updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $appointment = Appointment::findOrFail($id);

        try {
            $appointment->delete();
            return redirect()->route('appointments.index')->with('success', 'Appointment deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
        }
    }
}
