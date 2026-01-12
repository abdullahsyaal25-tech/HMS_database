<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        
        $user = Auth::user();
        
        // Redirect based on user permissions and role
        if ($user->isSuperAdmin()) {
            // Super admin (Hospital Admin) goes to main dashboard
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        } elseif ($user->hasPermission('view-pharmacy')) {
            // Sub-admin with pharmacy permissions
            return redirect()->intended('/pharmacy/medicines');
        } elseif ($user->hasPermission('view-laboratory')) {
            // Sub-admin with laboratory permissions
            return redirect()->intended('/laboratory/lab-tests');
        } elseif ($user->hasPermission('view-appointments')) {
            // Sub-admin with appointments permissions
            return redirect()->intended('/appointments');
        } elseif ($user->hasPermission('view-billing')) {
            // Sub-admin with billing permissions
            return redirect()->intended('/billing');
        } elseif ($user->hasPermission('view-dashboard')) {
            // Any user with dashboard permission
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        } else {
            // Default fallback for users without specific permissions
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}