<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use App\Models\PermissionSession;
use App\Models\PermissionSessionAction;
use Symfony\Component\HttpFoundation\Response;

class PermissionSessionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only track sessions for authenticated users
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();

        // Only track permission management routes
        if (!$this->isPermissionManagementRoute($request)) {
            return $next($request);
        }

        // Get or create active session for this user
        $activeSession = PermissionSession::active()
            ->where('user_id', $user->id)
            ->first();

        if (!$activeSession) {
            // Create new session
            $activeSession = PermissionSession::create([
                'user_id' => $user->id,
                'started_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => [
                    'initial_url' => $request->fullUrl(),
                    'method' => $request->method(),
                ],
            ]);

            // Store session ID in the user's session for easy access
            Session::put('permission_session_id', $activeSession->id);
        } else {
            // Update session metadata if needed
            Session::put('permission_session_id', $activeSession->id);
        }

        // Add session to request for controllers to use
        $request->merge(['permission_session' => $activeSession]);

        $response = $next($request);

        // Log the action if it was a permission management action
        if ($this->isPermissionAction($request) && $response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $this->logPermissionAction($activeSession, $request, $response);
        }

        // Check if we should end the session (e.g., after logout or timeout)
        if ($this->shouldEndSession($request)) {
            $activeSession->endSession();
            Session::forget('permission_session_id');
        }

        return $response;
    }

    /**
     * Check if the current route is a permission management route.
     */
    private function isPermissionManagementRoute(Request $request): bool
    {
        $path = $request->path();

        // Define permission management routes
        $permissionRoutes = [
            'admin/permissions',
            'admin/users/*/permissions',
            'api/admin/permissions',
            'api/admin/users/*/permissions',
        ];

        foreach ($permissionRoutes as $route) {
            if (str_contains($path, $route)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the current request is performing a permission action.
     */
    private function isPermissionAction(Request $request): bool
    {
        $method = $request->method();
        $path = $request->path();

        // POST, PUT, DELETE methods on permission routes are actions
        if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
            return $this->isPermissionManagementRoute($request);
        }

        // Specific permission actions
        $actionRoutes = [
            'api/admin/permissions/grant-temporary',
            'api/admin/permissions/revoke-temporary',
            'api/admin/permissions/change-requests',
            'api/admin/permissions/change-requests/*/approve',
            'api/admin/permissions/change-requests/*/reject',
        ];

        foreach ($actionRoutes as $route) {
            if (str_contains($path, $route)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log a permission action in the session.
     */
    private function logPermissionAction(PermissionSession $session, Request $request, Response $response): void
    {
        $actionType = $this->determineActionType($request);
        $actionData = $this->extractActionData($request, $response);
        $description = $this->generateActionDescription($request, $actionData);

        $session->logAction($actionType, $actionData, $description);
    }

    /**
     * Determine the type of action being performed.
     */
    private function determineActionType(Request $request): string
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

        if (str_contains($path, 'change-requests') && str_contains($path, 'reject')) {
            return 'reject_permission_change_request';
        }

        if (str_contains($path, 'users') && str_contains($path, 'permissions') && $method === 'PUT') {
            return 'update_user_permissions';
        }

        if (str_contains($path, 'roles') && str_contains($path, 'permissions') && $method === 'PUT') {
            return 'update_role_permissions';
        }

        return 'permission_management_action';
    }

    /**
     * Extract relevant data from the request and response.
     */
    private function extractActionData(Request $request, Response $response): array
    {
        $data = [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'user_id' => Auth::id(),
            'timestamp' => now()->toISOString(),
        ];

        // Add request data (excluding sensitive information)
        if ($request->has('user_id')) {
            $data['target_user_id'] = $request->user_id;
        }

        if ($request->has('permission_id')) {
            $data['permission_id'] = $request->permission_id;
        }

        if ($request->has('permissions')) {
            $data['permissions'] = $request->permissions;
        }

        // Add response status
        $data['response_status'] = $response->getStatusCode();

        return $data;
    }

    /**
     * Generate a human-readable description of the action.
     */
    private function generateActionDescription(Request $request, array $actionData): string
    {
        $user = Auth::user();

        switch ($actionData['action_type'] ?? $this->determineActionType($request)) {
            case 'grant_temporary_permission':
                return "User {$user->name} granted temporary permission";
            case 'revoke_temporary_permission':
                return "User {$user->name} revoked temporary permission";
            case 'create_permission_change_request':
                return "User {$user->name} created permission change request";
            case 'approve_permission_change_request':
                return "User {$user->name} approved permission change request";
            case 'reject_permission_change_request':
                return "User {$user->name} rejected permission change request";
            case 'update_user_permissions':
                return "User {$user->name} updated user permissions";
            case 'update_role_permissions':
                return "User {$user->name} updated role permissions";
            default:
                return "User {$user->name} performed permission management action";
        }
    }

    /**
     * Check if the session should be ended.
     */
    private function shouldEndSession(Request $request): bool
    {
        // End session on logout
        if ($request->route() && $request->route()->getName() === 'logout') {
            return true;
        }

        // Could add timeout logic here in the future
        return false;
    }
}
