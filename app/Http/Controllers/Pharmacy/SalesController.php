<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Medicine;
use App\Models\Patient;
use App\Services\SalesService;
use App\Services\InventoryService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesController extends Controller
{
    protected $salesService;
    protected $inventoryService;
    protected $auditLogService;

    public function __construct(
        SalesService $salesService,
        InventoryService $inventoryService,
        AuditLogService $auditLogService
    ) {
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the sales.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);
        
        // Apply search filter
        if ($request->filled('query')) {
            $searchTerm = $request->query;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('sale_id', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('patient', function ($pq) use ($searchTerm) {
                      $pq->where('first_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('last_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('patient_id', 'like', '%' . $searchTerm . '%');
                  });
            });
        }
        
        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        // Apply payment method filter
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }
        
        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        $sales = $query->latest()->paginate(15)->withQueryString();
        
        // Calculate statistics
        $stats = [
            'total_sales' => Sale::count(),
            'total_revenue' => Sale::where('status', 'completed')->sum('grand_total'),
            'today_sales' => Sale::whereDate('created_at', today())->count(),
            'today_revenue' => Sale::whereDate('created_at', today())->where('status', 'completed')->sum('grand_total'),
        ];
        
        return Inertia::render('Pharmacy/Sales/Index', [
            'sales' => $sales,
            'filters' => [
                'query' => $request->query('query', ''),
                'status' => $request->query('status', ''),
                'payment_method' => $request->query('payment_method', ''),
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new sale.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)
            ->with('category')
            ->get();
        
        $patients = Patient::select('id', 'patient_id', 'first_name', 'last_name', 'phone')
            ->orderBy('first_name')
            ->get();
        
        // Get tax rate from settings (default to 0)
        $taxRate = config('pharmacy.tax_rate', 0);
        
        return Inertia::render('Pharmacy/Sales/Create', [
            'medicines' => $medicines,
            'patients' => $patients,
            'taxRate' => $taxRate,
        ]);
    }

    /**
     * Store a newly created sale in storage.
     */
    public function store(StoreSaleRequest $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $validated = $request->validated();
        
        try {
            DB::beginTransaction();
            
            // Process the sale using SalesService
            $sale = $this->salesService->processSale($validated, $user->id);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Create Sale',
                'Pharmacy',
                "Created sale {$sale->sale_id} for " . ($sale->patient ? $sale->patient->full_name : 'walk-in customer'),
                'info'
            );
            
            DB::commit();
            
            return redirect()->route('pharmacy.sales.show', $sale->id)
                ->with('success', 'Sale completed successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error
            $this->auditLogService->logActivity(
                'Sale Failed',
                'Pharmacy',
                "Failed to create sale: {$e->getMessage()}",
                'error'
            );
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to process sale: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified sale.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        // Build timeline
        $timeline = [];
        
        // Add creation event
        $timeline[] = [
            'id' => 1,
            'action' => 'Sale Created',
            'description' => 'Sale was created and processed',
            'created_at' => $sale->created_at,
            'user' => $sale->soldBy,
        ];
        
        // Add void event if applicable
        if ($sale->status === 'cancelled' || $sale->status === 'refunded') {
            $timeline[] = [
                'id' => 2,
                'action' => 'Sale ' . ucfirst($sale->status),
                'description' => $sale->void_reason ?? 'Sale was ' . $sale->status,
                'created_at' => $sale->updated_at,
                'user' => null,
            ];
        }
        
        return Inertia::render('Pharmacy/Sales/Show', [
            'sale' => $sale,
            'timeline' => $timeline,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Sales should not be deletable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Void a sale with reason and restore stock.
     */
    public function void(Request $request, $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('void-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|min:5|max:500',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }
        
        try {
            DB::beginTransaction();
            
            $sale = Sale::with('items')->findOrFail($id);
            
            // Check if already voided
            if ($sale->status === 'cancelled' || $sale->status === 'refunded') {
                return redirect()->back()->withErrors(['error' => 'Sale is already voided.']);
            }
            
            // Restore stock for each item
            foreach ($sale->items as $item) {
                $this->inventoryService->restoreStock(
                    $item->medicine_id,
                    $item->quantity,
                    'Sale voided: ' . $request->reason,
                    $sale->sale_id
                );
            }
            
            // Update sale status
            $sale->update([
                'status' => 'cancelled',
                'void_reason' => $request->reason,
                'voided_by' => $user->id,
                'voided_at' => now(),
            ]);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Void Sale',
                'Pharmacy',
                "Voided sale {$sale->sale_id}. Reason: {$request->reason}",
                'warning'
            );
            
            DB::commit();
            
            return redirect()->back()->with('success', 'Sale has been voided successfully.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to void sale: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the receipt for a sale.
     */
    public function receipt($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        return Inertia::render('Pharmacy/Sales/Receipt', [
            'sale' => $sale,
        ]);
    }

    /**
     * Generate PDF receipt for download/print.
     */
    public function printReceipt($id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        // For now, return a simple HTML receipt
        // In production, you would use a PDF library like DomPDF or Snappy
        $html = view('pharmacy.sales.receipt', compact('sale'))->render();
        
        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * Export sales to CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Sale::with(['patient', 'soldBy']);
        
        // Apply filters
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        $sales = $query->get();
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="sales_export_' . now()->format('Y-m-d') . '.csv"',
        ];
        
        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            
            // CSV Headers
            fputcsv($file, [
                'Invoice #',
                'Date',
                'Customer',
                'Patient ID',
                'Cashier',
                'Items Count',
                'Subtotal',
                'Discount',
                'Tax',
                'Total',
                'Payment Method',
                'Status',
                'Notes',
            ]);
            
            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->sale_id,
                    $sale->created_at->format('Y-m-d H:i:s'),
                    $sale->patient ? $sale->patient->full_name : 'Walk-in Customer',
                    $sale->patient ? $sale->patient->patient_id : 'N/A',
                    $sale->soldBy->name,
                    $sale->items->count(),
                    $sale->total_amount,
                    $sale->discount,
                    $sale->tax,
                    $sale->grand_total,
                    $sale->payment_method,
                    $sale->status,
                    $sale->notes,
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    /**
     * Search sales by customer name or date.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = $request->input('query');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        
        $salesQuery = Sale::with(['items.medicine', 'patient', 'soldBy']);
        
        if ($query) {
            $salesQuery->where(function ($q) use ($query) {
                $q->where('sale_id', 'like', '%' . $query . '%')
                  ->orWhereHas('patient', function ($pq) use ($query) {
                      $pq->where('first_name', 'like', '%' . $query . '%')
                         ->orWhere('last_name', 'like', '%' . $query . '%');
                  });
            });
        }
        
        if ($startDate) {
            $salesQuery->whereDate('created_at', '>=', $startDate);
        }
        
        if ($endDate) {
            $salesQuery->whereDate('created_at', '<=', $endDate);
        }
        
        $sales = $salesQuery->latest()->paginate(10);
        
        return Inertia::render('Pharmacy/Sales/Index', [
            'sales' => $sales,
            'query' => $query,
            'startDate' => $startDate,
            'endDate' => $endDate,
        ]);
    }

    /**
     * Show the dispense prescription interface.
     */
    public function dispense(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)
            ->with('category')
            ->get();
        
        $patients = Patient::select('id', 'patient_id', 'first_name', 'last_name', 'phone', 'date_of_birth')
            ->orderBy('first_name')
            ->get();
        
        // Get pending prescriptions with their items
        $prescriptions = \App\Models\Prescription::with(['items', 'doctor'])
            ->whereIn('status', ['pending', 'partial'])
            ->latest()
            ->get()
            ->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'prescription_code' => $prescription->prescription_code,
                    'patient_id' => $prescription->patient_id,
                    'doctor_id' => $prescription->doctor_id,
                    'doctor_name' => $prescription->doctor->name ?? 'Unknown',
                    'diagnosis' => $prescription->diagnosis,
                    'notes' => $prescription->notes,
                    'status' => $prescription->status,
                    'created_at' => $prescription->created_at->toISOString(),
                    'items' => $prescription->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'medicine_id' => $item->medicine_id,
                            'medicine_name' => $item->medicine->name ?? 'Unknown',
                            'dosage' => $item->dosage,
                            'frequency' => $item->frequency,
                            'duration' => $item->duration,
                            'quantity' => $item->quantity,
                            'instructions' => $item->instructions,
                            'dispensed_quantity' => $item->dispensed_quantity,
                        ];
                    }),
                ];
            });
        
        // Get tax rate from settings (default to 0)
        $taxRate = config('pharmacy.tax_rate', 0);
        
        return Inertia::render('Pharmacy/Sales/Dispense', [
            'medicines' => $medicines,
            'patients' => $patients,
            'prescriptions' => $prescriptions,
            'taxRate' => $taxRate,
        ]);
    }

    /**
     * Get medicines for sale with their current prices.
     */
    public function getMedicinesForSale()
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)
                    ->select('id', 'name', 'unit_price', 'stock_quantity', 'unit')
                    ->get();
        
        return response()->json($medicines);
    }
}
