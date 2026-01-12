<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\User;
use App\Models\BillItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class BillController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $bills = Bill::with('patient', 'doctor', 'createdBy')->paginate(10);
        return Inertia::render('Billing/Index', [
            'bills' => $bills
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $patients = Patient::all();
        $doctors = Doctor::all();
        $users = User::all();
        return Inertia::render('Billing/Create', [
            'patients' => $patients,
            'doctors' => $doctors,
            'users' => $users
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
            'created_by' => 'required|exists:users,id',
            'bill_date' => 'required|date',
            'sub_total' => 'required|numeric|min:0',
            'discount' => 'required|numeric|min:0',
            'tax' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,partial,paid,cancelled',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            // Calculate total amount
            $totalAmount = $request->sub_total + $request->tax - $request->discount;
            $amountDue = $totalAmount - $request->amount_paid;

            $bill = Bill::create([
                'bill_number' => 'BILL' . date('Y') . str_pad(Bill::count() + 1, 5, '0', STR_PAD_LEFT),
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'created_by' => $request->created_by,
                'bill_date' => $request->bill_date,
                'sub_total' => $request->sub_total,
                'discount' => $request->discount,
                'tax' => $request->tax,
                'total_amount' => $totalAmount,
                'amount_paid' => $request->amount_paid,
                'amount_due' => $amountDue,
                'payment_status' => $request->payment_status,
                'notes' => $request->notes,
            ]);

            DB::commit();

            return redirect()->route('billing.index')->with('success', 'Bill created successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create bill: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $bill = Bill::with('patient', 'doctor', 'createdBy', 'items')->findOrFail($id);
        return Inertia::render('Billing/Show', [
            'bill' => $bill
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $bill = Bill::with('patient', 'doctor', 'createdBy')->findOrFail($id);
        $patients = Patient::all();
        $doctors = Doctor::all();
        $users = User::all();
        return Inertia::render('Billing/Edit', [
            'bill' => $bill,
            'patients' => $patients,
            'doctors' => $doctors,
            'users' => $users
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
            'created_by' => 'required|exists:users,id',
            'bill_date' => 'required|date',
            'sub_total' => 'required|numeric|min:0',
            'discount' => 'required|numeric|min:0',
            'tax' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
            'payment_status' => 'required|in:pending,partial,paid,cancelled',
            'notes' => 'nullable|string',
        ]);

        $bill = Bill::findOrFail($id);

        // Calculate total amount
        $totalAmount = $request->sub_total + $request->tax - $request->discount;
        $amountDue = $totalAmount - $request->amount_paid;

        $bill->update([
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'created_by' => $request->created_by,
            'bill_date' => $request->bill_date,
            'sub_total' => $request->sub_total,
            'discount' => $request->discount,
            'tax' => $request->tax,
            'total_amount' => $totalAmount,
            'amount_paid' => $request->amount_paid,
            'amount_due' => $amountDue,
            'payment_status' => $request->payment_status,
            'notes' => $request->notes,
        ]);

        return redirect()->route('billing.index')->with('success', 'Bill updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $bill = Bill::findOrFail($id);

        DB::beginTransaction();
        try {
            $bill->delete();
            DB::commit();
            return redirect()->route('billing.index')->with('success', 'Bill deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete bill: ' . $e->getMessage()]);
        }
    }
}
