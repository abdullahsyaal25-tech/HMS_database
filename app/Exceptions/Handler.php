<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Illuminate\Support\Facades\Log;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\Exceptions\SessionNotFoundException;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        // Handle SessionNotFoundException - redirect to login
        $this->renderable(function (SessionNotFoundException $e, $request) {
            Log::warning('[SessionHandler] Session not found exception:', [
                'url' => $request->url(),
                'session_id' => $request->session()->getId(),
                'user_agent' => $request->userAgent(),
            ]);

            // Check if it's an Inertia request
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'component' => 'Login',
                    'props' => [
                        'error' => 'Your session has expired. Please log in again.',
                        'reason' => 'session_expired',
                        'redirect' => route('login'),
                    ],
                ], 401);
            }

            // Redirect to login for regular requests
            return redirect()->route('login')
                ->with('error', 'Your session has expired. Please log in again.');
        });

        // Handle AuthenticationException - redirect to login
        $this->renderable(function (AuthenticationException $e, $request) {
            Log::warning('[SessionHandler] Authentication exception:', [
                'url' => $request->url(),
                'message' => $e->getMessage(),
            ]);

            // Check if it's an Inertia request
            if ($request->header('X-Inertia')) {
                return response()->json([
                    'component' => 'Login',
                    'props' => [
                        'error' => 'Please log in to access this page.',
                        'reason' => 'unauthenticated',
                        'redirect' => route('login'),
                    ],
                ], 401);
            }

            return redirect()->route('login');
        });
    }

    /**
     * Convert a validation exception into a JSON response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Validation\ValidationException  $exception
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    protected function invalidJson($request, $exception)
    {
        $response = parent::invalidJson($request, $exception);

        // Check if it's an Inertia request
        if ($request->header('X-Inertia')) {
            return response()->json([
                'component' => null,
                'props' => [
                    'errors' => $exception->errors(),
                    'error' => 'Validation failed',
                ],
            ], $response->getStatusCode());
        }

        return $response;
    }
}
