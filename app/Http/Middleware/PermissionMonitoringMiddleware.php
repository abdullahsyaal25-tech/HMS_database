<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Services\PermissionMonitoringService;
use App\Services\PermissionAlertService;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permission Monitoring Middleware - DEACTIVATED
 * 
 * This middleware has been deactivated as part of RBAC cleanup.
 * It now just passes through requests without any monitoring.
 * 
 * @deprecated This middleware is no longer in use
 */
class PermissionMonitoringMiddleware
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
