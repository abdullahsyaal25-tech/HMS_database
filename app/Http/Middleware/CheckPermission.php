<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        // Debug: Log permission check attempt
        \Log::debug('Permission middleware check', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'permission_required' => $permission,
            'user_authenticated' => Auth::check(),
        ]);
        
        if (!Auth::check()) {
            \Log::warning('Permission check failed - user not authenticated', [
                'url' => $request->fullUrl(),
                'permission_required' => $permission,
            ]);
            
            return redirect()->route('login');
        }
        
        $user = Auth::user();
        
        \Log::debug('Checking user permission', [
            'user' => $user->username,
            'role' => $user->role,
            'permission_required' => $permission,
        ]);
        
        if (!$user->hasPermission($permission)) {
            \Log::warning('Permission denied', [
                'user' => $user->username,
                'role' => $user->role,
                'permission_required' => $permission,
                'url' => $request->fullUrl(),
            ]);
            
            if (request()->is('api/*')) {
                return response()->json(['message' => 'Unauthorized access'], 403);
            }
            
            // For web requests, redirect back with error
            return back()->with('error', 'You do not have permission to access this page.');
        }
        
        \Log::debug('Permission granted', [
            'user' => $user->username,
            'role' => $user->role,
            'permission_required' => $permission,
        ]);
        
        return $next($request);
    }
}
