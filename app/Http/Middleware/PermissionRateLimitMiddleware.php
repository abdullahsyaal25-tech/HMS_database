<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PermissionRateLimitMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        $key = "permission_changes:{$user->id}";

        // Different rate limits for different operations
        $maxAttempts = $this->getRateLimitForAction($request);
        $decayMinutes = 15; // 15 minute window

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            $seconds = RateLimiter::availableIn($key);

            // Log rate limit violation
            \Illuminate\Support\Facades\Log::warning('Rate limit exceeded for permission changes', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
                'action' => $this->getActionType($request),
                'retry_after_seconds' => $seconds,
            ]);

            return response()->json([
                'error' => 'Too many permission change attempts. Please try again later.',
                'retry_after_seconds' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, $decayMinutes * 60); // Convert minutes to seconds

        return $next($request);
    }

    /**
     * Get rate limit based on the type of permission action.
     */
    private function getRateLimitForAction(Request $request): int
    {
        $action = $this->getActionType($request);

        // Stricter limits for more sensitive operations
        switch ($action) {
            case 'grant_temporary_permission':
                return 10; // 10 grants per 15 minutes
            case 'revoke_temporary_permission':
                return 20; // 20 revokes per 15 minutes
            case 'approve_permission_change_request':
                return 50; // 50 approvals per 15 minutes
            case 'create_permission_change_request':
                return 5; // 5 requests per 15 minutes
            case 'update_user_permissions':
                return 10; // 10 user updates per 15 minutes
            case 'update_role_permissions':
                return 5; // 5 role updates per 15 minutes
            default:
                return 30; // Default 30 actions per 15 minutes
        }
    }

    /**
     * Determine the action type from the request.
     */
    private function getActionType(Request $request): string
    {
        $path = $request->path();
        $method = $request->method();

        if (str_contains($path, 'grant-temporary')) {
            return 'grant_temporary_permission';
        }

        if (str_contains($path, 'revoke-temporary')) {
            return 'revoke_temporary_permission';
        }

        if (str_contains($path, 'change-requests') && $method === 'POST') {
            return 'create_permission_change_request';
        }

        if (str_contains($path, 'change-requests') && str_contains($path, 'approve')) {
            return 'approve_permission_change_request';
        }

        if (str_contains($path, 'users') && str_contains($path, 'permissions') && $method === 'PUT') {
            return 'update_user_permissions';
        }

        if (str_contains($path, 'roles') && str_contains($path, 'permissions') && $method === 'PUT') {
            return 'update_role_permissions';
        }

        return 'permission_management_action';
    }
}
