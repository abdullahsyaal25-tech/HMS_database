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
            
            // Load roleModel to get proper role information
            $user->loadMissing('roleModel');
            
            // Get all permissions - for Super Admin this returns ALL permissions
            $allPermissions = $user->getAllPermissions()->pluck('name')->toArray();
            
            // Share auth data with Inertia
            Inertia::share([
                'auth' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'username' => $user->username,
                        'role' => $user->roleModel?->name ?? $user->role,
                        'role_id' => $user->role_id,
                        'roleModel' => $user->roleModel ? [
                            'slug' => $user->roleModel->slug,
                            'name' => $user->roleModel->name,
                            'priority' => $user->roleModel->priority,
                            'is_system' => $user->roleModel->is_system,
                            'module_access' => $user->roleModel->module_access ?? [],
                        ] : null,
                        'is_super_admin' => $user->isSuperAdmin(),
                        'profile_photo_url' => $user->profile_photo_url,
                        'permissions' => $allPermissions,
                    ],
                ],
            ]);
        }

        return $next($request);
    }
}