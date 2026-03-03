<?php

namespace App\Services;

use App\Models\User;
use App\Models\PermissionAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Session;
use App\Mail\PermissionAlertNotification;
use Inertia\Inertia;

/**
 * Global Authorization Service
 * 
 * Handles unauthorized access attempts with standardized notifications,
 * flash messages, and modal dialogs.
 */
class AuthorizationService
{
    /**
     * Rate limiting cache key prefix
     */
    protected string $rateLimitPrefix = 'authz_rate_limit:';

    /**
     * Unauthorized attempts tracking prefix
     */
    protected string $attemptsPrefix = 'authz_attempts:';

    /**
     * Service configuration
     */
    protected array $config;

    /**
     * PermissionAlertService instance
     */
    protected PermissionAlertService $alertService;

    /**
     * AuditLogService instance
     */
    protected AuditLogService $auditLogService;

    /**
     * Constructor
     */
    public function __construct(
        PermissionAlertService $alertService,
        AuditLogService $auditLogService
    ) {
        $this->alertService = $alertService;
        $this->auditLogService = $auditLogService;
        $this->config = config('authorization', []);
    }

    /**
     * Main handler for unauthorized access attempts
     * 
     * @param Request $request The current request
     * @param string $requiredPermission The permission that was required
     * @param User|null $user The user attempting access (null if guest)
     * @param array $options Additional options for handling
     * @return Response|JsonResponse|RedirectResponse
     */
    public function handleUnauthorizedAccess(
        Request $request,
        string $requiredPermission,
        ?User $user = null,
        array $options = []
    ): Response|JsonResponse|RedirectResponse {
        $user = $user ?? Auth::user();
        $attemptCount = $this->incrementAttemptCounter($request, $user);
        
        // Log the unauthorized attempt
        $this->logUnauthorizedAttempt($request, $requiredPermission, $user, $options['reason'] ?? '');

        // Determine violation type and risk level
        $violationType = $this->determineViolationType($requiredPermission, $options);
        $riskLevel = $options['risk_level'] ?? $this->determineRiskLevel($requiredPermission, $user);

        // Check if we should send notifications
        if ($this->shouldNotify($violationType, $attemptCount)) {
            $this->sendSecurityAlert($violationType, [
                'permission' => $requiredPermission,
                'user' => $user?->toArray(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'attempt_count' => $attemptCount,
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        // Check rate limiting
        if ($this->isRateLimited($request, $user)) {
            return $this->createRateLimitedResponse($request);
        }

        // Return appropriate response based on request type
        return $this->createResponse($request, $requiredPermission, $riskLevel, $options);
    }

    /**
     * Log unauthorized attempt to audit trail
     * 
     * @param Request $request
     * @param string $requiredPermission
     * @param User|null $user
     * @param string $reason
     * @return void
     */
    public function logUnauthorizedAttempt(
        Request $request,
        string $requiredPermission,
        ?User $user = null,
        string $reason = ''
    ): void {
        $logData = [
            'permission' => $requiredPermission,
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Guest',
            'user_role' => $user?->role ?? 'Guest',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'reason' => $reason,
            'timestamp' => now()->toIso8601String(),
        ];

        // Log to audit log service
        $this->auditLogService->logActivity(
            'Unauthorized Access Attempt',
            'Authorization',
            "Unauthorized access attempt to '{$requiredPermission}' by {$logData['user_name']}",
            'warning'
        );

        // Additional detailed logging for critical permissions
        if ($this->isCriticalPermission($requiredPermission)) {
            Log::channel('security')->warning('Critical permission violation attempt', $logData);
        }
    }

    /**
     * Send security alerts to administrators
     * 
     * @param string $type The type of security alert
     * @param array $data Alert data
     * @param array $recipients Optional specific recipients
     * @return void
     */
    public function sendSecurityAlert(
        string $type,
        array $data,
        array $recipients = []
    ): void {
        $alertConfig = $this->config['alerting'][$type] ?? $this->config['alerting']['default'];

        if (!$alertConfig['enabled']) {
            return;
        }

        $title = $this->getAlertTitle($type);
        $message = $this->getAlertMessage($type, $data);

        // Create database alert
        if ($alertConfig['database_alert'] ?? true) {
            $this->alertService->createAlert(
                $type,
                $title,
                $message,
                $data,
                $data['user']['id'] ?? null
            );
        }

        // Send email notifications
        if ($alertConfig['email_alert'] ?? false) {
            $this->sendEmailAlert($type, $title, $message, $data, $recipients);
        }

        // Broadcast real-time notification if enabled
        if ($alertConfig['broadcast'] ?? false) {
            $this->broadcastAlert($type, $data);
        }
    }

    /**
     * Check if user should be notified based on violation type and attempt count
     * 
     * @param string $violationType
     * @param int $attemptCount
     * @return bool
     */
    public function shouldNotify(string $violationType, int $attemptCount = 1): bool
    {
        $thresholds = $this->config['notification_thresholds'] ?? [
            'critical' => 1,
            'high' => 3,
            'medium' => 5,
            'low' => 10,
        ];

        $threshold = $thresholds[$violationType] ?? $thresholds['medium'];

        return $attemptCount >= $threshold;
    }

    /**
     * Get standardized error message
     * 
     * @param string $type Message type
     * @param string $permission Optional permission name for context
     * @return string
     */
    public function getErrorMessage(string $type, string $permission = ''): string
    {
        $key = "authorization.{$type}";
        $fallback = "authorization.unauthorized_default";

        $message = __($key, ['permission' => $permission]);

        if ($message === $key) {
            $message = __($fallback, ['permission' => $permission]);
        }

        return $message;
    }

    /**
     * Create Inertia response with flash data
     * 
     * @param string $message The message to display
     * @param string $type Message type (error, warning, info, success)
     * @param string|null $redirect Optional redirect URL
     * @return Response
     */
    public function createInertiaResponse(
        string $message,
        string $type = 'error',
        ?string $redirect = null
    ): Response {
        $flashData = [
            'message' => $message,
            'type' => $type,
        ];

        // Add modal trigger data for critical errors
        if ($type === 'error' && ($this->config['modal_on_critical'] ?? true)) {
            $flashData['show_modal'] = true;
            $flashData['modal_config'] = [
                'title' => __('authorization.modal_title'),
                'confirm_button' => __('authorization.modal_confirm'),
                'cancel_button' => __('authorization.modal_cancel'),
            ];
        }

        Session::flash('notification', $flashData);

        if ($redirect) {
            return Inertia::location($redirect);
        }

        return Inertia::render('Errors/AccessDenied', [
            'status' => 403,
            'message' => $message,
        ]);
    }

    /**
     * Create JSON response for API requests
     * 
     * @param string $message
     * @param int $statusCode
     * @param array $additionalData
     * @return JsonResponse
     */
    public function createJsonResponse(
        string $message,
        int $statusCode = 403,
        array $additionalData = []
    ): JsonResponse {
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => 'UNAUTHORIZED',
        ];

        if (!empty($additionalData)) {
            $response['data'] = $additionalData;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Create redirect response with flash message
     * 
     * @param string $message
     * @param string $route
     * @param string $type
     * @return RedirectResponse
     */
    public function createRedirectResponse(
        string $message,
        string $route = 'dashboard',
        string $type = 'error'
    ): RedirectResponse {
        Session::flash('notification', [
            'message' => $message,
            'type' => $type,
        ]);

        return redirect()->route($route);
    }

    /**
     * Check if user is rate limited
     * 
     * @param Request $request
     * @param User|null $user
     * @return bool
     */
    public function isRateLimited(Request $request, ?User $user = null): bool
    {
        if (!($this->config['rate_limiting']['enabled'] ?? true)) {
            return false;
        }

        $key = $this->getRateLimitKey($request, $user);
        $attempts = Cache::get($key, 0);
        $maxAttempts = $this->config['rate_limiting']['max_attempts'] ?? 10;

        return $attempts >= $maxAttempts;
    }

    /**
     * Get remaining attempts before rate limit
     * 
     * @param Request $request
     * @param User|null $user
     * @return int
     */
    public function getRemainingAttempts(Request $request, ?User $user = null): int
    {
        $key = $this->getRateLimitKey($request, $user);
        $attempts = Cache::get($key, 0);
        $maxAttempts = $this->config['rate_limiting']['max_attempts'] ?? 10;

        return max(0, $maxAttempts - $attempts);
    }

    /**
     * Reset rate limit counter
     * 
     * @param Request $request
     * @param User|null $user
     * @return void
     */
    public function resetRateLimit(Request $request, ?User $user = null): void
    {
        $key = $this->getRateLimitKey($request, $user);
        Cache::forget($key);
    }

    /**
     * Determine violation type based on permission and context
     * 
     * @param string $permission
     * @param array $options
     * @return string
     */
    protected function determineViolationType(string $permission, array $options): string
    {
        if (isset($options['violation_type'])) {
            return $options['violation_type'];
        }

        if ($this->isCriticalPermission($permission)) {
            return 'critical';
        }

        // Check permission category
        foreach ($this->config['permission_categories'] ?? [] as $category => $permissions) {
            if (in_array($permission, $permissions)) {
                return $category;
            }
        }

        return 'medium';
    }

    /**
     * Determine risk level based on permission and user
     * 
     * @param string $permission
     * @param User|null $user
     * @return string
     */
    protected function determineRiskLevel(string $permission, ?User $user): string
    {
        // Super admin attempting unauthorized access is high risk
        if ($user && $this->isPrivilegedUser($user)) {
            return 'high';
        }

        if ($this->isCriticalPermission($permission)) {
            return 'critical';
        }

        return 'medium';
    }

    /**
     * Create appropriate response based on request type
     * 
     * @param Request $request
     * @param string $permission
     * @param string $riskLevel
     * @param array $options
     * @return Response|JsonResponse|RedirectResponse
     */
    protected function createResponse(
        Request $request,
        string $permission,
        string $riskLevel,
        array $options
    ): Response|JsonResponse|RedirectResponse {
        $message = $this->getErrorMessage(
            $request->expectsJson() ? 'unauthorized_api' : 'unauthorized_default',
            $permission
        );

        // API/AJAX requests
        if ($request->expectsJson() || $request->ajax()) {
            return $this->createJsonResponse(
                $message,
                403,
                [
                    'permission' => $permission,
                    'risk_level' => $riskLevel,
                    'remaining_attempts' => $this->getRemainingAttempts($request),
                ]
            );
        }

        // Inertia requests
        if ($request->header('X-Inertia')) {
            return $this->createInertiaResponse(
                $message,
                $riskLevel === 'critical' ? 'error' : 'warning',
                $options['redirect'] ?? null
            );
        }

        // Standard web requests
        $redirectRoute = $options['redirect_route'] ?? $this->config['default_redirect_route'] ?? 'dashboard';
        return $this->createRedirectResponse($message, $redirectRoute, 'error');
    }

    /**
     * Create rate limited response
     * 
     * @param Request $request
     * @return JsonResponse|RedirectResponse
     */
    protected function createRateLimitedResponse(Request $request): JsonResponse|RedirectResponse
    {
        $message = $this->getErrorMessage('rate_limited');

        if ($request->expectsJson() || $request->ajax()) {
            return $this->createJsonResponse($message, 429, [
                'retry_after' => $this->config['rate_limiting']['decay_minutes'] ?? 15,
            ]);
        }

        Session::flash('notification', [
            'message' => $message,
            'type' => 'error',
        ]);

        return redirect()->back();
    }

    /**
     * Increment attempt counter for rate limiting
     * 
     * @param Request $request
     * @param User|null $user
     * @return int Current attempt count
     */
    protected function incrementAttemptCounter(Request $request, ?User $user = null): int
    {
        $key = $this->getRateLimitKey($request, $user);
        $decayMinutes = $this->config['rate_limiting']['decay_minutes'] ?? 15;

        $attempts = Cache::increment($key);
        
        if ($attempts === 1) {
            Cache::put($key, 1, now()->addMinutes($decayMinutes));
        }

        return $attempts;
    }

    /**
     * Get rate limit cache key
     * 
     * @param Request $request
     * @param User|null $user
     * @return string
     */
    protected function getRateLimitKey(Request $request, ?User $user = null): string
    {
        $identifier = $user?->id ?? $request->ip();
        return $this->rateLimitPrefix . $identifier;
    }

    /**
     * Send email alert
     * 
     * @param string $type
     * @param string $title
     * @param string $message
     * @param array $data
     * @param array $recipients
     * @return void
     */
    protected function sendEmailAlert(
        string $type,
        string $title,
        string $message,
        array $data,
        array $recipients = []
    ): void {
        $recipients = $recipients ?: $this->config['admin_emails'] ?? [];

        if (empty($recipients)) {
            return;
        }

        try {
            // Create a temporary alert object for the email
            $alert = new PermissionAlert([
                'alert_type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
                'status' => 'active',
            ]);

            Mail::to($recipients)
                ->send(new PermissionAlertNotification($alert));
        } catch (\Exception $e) {
            Log::error('Failed to send security alert email', [
                'error' => $e->getMessage(),
                'type' => $type,
            ]);
        }
    }

    /**
     * Broadcast alert in real-time
     * 
     * @param string $type
     * @param array $data
     * @return void
     */
    protected function broadcastAlert(string $type, array $data): void
    {
        // Implementation for broadcasting (e.g., Laravel Echo, Pusher)
        // This would typically use Laravel Events
        event(new \App\Events\SecurityAlertEvent($type, $data));
    }

    /**
     * Check if permission is critical
     * 
     * @param string $permission
     * @return bool
     */
    protected function isCriticalPermission(string $permission): bool
    {
        $criticalPermissions = $this->config['critical_permissions'] ?? [
            'super-admin',
            'admin.users.delete',
            'admin.roles.delete',
            'system.backup.delete',
            'system.settings.modify',
            'billing.refund',
            'patients.delete',
        ];

        return in_array($permission, $criticalPermissions);
    }

    /**
     * Check if user has privileged role
     * 
     * @param User $user
     * @return bool
     */
    protected function isPrivilegedUser(User $user): bool
    {
        $privilegedRoles = $this->config['privileged_roles'] ?? [
            'super-admin',
            'sub-super-admin',
            'hospital-admin',
        ];

        return $user->hasAnyRole($privilegedRoles);
    }

    /**
     * Get alert title based on type
     * 
     * @param string $type
     * @return string
     */
    protected function getAlertTitle(string $type): string
    {
        return match ($type) {
            'critical' => 'Critical Security Alert',
            'high' => 'High Priority Security Alert',
            'medium' => 'Security Alert',
            'low' => 'Security Notification',
            'repeated_violation' => 'Repeated Authorization Violation',
            default => 'Authorization Alert',
        };
    }

    /**
     * Get alert message based on type and data
     * 
     * @param string $type
     * @param array $data
     * @return string
     */
    protected function getAlertMessage(string $type, array $data): string
    {
        $permission = $data['permission'] ?? 'unknown';
        $userName = $data['user']['name'] ?? 'Guest';
        $ipAddress = $data['ip_address'] ?? 'unknown';

        return match ($type) {
            'critical' => "Critical: User {$userName} attempted to access {$permission} from IP {$ipAddress}",
            'high' => "High priority violation: User {$userName} denied access to {$permission}",
            'repeated_violation' => "User {$userName} has made {$data['attempt_count']} unauthorized attempts",
            default => "Unauthorized access attempt to {$permission} by {$userName}",
        };
    }
}
