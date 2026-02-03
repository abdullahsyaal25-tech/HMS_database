<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AddUserPermissionsToInertia
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only add permissions for authenticated users making Inertia requests
        if ($request->user() && $request->header('X-Inertia')) {
            $user = $request->user();
            
            // Get user's effective permissions
            $permissions = $user->getEffectivePermissions();
            
            // Share permissions with Inertia
            Inertia::share([
                'auth' => function () use ($user, $permissions) {
                    return array_merge(session('inertia_auth', []), [
                        'user' => array_merge($user->toArray(), [
                            'permissions' => $permissions,
                        ]),
                    ]);
                },
            ]);
        }

        return $next($request);
    }
}