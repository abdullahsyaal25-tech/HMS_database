<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\PermissionIpRestriction;
use Symfony\Component\HttpFoundation\Response;

class PermissionIpRestrictionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply restrictions to authenticated users
        if (!Auth::check()) {
            return $next($request);
        }

        // Only restrict permission management routes
        if (!$this->isPermissionManagementRoute($request)) {
            return $next($request);
        }

        $clientIp = $request->ip();

        // Check if IP is allowed
        if (!PermissionIpRestriction::isIpAllowed($clientIp)) {
            // Log the attempt
            \Illuminate\Support\Facades\Log::warning('Permission management access denied from IP', [
                'ip' => $clientIp,
                'user_id' => Auth::id(),
                'user_email' => Auth::user()->email,
                'url' => $request->fullUrl(),
                'user_agent' => $request->userAgent(),
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Access denied from this IP address. Please contact your administrator.'
                ], 403);
            }

            abort(403, 'Access denied from this IP address. Please contact your administrator.');
        }

        return $next($request);
    }

    /**
     * Check if the current route is a permission management route.
     */
    private function isPermissionManagementRoute(Request $request): bool
    {
        $path = $request->path();

        // Define permission management routes that should be restricted
        $permissionRoutes = [
            'admin/permissions',
            'admin/users',
            'api/admin/permissions',
            'api/admin/users',
        ];

        foreach ($permissionRoutes as $route) {
            if (str_contains($path, $route)) {
                return true;
            }
        }

        return false;
    }
}
