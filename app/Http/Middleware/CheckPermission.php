<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permission): Response
    {
        // DEBUG: Enhanced logging for 403 diagnosis
        $requestId = uniqid('req_', true);
        Log::debug("[{$requestId}] Permission middleware ENTRY", [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'permission_required' => $permission,
            'user_authenticated' => Auth::check(),
            'has_valid_sanctum_token' => $request->user() !== null,
            'x_inertia_header' => $request->header('X-Inertia'),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
        ]);
        
        if (!Auth::check()) {
            Log::warning("[{$requestId}] Permission check FAILED - user not authenticated");
            
            if ($request->is('api/*') || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Authentication required',
                    'debug_request_id' => $requestId,
                ], 403);
            }
            
            return redirect()->route('login');
        }
        
        $user = Auth::user();
        
        // DEBUG: Log user details
        Log::debug("[{$requestId}] User authenticated", [
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'is_super_admin' => $user->isSuperAdmin(),
        ]);

        // Enhanced diagnostic logging
        $isSuperAdmin = $user->isSuperAdmin();
        $roleId = $user->role_id;
        $roleModel = $user->roleModel;
        $effectiveRoleName = $roleModel ? $roleModel->name : 'null';
        $effectiveRoleSlug = $roleModel ? $roleModel->slug : 'null';
        
        Log::debug('Checking user permission - detailed', [
            'user_id' => $user->id,
            'user' => $user->username,
            'role_string' => $user->role,
            'role_id' => $roleId,
            'role_model_name' => $effectiveRoleName,
            'role_model_slug' => $effectiveRoleSlug,
            'is_super_admin' => $isSuperAdmin,
            'permission_required' => $permission,
        ]);

        // Super Admin bypass check
        if ($isSuperAdmin) {
            Log::debug("[{$requestId}] Permission check PASSED - Super Admin bypass");
            return $next($request);
        }
        
        // Check permission with detailed breakdown
        $hasPermission = $user->hasPermission($permission);
        
        // DEBUG: Log permission check result
        $effectivePermissions = $user->getEffectivePermissions();
        Log::debug("[{$requestId}] Permission check result", [
            'permission_required' => $permission,
            'has_permission' => $hasPermission,
            'effective_permissions_count' => count($effectivePermissions),
            'effective_permissions' => $effectivePermissions,
        ]);
        
        // If permission denied, do detailed investigation
        if (!$hasPermission) {
            // Check user-specific override
            $userPermission = $user->userPermissions()
                ->whereHas('permission', fn($q) => $q->where('name', $permission))
                ->first();
            
            // Check normalized role permissions
            $hasNormalizedRolePermission = false;
            if ($roleModel) {
                $hasNormalizedRolePermission = $roleModel->permissions()
                    ->where('name', $permission)
                    ->exists();
            }
            
            // Check legacy role permissions
            $hasLegacyRolePermission = \App\Models\RolePermission::where('role', $user->role)
                ->whereHas('permission', fn($q) => $q->where('name', $permission))
                ->exists();
            
            // Check temporary permissions
            $hasTemporaryPermission = $user->temporaryPermissions()
                ->active()
                ->whereHas('permission', fn($q) => $q->where('name', $permission))
                ->exists();
            
            Log::warning('Permission denied - detailed breakdown', [
                'user_id' => $user->id,
                'user' => $user->username,
                'role_string' => $user->role,
                'role_id' => $roleId,
                'role_model_name' => $effectiveRoleName,
                'role_model_slug' => $effectiveRoleSlug,
                'permission_required' => $permission,
                'user_specific_override' => $userPermission ? ($userPermission->allowed ? 'ALLOWED' : 'DENIED') : 'NOT_SET',
                'normalized_role_permission' => $hasNormalizedRolePermission ? 'YES' : 'NO',
                'legacy_role_permission' => $hasLegacyRolePermission ? 'YES' : 'NO',
                'temporary_permission' => $hasTemporaryPermission ? 'YES' : 'NO',
                'url' => $request->fullUrl(),
            ]);
        }
                
        if (!$hasPermission) {
            Log::warning('Permission denied - final', [
                'user' => $user->username,
                'role' => $user->role,
                'permission_required' => $permission,
                'url' => $request->fullUrl(),
            ]);
                    
            if (request()->is('api/*')) {
                return response()->json(['message' => 'Unauthorized access'], 403);
            }
                        
            // Check if request is from Inertia (AJAX/XHR request)
            if ($request->header('X-Inertia')) {
                // For Inertia requests, we need to return a response that Inertia can handle
                // Inertia will interpret the 403 status code and show an appropriate error
                abort(403, 'You do not have permission to access this page.');
            }
                        
            // For regular web requests, redirect back with error
            return back()->with('error', 'You do not have permission to access this page.');
        }
                
        Log::debug('Permission granted', [
            'user' => $user->username,
            'role' => $user->role,
            'permission_required' => $permission,
        ]);
        
        return $next($request);
    }
}
