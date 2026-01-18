<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class TemporaryPermission extends Model
{
    protected $fillable = [
        'user_id',
        'permission_id',
        'granted_by',
        'granted_at',
        'expires_at',
        'reason',
        'is_active',
    ];

    protected $casts = [
        'granted_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Get the user that owns the temporary permission.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the permission that is temporarily granted.
     */
    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }

    /**
     * Get the user who granted the temporary permission.
     */
    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by');
    }

    /**
     * Scope to get only active temporary permissions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
                    ->where('expires_at', '>', now());
    }

    /**
     * Scope to get only expired temporary permissions.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('is_active', false)
              ->orWhere('expires_at', '<=', now());
        });
    }

    /**
     * Scope to get temporary permissions for a specific user.
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if the temporary permission is currently valid.
     */
    public function isValid(): bool
    {
        return $this->is_active && $this->expires_at->isFuture();
    }

    /**
     * Revoke the temporary permission.
     */
    public function revoke(): bool
    {
        return $this->update(['is_active' => false]);
    }

    /**
     * Extend the expiration time of the temporary permission.
     */
    public function extendExpiry($newExpiry): bool
    {
        return $this->update(['expires_at' => $newExpiry]);
    }
}
