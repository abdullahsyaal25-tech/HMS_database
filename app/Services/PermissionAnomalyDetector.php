<?php

namespace App\Services;

use App\Models\PermissionSessionAction;
use App\Models\TemporaryPermission;
use App\Models\PermissionChangeRequest;
use App\Models\AuditLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PermissionAnomalyDetector
{
    /**
     * Detect anomalies in permission management activities.
     */
    public function detectAnomalies(): Collection
    {
        $anomalies = collect();

        // Check for unusual permission granting patterns
        $anomalies = $anomalies->merge($this->detectUnusualPermissionGrants());

        // Check for rapid permission changes
        $anomalies = $anomalies->merge($this->detectRapidPermissionChanges());

        // Check for unusual time patterns
        $anomalies = $anomalies->merge($this->detectUnusualTimePatterns());

        // Check for permission escalation attempts
        $anomalies = $anomalies->merge($this->detectPermissionEscalation());

        return $anomalies;
    }

    /**
     * Detect unusual permission granting patterns.
     */
    private function detectUnusualPermissionGrants(): Collection
    {
        $anomalies = collect();

        // Get permission grants in the last hour
        $recentGrants = TemporaryPermission::where('created_at', '>=', now()->subHour())->get();

        // Group by user who granted permissions
        $grantsByUser = $recentGrants->groupBy('granted_by');

        foreach ($grantsByUser as $userId => $grants) {
            $grantCount = $grants->count();

            // Flag if a user granted more than 5 permissions in an hour
            if ($grantCount > 5) {
                $anomalies->push([
                    'type' => 'bulk_permission_grants',
                    'severity' => 'medium',
                    'user_id' => $userId,
                    'description' => "User granted {$grantCount} temporary permissions in the last hour",
                    'data' => [
                        'grant_count' => $grantCount,
                        'permissions' => $grants->pluck('permission.name')->toArray(),
                        'time_window' => '1 hour',
                    ],
                    'detected_at' => now(),
                ]);
            }

            // Check for high-risk permissions being granted
            $highRiskPermissions = ['delete-users', 'manage-roles', 'system-admin'];
            $highRiskGrants = $grants->filter(function ($grant) use ($highRiskPermissions) {
                return in_array($grant->permission->name, $highRiskPermissions);
            });

            if ($highRiskGrants->count() > 2) {
                $anomalies->push([
                    'type' => 'high_risk_permission_grants',
                    'severity' => 'high',
                    'user_id' => $userId,
                    'description' => "User granted {$highRiskGrants->count()} high-risk permissions in the last hour",
                    'data' => [
                        'high_risk_permissions' => $highRiskGrants->pluck('permission.name')->toArray(),
                        'time_window' => '1 hour',
                    ],
                    'detected_at' => now(),
                ]);
            }
        }

        return $anomalies;
    }

    /**
     * Detect rapid permission changes.
     */
    private function detectRapidPermissionChanges(): Collection
    {
        $anomalies = collect();

        // Check for users who had many permission changes recently
        $recentChanges = PermissionSessionAction::where('created_at', '>=', now()->subMinutes(30))
            ->whereIn('action_type', ['update_user_permissions', 'approve_permission_change_request'])
            ->get();

        $changesByUser = $recentChanges->groupBy('session.user_id');

        foreach ($changesByUser as $userId => $changes) {
            if ($changes->count() > 10) { // More than 10 changes in 30 minutes
                $anomalies->push([
                    'type' => 'rapid_permission_changes',
                    'severity' => 'high',
                    'user_id' => $userId,
                    'description' => "User performed {$changes->count()} permission changes in the last 30 minutes",
                    'data' => [
                        'change_count' => $changes->count(),
                        'actions' => $changes->pluck('action_type')->toArray(),
                        'time_window' => '30 minutes',
                    ],
                    'detected_at' => now(),
                ]);
            }
        }

        return $anomalies;
    }

    /**
     * Detect unusual time patterns.
     */
    private function detectUnusualTimePatterns(): Collection
    {
        $anomalies = collect();

        // Check for permission changes during unusual hours (e.g., 2-5 AM)
        $unusualHourStart = 2;
        $unusualHourEnd = 5;

        $unusualTimeChanges = PermissionSessionAction::where('created_at', '>=', now()->subDay())
            ->whereRaw('HOUR(performed_at) BETWEEN ? AND ?', [$unusualHourStart, $unusualHourEnd])
            ->whereIn('action_type', ['grant_temporary_permission', 'approve_permission_change_request'])
            ->get();

        if ($unusualTimeChanges->count() > 0) {
            $changesByUser = $unusualTimeChanges->groupBy('session.user_id');

            foreach ($changesByUser as $userId => $changes) {
                $anomalies->push([
                    'type' => 'unusual_hours_activity',
                    'severity' => 'medium',
                    'user_id' => $userId,
                    'description' => "User performed permission changes during unusual hours ({$unusualHourStart}-{$unusualHourEnd})",
                    'data' => [
                        'change_count' => $changes->count(),
                        'hours' => [$unusualHourStart, $unusualHourEnd],
                        'actions' => $changes->pluck('action_type')->toArray(),
                    ],
                    'detected_at' => now(),
                ]);
            }
        }

        return $anomalies;
    }

    /**
     * Detect potential permission escalation attempts.
     */
    private function detectPermissionEscalation(): Collection
    {
        $anomalies = collect();

        // Check for users requesting permissions they don't normally have
        $pendingRequests = PermissionChangeRequest::pending()
            ->with(['user', 'permissionsToAdd'])
            ->get();

        foreach ($pendingRequests as $request) {
            $user = $request->user;
            $requestedPermissions = $request->permissionsToAdd();

            // Check if user is requesting high-privilege permissions
            $highPrivilegePatterns = ['admin', 'super', 'system', 'delete'];

            foreach ($requestedPermissions as $permission) {
                $isHighPrivilege = collect($highPrivilegePatterns)->contains(function ($pattern) use ($permission) {
                    return str_contains(strtolower($permission->name), $pattern);
                });

                if ($isHighPrivilege && !$user->hasPermission($permission->name)) {
                    $anomalies->push([
                        'type' => 'permission_escalation_attempt',
                        'severity' => 'high',
                        'user_id' => $user->id,
                        'description' => "User requested high-privilege permission they don't currently have: {$permission->name}",
                        'data' => [
                            'requested_permission' => $permission->name,
                            'user_current_permissions' => $user->userPermissions()->where('allowed', true)->with('permission')->get()->pluck('permission.name')->toArray(),
                            'request_id' => $request->id,
                        ],
                        'detected_at' => now(),
                    ]);
                }
            }
        }

        return $anomalies;
    }

    /**
     * Log detected anomalies.
     */
    public function logAnomalies(Collection $anomalies): void
    {
        foreach ($anomalies as $anomaly) {
            Log::warning('Permission anomaly detected', $anomaly);

            // Could also store in database for dashboard display
            // Anomaly::create($anomaly);
        }
    }

    /**
     * Get anomaly statistics for dashboard.
     */
    public function getAnomalyStats(): array
    {
        $last24Hours = now()->subDay();

        return [
            'total_anomalies_today' => 0, // Would need to implement storage
            'high_severity_count' => 0,
            'recent_high_risk_grants' => TemporaryPermission::where('created_at', '>=', $last24Hours)
                ->whereHas('permission', function ($query) {
                    $query->whereIn('name', ['delete-users', 'manage-roles', 'system-admin']);
                })
                ->count(),
            'failed_login_attempts' => 0, // Would need additional tracking
            'unusual_hour_activities' => PermissionSessionAction::where('performed_at', '>=', $last24Hours)
                ->whereRaw('HOUR(performed_at) BETWEEN 2 AND 5')
                ->count(),
        ];
    }
}
