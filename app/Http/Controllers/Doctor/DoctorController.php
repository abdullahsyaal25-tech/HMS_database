<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class DoctorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $doctors = Doctor::with('user', 'department')->paginate(10);
        return Inertia::render('Doctor/Index', [
            'doctors' => $doctors
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $departments = Department::all();
        return Inertia::render('Doctor/Create', [
            'departments' => $departments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
            'department_id' => 'required|exists:departments,id',
        ]);

        DB::beginTransaction();
        try {
            // Create a user for the doctor
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'password' => 'password', // Default password - will be automatically hashed by model cast
                'role' => 'doctor',
            ]);

            // Create doctor record
            $doctor = Doctor::create([
                'doctor_id' => 'D' . date('Y') . str_pad(Doctor::count() + 1, 5, '0', STR_PAD_LEFT),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'specialization' => $request->specialization,
                'phone' => $request->phone,
                'address' => $request->address,
                'bio' => $request->bio,
                'fee' => $request->fee,
                'user_id' => $user->id,
                'department_id' => $request->department_id,
            ]);

            DB::commit();

            return redirect()->route('doctors.index')->with('success', 'Doctor created successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create doctor: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $doctor = Doctor::with('user', 'department')->findOrFail($id);
        return Inertia::render('Doctor/Show', [
            'doctor' => $doctor
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $doctor = Doctor::with('user', 'department')->findOrFail($id);
        $departments = Department::all();
        return Inertia::render('Doctor/Edit', [
            'doctor' => $doctor,
            'departments' => $departments
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'specialization' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
            'department_id' => 'required|exists:departments,id',
        ]);

        $doctor = Doctor::findOrFail($id);
        $user = $doctor->user;

        // Update user information
        $user->update([
            'name' => $request->first_name . ' ' . $request->last_name,
        ]);

        // Update doctor information
        $doctor->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'specialization' => $request->specialization,
            'phone' => $request->phone,
            'address' => $request->address,
            'bio' => $request->bio,
            'fee' => $request->fee,
            'department_id' => $request->department_id,
        ]);

        return redirect()->route('doctors.index')->with('success', 'Doctor updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $doctor = Doctor::findOrFail($id);
        $user = $doctor->user;

        DB::beginTransaction();
        try {
            $doctor->delete();
            $user->delete(); // This will cascade due to foreign key constraint

            DB::commit();
            return redirect()->route('doctors.index')->with('success', 'Doctor deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete doctor: ' . $e->getMessage()]);
        }
    }
}
