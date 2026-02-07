<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            'full_name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:18|max:100',
            'specialization' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fees' => 'required|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'salary' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'bonus' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'department_id' => 'required|exists:departments,id',
        ]);

        DB::beginTransaction();
        try {
            // Generate a unique username from the doctor's name
            $baseUsername = strtolower(str_replace(' ', '.', $request->full_name));
            $username = $baseUsername;
            $counter = 1;
            
            // Ensure username is unique
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }
            
            // Create a user for the doctor
            $user = User::create([
                'name' => $request->full_name,
                'username' => $username,
                'password' => bcrypt(\Illuminate\Support\Str::random(12)),
                'role' => 'doctor',
            ]);

            // Create doctor record
            $doctor = Doctor::create([
                'doctor_id' => 'D' . date('Y') . str_pad(
                    Doctor::whereYear('created_at', date('Y'))->count() + 1,
                    5, '0', STR_PAD_LEFT
                ),
                'full_name' => $request->full_name,
                'father_name' => $request->father_name,
                'age' => $request->age,
                'specialization' => $request->specialization,
                'phone_number' => $request->phone_number,
                'address' => $request->address,
                'bio' => $request->bio,
                'fees' => $request->fees,
                'salary' => $request->salary ?? 0,
                'bonus' => $request->bonus ?? 0,
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
        \Log::info('[DoctorController] show() called with id: ' . $id);
        try {
            $doctor = Doctor::with('user', 'department')->findOrFail($id);
            \Log::info('[DoctorController] Doctor found: ' . $doctor->full_name);
            return Inertia::render('Doctor/Show', [
                'doctor' => $doctor
            ]);
        } catch (\Exception $e) {
            \Log::error('[DoctorController] Error in show(): ' . $e->getMessage());
            throw $e;
        }
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
            'full_name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:18|max:100',
            'specialization' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fees' => 'required|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'salary' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'bonus' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'department_id' => 'required|exists:departments,id',
        ]);

        $doctor = Doctor::findOrFail($id);
        $user = $doctor->user;

        // Update user information
        $user->update([
            'name' => $request->full_name,
        ]);

        // Update doctor information
        $doctor->update([
            'full_name' => $request->full_name,
            'father_name' => $request->father_name,
            'age' => $request->age,
            'specialization' => $request->specialization,
            'phone_number' => $request->phone_number,
            'address' => $request->address,
            'bio' => $request->bio,
            'fees' => $request->fees,
            'salary' => $request->salary ?? 0,
            'bonus' => $request->bonus ?? 0,
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
