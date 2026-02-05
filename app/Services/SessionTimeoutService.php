<?php

namespace App\Services;

use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use App\Models\PermissionSession;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\DB;

class SessionTimeoutService
{
    /**
     * Cache key prefix for session data.
     */
    protected string $sessionCachePrefix = 'user_session:';

    /**
     * Cache TTL for session data in seconds (24 hours).
     */
    protected int $sessionCacheTtl = 86400;

    /**
     * Session activity timeout buffer in seconds (for AJAX heartbeat).
     */
    protected int $activityBufferSeconds = 30;

    /**
     * Get session timeout in minutes for a specific role.
     *
     * @param int $roleId The role ID
     * @return int Session timeout in minutes
     */
    public function getTimeoutForRole(int $roleId): int
    {
        $role = Role::find($roleId);
        
        if (!$role) {
            return 120; // Default 2 hours
        }

        return $role->getSessionTimeoutMinutes();
    }

    /**
     * Get concurrent session limit for a specific role.
     *
     * @param int $roleId The role ID
     * @return int|null Limit or null for unlimited
     */
    public function getConcurrentSessionLimit(int $roleId): ?int
    {
        $role = Role::find($roleId);
        
        if (!$role) {
            return null; // Unlimited by default
        }

        return $role->getConcurrentSessionLimit();
    }

    /**
     * Validate if a session has expired.
     *
     * @param string $sessionId The session ID
     * @return array Validation result with expired status and details
     */
    public function validateSessionTimeout(string $sessionId): array
    {
        $sessionData = $this->getSessionData($sessionId);
        
        if (!$sessionData) {
            return [
                'valid' => false,
                'reason' => 'session_not_found',
                'message' => 'Session not found or expired',
            ];
        }

        // Check inactivity timeout
        $timeoutMinutes = $sessionData['timeout_minutes'] ?? 120;
        $lastActivity = $sessionData['last_activity'] ?? null;
        
        if ($lastActivity) {
            $lastActivityTime = \Carbon\Carbon::parse($lastActivity);
            $inactiveMinutes = now()->diffInMinutes($lastActivityTime);
            
            if ($inactiveMinutes >= $timeoutMinutes) {
                $this->logSessionEvent($sessionData['user_id'], 'session_expired_inactivity', $sessionId, [
                    'inactive_minutes' => $inactiveMinutes,
                    'timeout_minutes' => $timeoutMinutes,
                ]);

                return [
                    'valid' => false,
                    'reason' => 'inactivity_timeout',
                    'message' => "Session expired due to inactivity ({$timeoutMinutes} minutes)",
                    'inactive_minutes' => $inactiveMinutes,
                    'timeout_minutes' => $timeoutMinutes,
                ];
            }
        }

        // Check absolute timeout
        $absoluteTimeoutMinutes = $sessionData['absolute_timeout_minutes'] ?? 960;
        $sessionCreated = $sessionData['created_at'] ?? null;
        
        if ($sessionCreated) {
            $sessionCreatedTime = \Carbon\Carbon::parse($sessionCreated);
            $sessionDuration = now()->diffInMinutes($sessionCreatedTime);
            
            if ($sessionDuration >= $absoluteTimeoutMinutes) {
                $this->logSessionEvent($sessionData['user_id'], 'session_expired_absolute', $sessionId, [
                    'session_duration_minutes' => $sessionDuration,
                    'absolute_timeout_minutes' => $absoluteTimeoutMinutes,
                ]);

                return [
                    'valid' => false,
                    'reason' => 'absolute_timeout',
                    'message' => "Session expired after maximum duration ({$absoluteTimeoutMinutes} minutes)",
                    'session_duration_minutes' => $sessionDuration,
                    'absolute_timeout_minutes' => $absoluteTimeoutMinutes,
                ];
            }
        }

        return [
            'valid' => true,
            'reason' => null,
            'message' => 'Session is valid',
            'last_activity' => $lastActivity,
            'timeout_minutes' => $timeoutMinutes,
        ];
    }

    /**
     * Extend a session's timeout.
     *
     * @param string $sessionId The session ID
     * @return bool Whether extension was successful
     */
    public function extendSession(string $sessionId): bool
    {
        $sessionData = $this->getSessionData($sessionId);
        
        if (!$sessionData) {
            return false;
        }

        // Update last activity
        $this->updateSessionActivity($sessionId);

        $this->logSessionEvent($sessionData['user_id'], 'session_extended', $sessionId, [
            'previous_activity' => $sessionData['last_activity'] ?? null,
            'new_activity' => now()->toIso8601String(),
        ]);

        return true;
    }

