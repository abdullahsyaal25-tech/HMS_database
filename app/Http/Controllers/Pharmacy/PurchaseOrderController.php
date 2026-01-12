<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the purchase orders.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $purchaseOrders = PurchaseOrder::with('items.medicine', 'supplier', 'user')->latest()->paginate(10);
        
        return Inertia::render('Pharmacy/PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders
        ]);
    }

    /**
     * Show the form for creating a new purchase order.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $suppliers = Supplier::all();
        $medicines = Medicine::all();
        
        return Inertia::render('Pharmacy/PurchaseOrders/Create', [
            'suppliers' => $suppliers,
            'medicines' => $medicines
        ]);
    }

    /**
     * Store a newly created purchase order in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'required|date',
            'items.*.batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        // Create the purchase order
        $purchaseOrder = PurchaseOrder::create([
            'user_id' => $user->id,
            'supplier_id' => $request->supplier_id,
            'order_date' => $request->order_date,
            'expected_delivery_date' => $request->expected_delivery_date,
            'status' => 'pending', // Default status
            'total_amount' => collect($items)->sum(function($item) {
                return $item['quantity'] * $item['unit_price'];
            }),
        ]);
        
        // Process each item in the purchase order
        foreach ($items as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'],
                'batch_number' => $item['batch_number'],
            ]);
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order created successfully.');
    }

    /**
     * Display the specified purchase order.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $purchaseOrder = PurchaseOrder::with('items.medicine', 'supplier', 'user')->findOrFail($id);
        
        return Inertia::render('Pharmacy/PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Purchase orders should not be editable after creation to maintain transaction integrity
        // Only allow editing if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::with('items.medicine', 'supplier', 'user')->findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot edit purchase order that is not in pending status');
        }
        
        $suppliers = Supplier::all();
        $medicines = Medicine::all();
        
        return Inertia::render('Pharmacy/PurchaseOrders/Edit', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => $suppliers,
            'medicines' => $medicines
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Only allow updating if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot update purchase order that is not in pending status');
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'required|date',
            'items.*.batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        // Update the purchase order
        $purchaseOrder->update([
            'supplier_id' => $request->supplier_id,
            'order_date' => $request->order_date,
            'expected_delivery_date' => $request->expected_delivery_date,
            'total_amount' => collect($items)->sum(function($item) {
                return $item['quantity'] * $item['unit_price'];
            }),
        ]);
        
        // Delete existing items
        $purchaseOrder->items()->delete();
        
        // Create new items
        foreach ($items as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'],
                'batch_number' => $item['batch_number'],
            ]);
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Only allow deleting if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot delete purchase order that is not in pending status');
        }
        
        $purchaseOrder->delete();
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order deleted successfully.');
    }

    /**
     * Update the status of a purchase order.
     */
    public function updateStatus(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,received,cancelled',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        // Update status
        $purchaseOrder->update(['status' => $request->status]);
        
        // If status is 'received', update medicine stock
        if ($request->status === 'received') {
            foreach ($purchaseOrder->items as $item) {
                $medicine = Medicine::find($item->medicine_id);
                if ($medicine) {
                    // Add quantity to existing stock
                    $medicine->increment('stock_quantity', $item->quantity);
                    
                    // Update expiry date and batch number with the latest values from the purchase order
                    $medicine->update([
                        'expiry_date' => $item->expiry_date,
                        'batch_number' => $item->batch_number,
                    ]);
                }
            }
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order status updated successfully.');
    }

    /**
     * Search purchase orders by supplier or date.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = $request->input('query');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $status = $request->input('status');
        
        $purchaseOrdersQuery = PurchaseOrder::with('items.medicine', 'supplier', 'user');
        
        if ($query) {
            $purchaseOrdersQuery->whereHas('supplier', function($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('contact_person', 'like', '%' . $query . '%')
                  ->orWhere('phone', 'like', '%' . $query . '%');
            });
        }
        
        if ($startDate) {
            $purchaseOrdersQuery->whereDate('order_date', '>=', $startDate);
        }
        
        if ($endDate) {
            $purchaseOrdersQuery->whereDate('order_date', '<=', $endDate);
        }
        
        if ($status) {
            $purchaseOrdersQuery->where('status', $status);
        }
        
        $purchaseOrders = $purchaseOrdersQuery->latest()->paginate(10);
        
        $statuses = ['pending', 'confirmed', 'received', 'cancelled'];
        
        return Inertia::render('Pharmacy/PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'query' => $query,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'status' => $status,
            'statuses' => $statuses
        ]);
    }
}