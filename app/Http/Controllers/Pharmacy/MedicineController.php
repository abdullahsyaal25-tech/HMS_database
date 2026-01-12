<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MedicineController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/Index', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $categories = MedicineCategory::all();
        
        return Inertia::render('Pharmacy/Medicines/Create', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:medicine_categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'manufacturer' => 'nullable|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        Medicine::create($validator->validated());
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicine = Medicine::with('category')->findOrFail($id);
        
        return Inertia::render('Pharmacy/Medicines/Show', [
            'medicine' => $medicine
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicine = Medicine::findOrFail($id);
        $categories = MedicineCategory::all();
        
        return Inertia::render('Pharmacy/Medicines/Edit', [
            'medicine' => $medicine,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicine = Medicine::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:medicine_categories,id',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'manufacturer' => 'nullable|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $medicine->update($validator->validated());
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicine = Medicine::findOrFail($id);
        $medicine->delete();
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine deleted successfully.');
    }

    /**
     * Search medicines by name or other criteria
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = $request->input('query');
        
        $medicines = Medicine::where('name', 'like', '%' . $query . '%')
                    ->orWhere('description', 'like', '%' . $query . '%')
                    ->orWhere('batch_number', 'like', '%' . $query . '%')
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/Index', [
            'medicines' => $medicines,
            'query' => $query
        ]);
    }

    /**
     * Update stock quantity for a medicine
     */
    public function updateStock(Request $request, string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicine = Medicine::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'stock_quantity' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $medicine->update([
            'stock_quantity' => $request->stock_quantity,
            'updated_at' => now(),
        ]);
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Stock updated successfully.');
    }

    /**
     * Get low stock medicines
     */
    public function lowStock(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        // Consider medicines with stock less than 10 as low stock
        $medicines = Medicine::where('stock_quantity', '<=', 10)
                    ->where('stock_quantity', '>=', 1) // greater than 0 but less than 10
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/LowStock', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get expired medicines
     */
    public function expired(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::whereDate('expiry_date', '<', now())
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/Expired', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get medicines about to expire
     */
    public function expiringSoon(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        // Get medicines that expire within the next 30 days
        $medicines = Medicine::whereDate('expiry_date', '>=', now())
                    ->whereDate('expiry_date', '<=', now()->addDays(30))
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/ExpiringSoon', [
            'medicines' => $medicines
        ]);
    }
}
