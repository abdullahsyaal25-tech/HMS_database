<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * AuditLog Model
 * 
 * Note: SoftDeletes removed intentionally to maintain audit integrity.
 * Audit logs should never be deleted or modified after creation.
 */
class AuditLog extends Model
{
    use HasFactory;

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = true;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'description',
        'ip_address',
        'user_agent',
        'module',
        'severity',
        'logged_at',
        'response_time',
        'memory_usage',
        'error_details',
        'request_method',
        'request_url',
        'session_id'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'logged_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'response_time' => 'float',
        'memory_usage' => 'integer',
        'error_details' => 'json',
    ];

    /**
     * Prevent updates to audit logs for integrity.
     */
    protected static function boot()
    {
        parent::boot();

        // Prevent updates to audit logs
        static::updating(function ($model) {
            if (app()->environment('production')) {
                throw new \RuntimeException('Audit logs cannot be modified.');
            }
        });

        // Prevent deletes in production
        static::deleting(function ($model) {
            if (app()->environment('production')) {
                throw new \RuntimeException('Audit logs cannot be deleted.');
            }
        });
    }

    /**
     * Get the user that owns the audit log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for filtering by severity.
     */
    public function scopeBySeverity($query, string $severity)
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope for filtering by module.
     */
    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope for filtering by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('logged_at', [$startDate, $endDate]);
    }

    /**
     * Scope for critical logs.
     */
    public function scopeCritical($query)
    {
        return $query->whereIn('severity', ['error', 'critical']);
    }

    /**
     * Create a new audit log entry.
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?string $module = null,
        string $severity = 'info',
        ?array $errorDetails = null
    ): self {
        $user = auth()->user();
        $request = request();

        return static::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'System',
            'user_role' => $user?->role ?? 'System',
            'action' => $action,
            'description' => $description,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => $module,
            'severity' => $severity,
            'logged_at' => now(),
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
            'session_id' => session()->getId(),
            'error_details' => $errorDetails,
        ]);
    }
}