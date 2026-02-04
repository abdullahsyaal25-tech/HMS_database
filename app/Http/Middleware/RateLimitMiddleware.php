<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class RateLimitMiddleware
{
    /**
     * Rate limit configurations for different contexts
     */
    protected array $limits = [
        'api' => ['max' => 60, 'decay' => 60],           // 60 requests per minute
        'login' => ['max' => 5, 'decay' => 60],          // 5 attempts per minute
        'permission' => ['max' => 100, 'decay' => 60],   // 100 permission checks per minute
        'report' => ['max' => 10, 'decay' => 60],        // 10 report generations per minute
        'export' => ['max' => 5, 'decay' => 300],        // 5 exports per 5 minutes
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $context = 'api'): Response
    {
        $key = $this->resolveRequestSignature($request, $context);
        $limit = $this->limits[$context] ?? $this->limits['api'];

        $attempts = (int) Cache::get($key, 0);

        if ($attempts >= $limit['max']) {
            $this->logRateLimitExceeded($request, $context, $attempts);
            
            return response()->json([
                'error' => 'Too many requests',
                'message' => 'Rate limit exceeded. Please try again later.',
                'retry_after' => $limit['decay'],
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $limit['max'],
                'X-RateLimit-Remaining' => 0,
                'X-RateLimit-Reset' => time() + $limit['decay'],
                'Retry-After' => $limit['decay'],
            ]);
        }

        // Increment attempts
        Cache::put($key, $attempts + 1, $limit['decay']);

        $response = $next($request);

        // Add rate limit headers to response
        $remaining = max(0, $limit['max'] - $attempts - 1);
        $resetIn = $limit['decay'];
        
        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit['max'],
            'X-RateLimit-Remaining' => $remaining,
            'X-RateLimit-Reset' => time() + $resetIn,
            'Retry-After' => $resetIn,
        ]);
    }

    /**
     * Resolve the request signature for rate limiting.
     */
    protected function resolveRequestSignature(Request $request, string $context): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        
        return sprintf('rate_limit:%s:%s:%s',
            $context,
            $identifier,
            $request->fingerprint() ?? sha1($request->ip())
        );
    }

    /**
     * Log rate limit exceeded events.
     */
    protected function logRateLimitExceeded(Request $request, string $context, int $attempts): void
    {
        Log::warning('Rate limit exceeded', [
            'context' => $context,
            'ip' => $request->ip(),
            'user_id' => $request->user()?->id,
            'path' => $request->path(),
            'attempts' => $attempts,
        ]);
    }

    /**
     * Clear rate limit for a specific key.
     */
    public static function clearRateLimit(string $context, string $identifier): void
    {
        $key = sprintf('rate_limit:%s:%s:*', $context, $identifier);
        Cache::forget($key);
    }
}