    /**
     * Terminate other sessions for a user, keeping only the current one.
     *
     * @param int $userId The user ID
     * @param string $currentSessionId The current session ID to keep
     * @return array Result with count of terminated sessions
     */
    public function terminateOtherSessions(int $userId, string $currentSessionId): array
    {
        $user = User::find($userId);
        
        if (!$user) {
            return [
                'success' => true,
                'terminated_count' => 0,
                'message' => 'User not found',
            ];
        }

        $role = $user->roleModel;
        $limit = $role ? $this->getConcurrentSessionLimit($role->id) : null;
        
        // If no limit, don't terminate anything
        if ($limit === null) {
            return [
                'success' => true,
                'terminated_count' => 0,
                'message' => 'No concurrent session limit set',
            ];
        }

        // Get all active sessions for user
        $activeSessions = $this->getUserActiveSessions($userId);
        $sessionIds = array_keys($activeSessions);
        
        // If within limit, don't terminate
        if (count($sessionIds) <= $limit) {
            return [
                'success' => true,
                'terminated_count' => 0,
                'message' => 'Within concurrent session limit',
            ];
        }

        // Terminate all sessions except current
        $terminatedCount = 0;
        foreach ($sessionIds as $sessionId) {
            if ($sessionId !== $currentSessionId) {
                $this->terminateSession($sessionId);
                $terminatedCount++;
            }
        }

        $this->logSessionEvent($userId, 'concurrent_session_termination', $currentSessionId, [
            'terminated_count' => $terminatedCount,
            'limit' => $limit,
        ]);

        return [
            'success' => true,
            'terminated_count' => $terminatedCount,
            'message' => "Terminated {$terminatedCount} other sessions",
        ];
    }

    /**
     * Terminate a specific session.
     *
     * @param string $sessionId The session ID to terminate
     * @return bool Whether termination was successful
     */
    public function terminateSession(string $sessionId): bool
    {
        $sessionData = $this->getSessionData($sessionId);
        
        if (!$sessionData) {
            return false;
        }

        $userId = $sessionData['user_id'];
        
        // Clear session data from cache
        Cache::forget($this->sessionCachePrefix . $sessionId);
        
        // Clear user's session tracking
        $userSessions = Cache::get("{$this->sessionCachePrefix}user:{$userId}", []);
        unset($userSessions[$sessionId]);
        Cache::put("{$this->sessionCachePrefix}user:{$userId}", $userSessions, $this->sessionCacheTtl);

        $this->logSessionEvent($userId, 'session_terminated', $sessionId, [
            'reason' => 'manual_termination',
        ]);

        return true;
    }

