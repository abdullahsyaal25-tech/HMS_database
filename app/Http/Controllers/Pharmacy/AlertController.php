<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\MedicineAlert;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AlertController extends Controller
{
    /**
     * Display a listing of the alerts.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $alerts = MedicineAlert::with('medicine')->latest()->paginate(10);
        
        return Inertia::render('Pharmacy/Alerts/Index', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Display a listing of pending alerts.
     */
    public function pending(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $alerts = MedicineAlert::with('medicine')
                    ->where('status', 'pending')
                    ->latest()
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Alerts/Pending', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Display a listing of resolved alerts.
     */
    public function resolved(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $alerts = MedicineAlert::with('medicine')
                    ->where('status', 'resolved')
                    ->latest()
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Alerts/Resolved', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Update the status of an alert.
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $alert = MedicineAlert::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:pending,resolved',
        ]);
        
        $alert->update(['status' => $request->status]);
        
        return redirect()->back()->withErrors(['success' => 'Alert status updated successfully.']);
    }

    /**
     * Manually trigger expiry alert check.
     */
    public function triggerCheck()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // For now, just redirect back with a message
        // In a real implementation, we would dispatch the command
        return redirect()->back()->withErrors(['success' => 'Expiry alert check would be triggered in a real implementation. In production, this runs as a scheduled task.']);
    }
}