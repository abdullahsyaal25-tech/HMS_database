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
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Medicine::with('category');
        
        // Apply category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        
        // Apply stock status filter
        if ($request->filled('stock_status')) {
            switch ($request->stock_status) {
                case 'in_stock':
                    $query->where('quantity', '>', 10); // More than low stock threshold
                    break;
                case 'low_stock':
                    $query->where('quantity', '<=', 10)
                          ->where('quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('quantity', '<=', 0);
                    break;
            }
        }
        
        // Apply expiry status filter
        if ($request->filled('expiry_status')) {
            $today = now();
            switch ($request->expiry_status) {
                case 'valid':
                    $query->whereDate('expiry_date', '>', $today->copy()->addDays(30));
                    break;
                case 'expiring_soon':
                    $query->whereDate('expiry_date', '>=', $today)
                          ->whereDate('expiry_date', '<=', $today->copy()->addDays(30));
                    break;
                case 'expired':
                    $query->whereDate('expiry_date', '<', $today);
                    break;
            }
        }
        
        // Apply search query
        if ($request->filled('query')) {
            $searchTerm = $request->query;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('medicine_id', 'like', '%' . $searchTerm . '%')
                  ->orWhere('manufacturer', 'like', '%' . $searchTerm . '%')
                  ->orWhere('batch_number', 'like', '%' . $searchTerm . '%');
            });
        }
        
        $medicines = $query->orderBy('name')->paginate(10)->withQueryString();
        $categories = MedicineCategory::orderBy('name')->get();
        
        return Inertia::render('Pharmacy/Medicines/Index', [
            'medicines' => $medicines,
            'categories' => $categories,
            'query' => $request->query('query', ''),
            'category_id' => $request->query('category_id', ''),
            'stock_status' => $request->query('stock_status', ''),
            'expiry_status' => $request->query('expiry_status', ''),
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
            'quantity' => 'required|integer|min:0',
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
        
        // Get recent sales (last 30 days)
        $recentSales = \App\Models\SalesItem::where('medicine_id', $id)
            ->whereHas('sale', function ($q) {
                $q->where('created_at', '>=', now()->subDays(30));
            })
            ->with('sale')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Get stock history - using array for now since model may not exist
        $stockHistory = [];
        
        return Inertia::render('Pharmacy/Medicines/Show', [
            'medicine' => $medicine,
            'recentSales' => $recentSales,
            'stockHistory' => $stockHistory,
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
            'quantity' => 'required|integer|min:0',
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
            'quantity' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $medicine->update([
            'quantity' => $request->quantity,
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
        $medicines = Medicine::where('quantity', '<=', 10)
                    ->where('quantity', '>=', 1) // greater than 0 but less than 10
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
