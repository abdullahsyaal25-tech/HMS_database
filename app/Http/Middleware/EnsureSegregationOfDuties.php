<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use App\Services\RBACService;

/**
 * Ensure Segregation Of Duties - DEACTIVATED
 * 
 * This middleware has been deactivated as part of RBAC cleanup.
 * It now just passes through all requests.
 * 
 * @deprecated This middleware is no longer in use
 */
class EnsureSegregationOfDuties
{
    /**
     * Handle an incoming request.
     * 
     * This middleware is deactivated - it just passes through all requests.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Deactivated - just pass through all requests
        return $next($request);
    }
}
