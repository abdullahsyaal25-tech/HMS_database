<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\facades\Log;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // DEBUG: Log authentication failure
        $requestId = uniqid('auth_', true);
        Log::debug("[{$requestId}] Authenticate middleware - checking authentication", [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'expects_json' => $request->expectsJson(),
            'has_cookie' => $request->hasCookie('XSRF-TOKEN'),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'has_valid_token' => $request->user() !== null,
        ]);
        
        if ($request->user() === null) {
            Log::warning("[{$requestId}] Authentication FAILED - no valid user found");
            
            // Check if it's an API request
            if ($request->is('api/*') || $request->expectsJson()) {
                Log::debug("[{$requestId}] Returning 403 for API request");
                // Return 403 instead of redirect for API requests
                abort(403, 'Unauthenticated. Please provide a valid API token.');
            }
        }
        
        return $request->expectsJson() ? null : route('login');
    }
}