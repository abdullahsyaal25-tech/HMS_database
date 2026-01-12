<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class StockController extends Controller
{
    /**
     * Display a listing of stock movements.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->paginate(10);
        
        return Inertia::render('Pharmacy/Stock/Index', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Display stock report with detailed movements.
     */
    public function report(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->get();
        
        return Inertia::render('Pharmacy/Stock/Report', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get real-time stock information via API.
     */
    public function getRealTimeStock()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $medicines,
            'timestamp' => now()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * Update stock for multiple medicines.
     */
    public function bulkUpdate(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.new_stock' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            if ($medicine) {
                $medicine->update([
                    'stock_quantity' => $item['new_stock'],
                    'updated_at' => now(),
                ]);
            }
        }
        
        return redirect()->route('pharmacy.stock.index')->with('success', 'Stock updated successfully.');
    }

    /**
     * Get stock alert information.
     */
    public function getAlerts(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Get low stock medicines
        $lowStock = Medicine::where('stock_quantity', '<=', 10)
                    ->where('stock_quantity', '>', 0)
                    ->get();
        
        // Get expired medicines
        $expired = Medicine::whereDate('expiry_date', '<', now())
                    ->get();
        
        // Get medicines expiring soon
        $expiringSoon = Medicine::whereDate('expiry_date', '>=', now())
                        ->whereDate('expiry_date', '<=', now()->addDays(30))
                        ->get();
        
        return Inertia::render('Pharmacy/Stock/Alerts', [
            'lowStock' => $lowStock,
            'expired' => $expired,
            'expiringSoon' => $expiringSoon
        ]);
    }
}