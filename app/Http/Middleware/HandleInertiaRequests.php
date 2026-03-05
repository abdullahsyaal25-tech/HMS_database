<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        try {
            return parent::version($request);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $userData = null;
        
        // Get the authenticated user
        $user = Auth::user();
        
        // DEBUG: Log auth state
        Log::debug('HandleInertiaRequests: Auth check', [
            'has_user' => !is_null($user),
            'user_id' => $user?->id,
            'user_role' => $user?->role,
            'is_authenticated' => Auth::check(),
            'session_id' => $request->session()->getId(),
        ]);
        
        if ($user) {
            // Load roleModel relationship if not already loaded
            $user->loadMissing('roleModel');
            
            // Get permissions
            $permissions = $this->getUserPermissions($user);
            
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'role_id' => $user->role_id,
                'is_super_admin' => $user->isSuperAdmin(),
                'permissions' => $permissions,
                'roleModel' => $user->roleModel ? [
                    'id' => $user->roleModel->id,
                    'name' => $user->roleModel->name,
                    'slug' => $user->roleModel->slug,
                ] : null,
            ];
        }
        
        // Get flash data
        $flashSuccess = $request->session()->get('success');
        $flashError = $request->session()->get('error');
        $flashMessage = $request->session()->get('message');
        
        $sharedData = [
            'csrf' => [
                'token' => $request->session()->token(),
            ],
            'auth' => [
                'user' => $userData,
            ],
            'sidebarOpen' => $request->cookie('sidebar_state') !== 'false',
            'flash' => [
                'message' => fn () => $flashMessage,
                'error' => fn () => $flashError,
                'success' => fn () => $flashSuccess,
                'printAppointment' => fn () => $request->session()->get('printAppointment'),
            ],
        ];
        
        // DEBUG: Log shared data
        Log::debug('HandleInertiaRequests: Sharing data', [
            'auth_user_is_null' => is_null($userData),
            'auth_user_id' => $userData['id'] ?? null,
            'auth_user_role' => $userData['role'] ?? null,
            'auth_user_is_super_admin' => $userData['is_super_admin'] ?? null,
        ]);
        
        return array_merge(parent::share($request), $sharedData);
    }
    
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next): \Symfony\Component\HttpFoundation\Response
    {
        // Call parent handle which invokes share() and sets up Inertia properly
        // This is CRITICAL - parent::handle() calls Inertia::share($this->share($request))
        $response = parent::handle($request, $next);
        
        // Add security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // Add CSP header for production
        if (app()->environment('production')) {
            $csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';";
            $response->headers->set('Content-Security-Policy', $csp);
        }
        
        return $response;
    }
    
    private function getUserPermissions($user)
    {
        if (!$user) {
            return [];
        }
        
        $permissions = [];
        
        // Super Admin has all permissions
        if ($user->isSuperAdmin()) {
            $allPermissions = \App\Models\Permission::all();
            foreach ($allPermissions as $permission) {
                $permissions[] = $permission->name;
            }
            return $permissions;
        }
        
        // Check normalized role permissions first (new role_permission_mappings table)
        if ($user->role_id && $user->roleModel) {
            $normalizedRolePermissions = $user->roleModel->permissions()->pluck('name');
            foreach ($normalizedRolePermissions as $permissionName) {
                $permissions[] = $permissionName;
            }
        }
        
        // Fallback: Check legacy role_permissions table for backward compatibility
        $legacyRolePermissions = \App\Models\RolePermission::where('role', $user->role)
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->select('permissions.name')
            ->get();
            
        foreach ($legacyRolePermissions as $permission) {
            if (!in_array($permission->name, $permissions)) {
                $permissions[] = $permission->name;
            }
        }
        
        // Get user-specific permissions (overrides)
        $userPermissions = $user->userPermissions()->with('permission')->get();
        
        foreach ($userPermissions as $userPermission) {
            // Skip if permission relationship is null
            if (!$userPermission->permission) {
                continue;
            }
            
            $permissionName = $userPermission->permission->name;
            
            if ($userPermission->allowed) {
                // Add if allowed
                if (!in_array($permissionName, $permissions)) {
                    $permissions[] = $permissionName;
                }
            } else {
                // Remove if explicitly denied
                $permissions = array_filter($permissions, function($perm) use ($permissionName) {
                    return $perm !== $permissionName;
                });
            }
        }
        
        return $permissions;
    }
}
