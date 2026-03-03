<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * Authorization Facade
 * 
 * Provides easy access to the AuthorizationService for handling
 * unauthorized access attempts with standardized notifications.
 * 
 * @method static \Illuminate\Http\Response|\Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse handleUnauthorizedAccess(\Illuminate\Http\Request $request, string $requiredPermission, ?\App\Models\User $user = null, array $options = [])
 * @method static void logUnauthorizedAttempt(\Illuminate\Http\Request $request, string $requiredPermission, ?\App\Models\User $user = null, string $reason = '')
 * @method static void sendSecurityAlert(string $type, array $data, array $recipients = [])
 * @method static bool shouldNotify(string $violationType, int $attemptCount = 1)
 * @method static string getErrorMessage(string $type, string $permission = '')
 * @method static \Illuminate\Http\Response createInertiaResponse(string $message, string $type = 'error', ?string $redirect = null)
 * @method static \Illuminate\Http\JsonResponse createJsonResponse(string $message, int $statusCode = 403, array $additionalData = [])
 * @method static \Illuminate\Http\RedirectResponse createRedirectResponse(string $message, string $route = 'dashboard', string $type = 'error')
 * @method static bool isRateLimited(\Illuminate\Http\Request $request, ?\App\Models\User $user = null)
 * @method static int getRemainingAttempts(\Illuminate\Http\Request $request, ?\App\Models\User $user = null)
 * @method static void resetRateLimit(\Illuminate\Http\Request $request, ?\App\Models\User $user = null)
 * 
 * @see \App\Services\AuthorizationService
 */
class Authorization extends Facade
{
    /**
     * Get the registered name of the component.
     *
     * @return string
     */
    protected static function getFacadeAccessor(): string
    {
        return 'authorization';
    }
}
