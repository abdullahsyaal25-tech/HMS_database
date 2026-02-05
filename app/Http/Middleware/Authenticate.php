<?php

namespace App\Http\Middleware;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        if (!$request->expectsJson()) {
            return route('login');
        }
        return null;
    }

    /**
     * Handle an unauthenticated user.
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        Log::warning('[Authenticate] User unauthenticated:', [
            'url' => $request->fullUrl(),
            'message' => $exception->getMessage(),
        ]);

        // Check if it's an Inertia request
        if ($request->header('X-Inertia')) {
            return response()->json([
                'component' => 'Login',
                'props' => [
                    'error' => 'Your session has expired. Please log in again.',
                    'reason' => 'session_expired',
                    'redirect' => route('login'),
                ],
            ], 401);
        }

        // For API requests, return JSON
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'message' => 'Unauthenticated',
                'reason' => 'session_not_found',
            ], 401);
        }

        // Redirect to login for regular requests
        return redirect()->route('login')
            ->with('error', 'Your session has expired. Please log in again.');
    }
}
