<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\PermissionSession;
use App\Models\PermissionSessionAction;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permission Session Middleware - DEACTIVATED
 * 
 * This middleware has been deactivated as part of RBAC cleanup.
 * It now just passes through requests without session tracking.
 * 
 * @deprecated This middleware is no longer in use
 */
class PermissionSessionMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * This middleware is deactivated - it just passes through requests.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Deactivated - just pass through
        return $next($request);
    }
}
