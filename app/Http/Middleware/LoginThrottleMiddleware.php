<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class LoginThrottleMiddleware
{
    /**
     * Maximum login attempts before lockout.
     */
    protected int $maxAttempts = 5;

    /**
     * Lockout duration in minutes.
     */
    protected int $lockoutMinutes = 15;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply to login attempts
        if (!$this->isLoginAttempt($request)) {
            return $next($request);
        }

        $key = $this->throttleKey($request);
        
        // Check if locked out
        if ($this->isLockedOut($key)) {
            return $this->sendLockoutResponse($request, $key);
        }

        $response = $next($request);

        // Track failed attempts
        if ($this->isFailedLogin($response)) {
            $this->incrementAttempts($key);
            
            // Lock account if max attempts reached
            if ($this->tooManyAttempts($key)) {
                $this->lockAccount($request, $key);
            }
        } else if ($this->isSuccessfulLogin($response)) {
            // Clear attempts on successful login
            $this->clearAttempts($key);
            $this->updateLoginInfo($request);
        }

        return $response;
    }

    /**
     * Check if this is a login attempt.
     */
    protected function isLoginAttempt(Request $request): bool
    {
        return $request->is('login', 'api/login', 'api/auth/login') 
            && $request->isMethod('POST');
    }

    /**
     * Get the throttle key for the request.
     */
    protected function throttleKey(Request $request): string
    {
        $username = $request->input('username', $request->input('email', ''));
        return 'login_attempts:' . sha1($username . '|' . $request->ip());
    }

    /**
     * Check if the user is locked out.
     */
    protected function isLockedOut(string $key): bool
    {
        $lockoutKey = $key . ':lockout';
        return Cache::has($lockoutKey);
    }

    /**
     * Check if there are too many attempts.
     */
    protected function tooManyAttempts(string $key): bool
    {
        return (int) Cache::get($key, 0) >= $this->maxAttempts;
    }

    /**
     * Increment login attempts.
     */
    protected function incrementAttempts(string $key): void
    {
        $attempts = (int) Cache::get($key, 0) + 1;
        Cache::put($key, $attempts, now()->addMinutes($this->lockoutMinutes));
    }

    /**
     * Clear login attempts.
     */
    protected function clearAttempts(string $key): void
    {
        Cache::forget($key);
        Cache::forget($key . ':lockout');
    }

    /**
     * Lock the account.
     */
    protected function lockAccount(Request $request, string $key): void
    {
        $lockoutKey = $key . ':lockout';
        $lockoutUntil = now()->addMinutes($this->lockoutMinutes);
        
        Cache::put($lockoutKey, $lockoutUntil, $lockoutUntil);

        // Update user record if user exists
        $username = $request->input('username', $request->input('email', ''));
        $user = \App\Models\User::where('username', $username)->first();
        
        if ($user) {
            $user->update([
                'failed_login_attempts' => $this->maxAttempts,
                'locked_until' => $lockoutUntil,
            ]);
        }

        
    }

    /**
     * Send lockout response.
     */
    protected function sendLockoutResponse(Request $request, string $key): Response
    {
        $lockoutKey = $key . ':lockout';
        $lockoutUntil = Cache::get($lockoutKey);
        $secondsRemaining = Carbon::now()->diffInSeconds($lockoutUntil, false);

        return response()->json([
            'error' => 'Account locked',
            'message' => 'Too many failed login attempts. Please try again later.',
            'retry_after' => max(0, $secondsRemaining),
        ], 429);
    }

    /**
     * Check if the response indicates a failed login.
     */
    protected function isFailedLogin(Response $response): bool
    {
        return $response->getStatusCode() === 401 
            || $response->getStatusCode() === 422;
    }

    /**
     * Check if the response indicates a successful login.
     */
    protected function isSuccessfulLogin(Response $response): bool
    {
        return $response->getStatusCode() === 200;
    }

    /**
     * Update login information on successful login.
     */
    protected function updateLoginInfo(Request $request): void
    {
        $user = Auth::user();
        
        if ($user) {
            $user->update([
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);
        }
    }
}
