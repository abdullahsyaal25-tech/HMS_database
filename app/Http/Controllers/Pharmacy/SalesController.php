<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class SalesController extends Controller
{
    /**
     * Display a listing of the sales.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $sales = Sale::with('items.medicine', 'user')->latest()->paginate(10);
        
        return Inertia::render('Pharmacy/Sales/Index', [
            'sales' => $sales
        ]);
    }

    /**
     * Show the form for creating a new sale.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)->get();
        
        return Inertia::render('Pharmacy/Sales/Create', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Store a newly created sale in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        // Check if all requested quantities are available in stock
        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            if (!$medicine || $medicine->stock_quantity < $item['quantity']) {
                return redirect()->back()->withErrors(['error' => 'Not enough stock for ' . $medicine->name])->withInput();
            }
        }
        
        // Create the sale
        $sale = Sale::create([
            'user_id' => $user->id,
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'total_amount' => collect($items)->sum(function($item) {
                return $item['quantity'] * $item['price'];
            }),
        ]);
        
        // Process each item in the sale
        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            
            // Create the sales item
            SalesItem::create([
                'sale_id' => $sale->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'total' => $item['quantity'] * $item['price'],
            ]);
            
            // Update the medicine stock
            $medicine->decrement('stock_quantity', $item['quantity']);
        }
        
        return redirect()->route('pharmacy.sales.index')->with('success', 'Sale created successfully.');
    }

    /**
     * Display the specified sale.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with('items.medicine', 'user')->findOrFail($id);
        
        return Inertia::render('Pharmacy/Sales/Show', [
            'sale' => $sale
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
     * Search sales by customer name or date.
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
        
        $salesQuery = Sale::with('items.medicine', 'user');
        
        if ($query) {
            $salesQuery->where('customer_name', 'like', '%' . $query . '%')
                      ->orWhere('customer_phone', 'like', '%' . $query . '%');
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
            'endDate' => $endDate
        ]);
    }

    /**
     * Get medicines for sale with their current prices.
     */
    public function getMedicinesForSale()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)
                    ->select('id', 'name', 'price', 'stock_quantity', 'unit')
                    ->get();
        
        return response()->json($medicines);
    }
}