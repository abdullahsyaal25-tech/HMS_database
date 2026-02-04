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
        // Only add auth data for authenticated users making Inertia requests
        if ($request->user()) {
            $user = $request->user();
            
            // Share auth data with Inertia
            Inertia::share([
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'email' => $user->email,
                        'role' => $user->role,
                        'role_id' => $user->role_id,
                    ],
                ],
            ]);
        }

        return $next($request);
    }
}