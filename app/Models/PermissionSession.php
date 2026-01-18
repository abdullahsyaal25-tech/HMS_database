<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class PermissionSession extends Model
{
    protected $fillable = [
        'user_id',
        'session_token',
        'started_at',
        'ended_at',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            if (empty($session->session_token)) {
                $session->session_token = Str::random(64);
            }
        });
    }

    /**
     * Get the user that owns the permission session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the actions performed in this session.
     */
    public function actions(): HasMany
    {
        return $this->hasMany(PermissionSessionAction::class, 'session_id');
    }

    /**
     * Scope to get only active sessions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('ended_at');
    }

    /**
     * Scope to get only completed sessions.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereNotNull('ended_at');
    }

    /**
     * Scope to get sessions for a specific user.
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if the session is currently active.
     */
    public function isActive(): bool
    {
        return is_null($this->ended_at);
    }

    /**
     * End the permission session.
     */
    public function endSession(): bool
    {
        return $this->update(['ended_at' => now()]);
    }

    /**
     * Log an action in this session.
     */
    public function logAction(string $actionType, array $actionData, ?string $description = null): PermissionSessionAction
    {
        return $this->actions()->create([
            'action_type' => $actionType,
            'action_data' => $actionData,
            'description' => $description,
            'performed_at' => now(),
        ]);
    }

    /**
     * Get session duration in minutes.
     */
    public function getDurationInMinutes(): ?float
    {
        if (!$this->ended_at) {
            return null;
        }

        return $this->started_at->diffInMinutes($this->ended_at);
    }
}
