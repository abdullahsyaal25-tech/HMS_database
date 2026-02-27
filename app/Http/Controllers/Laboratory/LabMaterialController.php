<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLabMaterialRequest;
use App\Http\Requests\UpdateLabMaterialRequest;
use App\Models\LabMaterial;
use App\Models\LabTest;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabMaterialController extends Controller
{
    protected AuditLogService $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the lab materials.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        $query = LabMaterial::with(['labTest', 'createdBy']);

        // Apply filters
        if ($request->filled('status')) {
            $status = $request->input('status');
            if (is_string($status) && !empty($status)) {
                $query->byStatus($status);
            }
        }

        if ($request->filled('lab_test_id')) {
            $labTestId = $request->input('lab_test_id');
            if (is_numeric($labTestId)) {
                $query->where('lab_test_id', (int)$labTestId);
            }
        }

        if ($request->filled('stock_status')) {
            $stockStatus = $request->input('stock_status');
            if ($stockStatus === 'low_stock') {
                $query->lowStock();
            } elseif ($stockStatus === 'out_of_stock') {
                $query->outOfStock();
            }
        }

        // Search functionality
        if ($request->filled('query')) {
            $searchTerm = $request->input('query');
            if (is_string($searchTerm) && !empty($searchTerm)) {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('material_id', 'like', "%{$searchTerm}%")
                      ->orWhere('name', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('supplier', 'like', "%{$searchTerm}%")
                      ->orWhereHas('labTest', function ($subQ) use ($searchTerm) {
                          $subQ->where('name', 'like', "%{$searchTerm}%")
                               ->orWhere('test_code', 'like', "%{$searchTerm}%");
                      });
                });
            }
        }

        $labMaterials = $query->latest()->paginate(25)->withQueryString();

        // Get lab tests for filter dropdown
        $labTests = LabTest::select('id', 'test_code', 'name')->orderBy('name')->get();

        return Inertia::render('Laboratory/Materials/Index', [
            'labMaterials' => $labMaterials,
            'filters' => $request->only(['status', 'lab_test_id', 'stock_status', 'query']),
            'labTests' => $labTests,
        ]);
    }

    /**
     * Show the form for creating a new lab material.
     */
    public function create(): Response
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$user->hasPermission('create-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $labTests = LabTest::select('id', 'test_code', 'name')->orderBy('name')->get();

        return Inertia::render('Laboratory/Materials/Create', [
            'labTests' => $labTests,
        ]);
    }

    /**
     * Store a newly created lab material in storage.
     */
    public function store(StoreLabMaterialRequest $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('create-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validated();
        $validated['created_by'] = $user->id;

        $labMaterial = LabMaterial::create($validated);

        // Log the creation
        $this->auditLogService->logCreation(
            'Lab Material',
            "Material ID: {$labMaterial->material_id} - {$labMaterial->name}"
        );

        return redirect()->route('laboratory.materials.index')
            ->with('success', 'Lab material created successfully.');
    }

    /**
     * Display the specified lab material.
     */
    public function show(LabMaterial $labMaterial): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        $labMaterial->load(['labTest', 'createdBy']);

        return Inertia::render('Laboratory/Materials/Show', [
            'labMaterial' => $labMaterial,
        ]);
    }

    /**
     * Show the form for editing the specified lab material.
     */
    public function edit(LabMaterial $labMaterial): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $labMaterial->load(['labTest']);
        $labTests = LabTest::select('id', 'test_code', 'name')->orderBy('name')->get();

        return Inertia::render('Laboratory/Materials/Edit', [
            'labMaterial' => $labMaterial,
            'labTests' => $labTests,
        ]);
    }

    /**
     * Update the specified lab material in storage.
     */
    public function update(UpdateLabMaterialRequest $request, LabMaterial $labMaterial): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validated();
        $labMaterial->update($validated);

        // Log the update
        $this->auditLogService->logUpdate(
            'Lab Material',
            "Material ID: {$labMaterial->material_id}"
        );

        return redirect()->route('laboratory.materials.index')
            ->with('success', 'Lab material updated successfully.');
    }

    /**
     * Remove the specified lab material from storage (soft delete).
     */
    public function destroy(LabMaterial $labMaterial): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('delete-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        // Soft delete
        $labMaterial->delete();

        // Log the deletion
        $this->auditLogService->logDeletion(
            'Lab Material',
            "Material ID: {$labMaterial->material_id}"
        );

        return redirect()->route('laboratory.materials.index')
            ->with('success', 'Lab material deleted successfully.');
    }

    /**
     * Restore a deleted lab material.
     */
    public function restore(LabMaterial $labMaterial): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $labMaterial->restore();

        // Log the restoration
        $this->auditLogService->logActivity(
            'Restore Lab Material',
            'Lab Material',
            "Restored material ID: {$labMaterial->material_id}",
            'info'
        );

        return redirect()->route('laboratory.materials.index')
            ->with('success', 'Lab material restored successfully.');
    }

    /**
     * Update material quantity (add stock).
     */
    public function addStock(Request $request, LabMaterial $labMaterial): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $quantity = $request->input('quantity');
        
        if ($labMaterial->addStock($quantity)) {
            // Log the stock addition
            $this->auditLogService->logActivity(
                'Add Stock',
                'Lab Material',
                "Added {$quantity} units to material {$labMaterial->material_id}. New quantity: {$labMaterial->quantity}",
                'info'
            );

            return redirect()->back()->with('success', 'Stock added successfully.');
        }

        return redirect()->back()->with('error', 'Failed to add stock.');
    }

    /**
     * Remove material quantity (use stock).
     */
    public function removeStock(Request $request, LabMaterial $labMaterial): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $quantity = $request->input('quantity');
        
        if ($labMaterial->removeStock($quantity)) {
            // Log the stock removal
            $this->auditLogService->logActivity(
                'Remove Stock',
                'Lab Material',
                "Removed {$quantity} units from material {$labMaterial->material_id}. New quantity: {$labMaterial->quantity}",
                'info'
            );

            return redirect()->back()->with('success', 'Stock removed successfully.');
        }

        return redirect()->back()->with('error', 'Insufficient stock or failed to remove stock.');
    }

    /**
     * Search lab tests for the searchable dropdown.
     */
    public function searchLabTests(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        $query = $request->input('query', '');
        
        $labTests = LabTest::where('name', 'like', "%{$query}%")
            ->orWhere('test_code', 'like', "%{$query}%")
            ->select('id', 'test_code', 'name')
            ->limit(10)
            ->get();

        return response()->json($labTests);
    }

    /**
     * Get material statistics for dashboard.
     */
    public function getStatistics()
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        $totalMaterials = LabMaterial::count();
        $lowStockCount = LabMaterial::lowStock()->count();
        $outOfStockCount = LabMaterial::outOfStock()->count();
        $activeCount = LabMaterial::where('status', 'active')->count();

        return response()->json([
            'totalMaterials' => $totalMaterials,
            'lowStockCount' => $lowStockCount,
            'outOfStockCount' => $outOfStockCount,
            'activeCount' => $activeCount,
        ]);
    }

    /**
     * Bulk update material status.
     */
    public function bulkUpdateStatus(Request $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-materials')) {
            abort(403, 'Unauthorized access');
        }

        $request->validate([
            'material_ids' => 'required|array',
            'material_ids.*' => 'exists:lab_materials,id',
            'status' => 'required|in:active,low_stock,out_of_stock',
        ]);

        $materialIds = $request->input('material_ids');
        $status = $request->input('status');

        LabMaterial::whereIn('id', $materialIds)->update(['status' => $status]);

        // Log the bulk update
        $this->auditLogService->logActivity(
            'Bulk Update Material Status',
            'Lab Material',
            "Updated status to '{$status}' for " . count($materialIds) . " materials",
            'info'
        );

        return redirect()->back()->with('success', 'Material status updated successfully.');
    }
}
