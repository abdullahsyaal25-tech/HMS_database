<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\LabTestResult;
use App\Models\Sale;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Generate patient report
     */
    public function patientReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }
        
        $patients = Patient::with('appointments')->get();
        
        $pdf = Pdf::loadView('reports.patient-report', compact('patients'));
        return $pdf->download('patient-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate doctor report
     */
    public function doctorReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }
        
        $doctors = Doctor::with('appointments')->get();
        
        $pdf = Pdf::loadView('reports.doctor-report', compact('doctors'));
        return $pdf->download('doctor-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate appointment report
     */
    public function appointmentReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }
        
        $appointments = Appointment::with('patient', 'doctor')->get();
        
        $pdf = Pdf::loadView('reports.appointment-report', compact('appointments'));
        return $pdf->download('appointment-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate billing report
     */
    public function billingReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }
        
        $bills = Bill::with('patient', 'items')->get();
        
        $pdf = Pdf::loadView('reports.billing-report', compact('bills'));
        return $pdf->download('billing-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate pharmacy sales report
     */
    public function pharmacySalesReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $sales = Sale::with('items.medicine', 'user')->get();
        
        $pdf = Pdf::loadView('reports.pharmacy-sales-report', compact('sales'));
        return $pdf->download('pharmacy-sales-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate lab test report
     */
    public function labTestReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResults = LabTestResult::with('labTest', 'patient')->get();
        
        $pdf = Pdf::loadView('reports.lab-test-report', compact('labTestResults'));
        return $pdf->download('lab-test-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Show report dashboard
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }
        
        return Inertia::render('Reports/Index');
    }
}