    /**
     * Log a session event for audit purposes.
     *
     * @param int $userId The user ID
     * @param string $event The event type
     * @param string $sessionId The session ID
     * @param array $context Additional context
     */
    public function logSessionEvent(int $userId, string $event, string $sessionId, array $context = []): void
    {
        try {
            $user = User::find($userId);
            
            AuditLog::create([
                'user_id' => $userId,
                'user_name' => $user?->name ?? 'Unknown',
                'user_role' => $user?->role ?? 'Unknown',
                'action' => "Session: {$event}",
                'target_type' => 'Session',
                'target_id' => $userId,
                'target_name' => $user?->name ?? 'Unknown',
                'details' => json_encode([
                    'event' => $event,
                    'session_id' => $sessionId,
                    'context' => $context,
                ]),
                'severity' => $this->getEventSeverity($event),
                'ip_address' => $context['ip_address'] ?? Request::ip(),
                'user_agent' => $context['user_agent'] ?? Request::userAgent(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log session event: ' . $e->getMessage());
        }
    }

    /**
     * Get session data from cache.
     *
     * @param string $sessionId The session ID
     * @return array|null Session data or null if not found
     */
    protected function getSessionData(string $sessionId): ?array
    {
        return Cache::get($this->sessionCachePrefix . $sessionId);
    }

    /**
     * Store session data in cache.
     *
     * @param string $sessionId The session ID
     * @param array $data Session data
     */
    public function storeSessionData(string $sessionId, array $data): void
    {
        Cache::put($this->sessionCachePrefix . $sessionId, $data, $this->sessionCacheTtl);
        
        // Also track in user's session list
        $userId = $data['user_id'];
        $userSessions = Cache::get("{$this->sessionCachePrefix}user:{$userId}", []);
        $userSessions[$sessionId] = [
            'created_at' => $data['created_at'] ?? now()->toIso8601String(),
            'last_activity' => $data['last_activity'] ?? now()->toIso8601String(),
        ];
        Cache::put("{$this->sessionCachePrefix}user:{$userId}", $userSessions, $this->sessionCacheTtl);
    }

    /**
     * Update session activity timestamp.
     *
     * @param string $sessionId The session ID
     */
    public function updateSessionActivity(string $sessionId): void
    {
        $sessionData = $this->getSessionData($sessionId);
        
        if (!$sessionData) {
            return;
        }

        $sessionData['last_activity'] = now()->toIso8601String();
        
        $this->storeSessionData($sessionId, $sessionData);
    }

    /**
     * Get all active sessions for a user.
     *
     * @param int $userId The user ID
     * @return array Array of session data keyed by session ID
     */
    public function getUserActiveSessions(int $userId): array
    {
        $userSessions = Cache::get("{$this->sessionCachePrefix}user:{$userId}", []);
        $activeSessions = [];
        
        foreach ($userSessions as $sessionId => $data) {
            $sessionData = $this->getSessionData($sessionId);
            if ($sessionData) {
                $activeSessions[$sessionId] = $sessionData;
            }
        }
        
        return $activeSessions;
    }

    /**
     * Get session count for a user.
     *
     * @param int $userId The user ID
     * @return int Number of active sessions
     */
    public function getSessionCount(int $userId): int
    {
        return count($this->getUserActiveSessions($userId));
    }

    /**
     * Check if user can create a new session.
     *
     * @param int $userId The user ID
     * @param string|null $newSessionId The new session ID (to check if already counted)
     * @return array Result with allowed status
     */
    public function canCreateSession(int $userId, ?string $newSessionId = null): array
    {
        $user = User::find($userId);
        
        if (!$user) {
            return [
                'allowed' => false,
                'reason' => 'user_not_found',
            ];
        }

        $role = $user->roleModel;
        $limit = $role ? $this->getConcurrentSessionLimit($role->id) : null;
        
        // No limit means unlimited sessions
        if ($limit === null) {
            return [
                'allowed' => true,
                'reason' => 'no_limit',
                'current_count' => $this->getSessionCount($userId),
            ];
        }

        $currentCount = $this->getSessionCount($userId);
        
        // Check if already at limit
        if ($currentCount >= $limit) {
            // Check if we're replacing an existing session
            if ($newSessionId && isset($userSessions[$newSessionId])) {
                return [
                    'allowed' => true,
                    'reason' => 'replacing_existing_session',
                    'current_count' => $currentCount,
                    'limit' => $limit,
                ];
            }

            return [
                'allowed' => false,
                'reason' => 'session_limit_reached',
                'current_count' => $currentCount,
                'limit' => $limit,
            ];
        }

        return [
            'allowed' => true,
            'reason' => 'within_limit',
            'current_count' => $currentCount,
            'limit' => $limit,
        ];
    }

    /**
     * Initialize session data for a user.
     *
     * @param User $user The user
     * @param string $sessionId The session ID
     * @return array Session data
     */
    public function initializeSession(User $user, string $sessionId): array
    {
        $role = $user->roleModel;
        
        $sessionData = [
            'user_id' => $user->id,
            'session_id' => $sessionId,
            'role_id' => $role?->id,
            'role_slug' => $role?->slug,
            'role_priority' => $role?->priority,
            'timeout_minutes' => $role ? $this->getTimeoutForRole($role->id) : 120,
            'absolute_timeout_minutes' => $role ? ($role->priority >= 80 ? 240 : 960) : 960,
            'created_at' => now()->toIso8601String(),
            'last_activity' => now()->toIso8601String(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ];

        $this->storeSessionData($sessionId, $sessionData);

        $this->logSessionEvent($user->id, 'session_created', $sessionId, [
            'role' => $role?->slug,
            'timeout_minutes' => $sessionData['timeout_minutes'],
        ]);

        return $sessionData;
    }

    /**
     * Get severity level for an event.
     *
     * @param string $event The event type
     * @return string Severity level
     */
    protected function getEventSeverity(string $event): string
    {
        $highSeverityEvents = [
            'session_expired_inactivity',
            'session_expired_absolute',
            'concurrent_session_termination',
            'session_terminated',
        ];

        $warningSeverityEvents = [
            'session_limit_reached',
        ];

        if (in_array($event, $highSeverityEvents)) {
            return 'high';
        }

        if (in_array($event, $warningSeverityEvents)) {
            return 'warning';
        }

        return 'info';
    }

    /**
     * Get remaining time until session expires.
     *
     * @param string $sessionId The session ID
     * @return array|null Time remaining or null if session invalid
     */
    public function getTimeUntilExpiry(string $sessionId): ?array
    {
        $sessionData = $this->getSessionData($sessionId);
        
        if (!$sessionData) {
            return null;
        }

        $timeoutMinutes = $sessionData['timeout_minutes'] ?? 120;
        $lastActivity = $sessionData['last_activity'] ?? null;
        
        if (!$lastActivity) {
            return null;
        }

        $lastActivityTime = \Carbon\Carbon::parse($lastActivity);
        $expiresAt = $lastActivityTime->addMinutes($timeoutMinutes);
        $minutesRemaining = now()->diffInMinutes($expiresAt, false);
        $secondsRemaining = now()->diffInSeconds($expiresAt, false);

        return [
            'minutes_remaining' => max(0, $minutesRemaining),
            'seconds_remaining' => max(0, $secondsRemaining),
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    /**
     * Force logout user from all sessions.
     *
     * @param int $userId The user ID
     * @param string $reason The reason for force logout
     * @return int Number of sessions terminated
     */
    public function forceLogoutUser(int $userId, string $reason = 'admin_action'): int
    {
        $sessions = $this->getUserActiveSessions($userId);
        $terminatedCount = 0;
        
        foreach (array_keys($sessions) as $sessionId) {
            $this->terminateSession($sessionId);
            $terminatedCount++;
        }

        $this->logSessionEvent($userId, 'force_logout', 'all', [
            'reason' => $reason,
            'terminated_sessions' => $terminatedCount,
        ]);

        return $terminatedCount;
    }
}
