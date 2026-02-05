<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use App\Services\RBACService;
use App\Services\MfaEnforcementService;
use App\Services\SessionTimeoutService;
use App\Models\PermissionIpRestriction;

class CheckPermission
{
    /**
     * Rate limiting cache key prefix for failed attempts.
     */
    protected string $rateLimitPrefix = 'permission_rate_limit:';

    /**
     * Maximum failed attempts before rate limiting.
     */
    protected int $maxFailedAttempts = 5;

    /**
     * Rate limit duration in minutes.
     */
    protected int $rateLimitDuration = 15;

    /**
     * @var RBACService
     */
    protected RBACService $rbacService;

    /**
     * @var MfaEnforcementService
     */
    protected MfaEnforcementService $mfaService;

    /**
     * @var SessionTimeoutService
     */
    protected SessionTimeoutService $sessionService;

    /**
     * Constructor.
     */
    public function __construct(
        RBACService $rbacService,
        MfaEnforcementService $mfaService,
        SessionTimeoutService $sessionService
    ) {
        $this->rbacService = $rbacService;
        $this->mfaService = $mfaService;
        $this->sessionService = $sessionService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $requestId = uniqid('perm_', true);
        $request->merge(['_request_id' => $requestId]);

        Log::debug("[{$requestId}] Permission middleware ENTRY", [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'permission_required' => $permission,
            'user_authenticated' => Auth::check(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        // 1. Check authentication
        if (!Auth::check()) {
            $this->logAccessAttempt($requestId, 0, $permission, false, [
                'reason' => 'not_authenticated',
                'ip_address' => $request->ip(),
            ]);

            return $this->unauthorizedResponse($request, $requestId, 'Authentication required');
        }

        $user = Auth::user();

        // 2. Check rate limiting for failed attempts
        if ($this->isRateLimited($user->id)) {
            $this->logAccessAttempt($requestId, $user->id, $permission, false, [
                'reason' => 'rate_limited',
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Too many failed attempts. Please try again later.',
                'debug_request_id' => $requestId,
                'retry_after' => $this->getRateLimitRetryAfter($user->id),
            ], 429);
        }

        // 3. Check session timeout
        $sessionValidation = $this->validateSession($request);
        if (!$sessionValidation['valid']) {
            $this->logAccessAttempt($requestId, $user->id, $permission, false, [
                'reason' => 'session_timeout',
                'session_reason' => $sessionValidation['reason'],
                'ip_address' => $request->ip(),
            ]);

            if ($request->is('api/*') || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Session expired',
                    'reason' => $sessionValidation['reason'],
                    'debug_request_id' => $requestId,
                ], 401);
            }

            return redirect()->route('login')->with('error', 'Your session has expired. Please log in again.');
        }

        // 4. Check IP restrictions
        $ipCheck = $this->checkIpRestriction($user, $permission, $request->ip());
        if (!$ipCheck['allowed']) {
            $this->logAccessAttempt($requestId, $user->id, $permission, false, [
                'reason' => 'ip_restriction',
                'ip_address' => $request->ip(),
                'restriction_reason' => $ipCheck['reason'],
            ]);

            return $this->forbiddenResponse($request, $requestId, 'Access denied from this IP address');
        }

        // 5. Super Admin bypass
        if ($user->isSuperAdmin()) {
            Log::debug("[{$requestId}] Permission check PASSED - Super Admin bypass");
            $this->logAccessAttempt($requestId, $user->id, $permission, true, [
                'reason' => 'super_admin_bypass',
                'ip_address' => $request->ip(),
            ]);
            return $next($request);
        }

        // 6. Check MFA requirement for high-risk operations
        if ($this->mfaService->isHighRiskOperation($permission)) {
            if (!$this->mfaService->isMfaVerified($user->id, $permission)) {
                $mfaCompliance = $this->mfaService->checkMfaCompliance($user->id);

                if (!$mfaCompliance['compliant']) {
                    $this->logAccessAttempt($requestId, $user->id, $permission, false, [
                        'reason' => 'mfa_required_not_compliant',
                        'mfa_reason' => $mfaCompliance['reason'],
                        'ip_address' => $request->ip(),
                    ]);

                    if ($request->is('api/*') || $request->header('X-Inertia')) {
                        return response()->json([
                            'message' => 'MFA verification required for this operation',
                            'mfa_required' => true,
                            'debug_request_id' => $requestId,
                        ], 403);
                    }

                    return redirect()->route('mfa.setup')->with('error', 'MFA verification is required for this high-risk operation.');
                }
            }
        }

        // 7. Check permission using module-action based format
        $hasPermission = $this->checkPermissionWithModuleAction($user, $permission);

        if (!$hasPermission) {
            // Record failed attempt for rate limiting
            $this->recordFailedAttempt($user->id);

            // Log detailed breakdown
            $this->logPermissionDenied($requestId, $user, $permission, $request);

            return $this->forbiddenResponse($request, $requestId, 'You do not have permission to access this resource');
        }

        // 8. Clear failed attempts on success
        $this->clearFailedAttempts($user->id);

        // 9. Update session activity
        $this->updateSessionActivity($request);

        Log::debug("[{$requestId}] Permission check PASSED", [
            'user_id' => $user->id,
            'permission' => $permission,
            'ip_address' => $request->ip(),
        ]);

        return $next($request);
    }

    /**
     * Check permission with module-action support.
     */
    protected function checkPermissionWithModuleAction($user, string $permission): bool
    {
        // Direct permission check
        if ($user->hasPermission($permission)) {
            return true;
        }

        // Parse module.action format and check
        $parts = explode('.', $permission);
        if (count($parts) >= 2) {
            $module = $parts[0];
            $action = $parts[1] ?? 'view';

            // Check module-level permission with action
            return $user->hasPermission("{$module}.{$action}") ||
                   $user->hasPermission("{$module}.manage") ||
                   $this->rbacService->checkModuleAccess($module, $action, $user);
        }

        return false;
    }

    /**
     * Validate user session.
     */
    protected function validateSession(Request $request): array
    {
        $sessionId = $request->session()->getId();

        return $this->sessionService->validateSessionTimeout($sessionId);
    }

    /**
     * Check IP restrictions for user and permission.
     */
    protected function checkIpRestriction($user, string $permission, string $ip): array
    {
        // Use the model's isIpAllowed method which handles IP restrictions correctly
        try {
            $isAllowed = PermissionIpRestriction::isIpAllowed($ip);
            return [
                'allowed' => $isAllowed,
                'reason' => $isAllowed ? 'ip_allowed' : 'ip_denied',
            ];
        } catch (\Exception $e) {
            // If there's an error (e.g., table/column issues), log and allow
            Log::warning('[CheckPermission] IP restriction check failed, allowing access: ' . $e->getMessage());
            return ['allowed' => true, 'reason' => 'ip_check_failed_allowing'];
        }
    }

    /**
     * Check if user is rate limited.
     */
    protected function isRateLimited(int $userId): bool
    {
        $key = $this->rateLimitPrefix . $userId;
        $attempts = Cache::get($key, 0);

        return $attempts >= $this->maxFailedAttempts;
    }

    /**
     * Record a failed attempt.
     */
    protected function recordFailedAttempt(int $userId): void
    {
        $key = $this->rateLimitPrefix . $userId;
        $attempts = Cache::increment($key);

        if ($attempts === 1) {
            Cache::put($key, 1, now()->addMinutes($this->rateLimitDuration));
        }

        // Set expiration on first attempt
        if ($attempts === 1) {
            Cache::put($key, $attempts, now()->addMinutes($this->rateLimitDuration));
        }
    }

    /**
     * Clear failed attempts.
     */
    protected function clearFailedAttempts(int $userId): void
    {
        Cache::forget($this->rateLimitPrefix . $userId);
    }

    /**
     * Get rate limit retry after time in seconds.
     */
    protected function getRateLimitRetryAfter(int $userId): int
    {
        $key = $this->rateLimitPrefix . $userId;
        $ttl = Cache::ttl($key);

        return $ttl > 0 ? $ttl * 60 : $this->rateLimitDuration * 60;
    }

    /**
     * Update session activity.
     */
    protected function updateSessionActivity(Request $request): void
    {
        $sessionId = $request->session()->getId();
        $this->sessionService->updateSessionActivity($sessionId);
    }

    /**
     * Log access attempt.
     */
    protected function logAccessAttempt(
        string $requestId,
        int $userId,
        string $permission,
        bool $granted,
        array $context = []
    ): void {
        $this->rbacService->logPermissionAccess($userId, $permission, $granted, array_merge([
            'request_id' => $requestId,
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log detailed permission denied event.
     */
    protected function logPermissionDenied(string $requestId, $user, string $permission, Request $request): void
    {
        $effectivePermissions = $user->getEffectivePermissions();

        Log::warning("[{$requestId}] Permission denied", [
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'permission_required' => $permission,
            'effective_permissions_count' => count($effectivePermissions),
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
        ]);

        // Log to audit
        $this->rbacService->logPermissionAccess($user->id, $permission, false, [
            'request_id' => $requestId,
            'reason' => 'permission_denied',
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
        ]);
    }

    /**
     * Return unauthorized response.
     */
    protected function unauthorizedResponse(Request $request, string $requestId, string $message): Response
    {
        if ($request->is('api/*') || $request->header('X-Inertia')) {
            return response()->json([
                'message' => $message,
                'debug_request_id' => $requestId,
            ], 401);
        }

        return redirect()->route('login');
    }

    /**
     * Return forbidden response.
     */
    protected function forbiddenResponse(Request $request, string $requestId, string $message): Response
    {
        if ($request->is('api/*') || $request->header('X-Inertia')) {
            return response()->json([
                'message' => $message,
                'debug_request_id' => $requestId,
            ], 403);
        }

        return back()->with('error', $message);
    }
}
