<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PermissionSessionAction extends Model
{
    protected $fillable = [
        'session_id',
        'action_type',
        'action_data',
        'description',
        'performed_at',
    ];

    protected $casts = [
        'action_data' => 'array',
        'performed_at' => 'datetime',
    ];

    /**
     * Get the permission session that owns this action.
     */
    public function session(): BelongsTo
    {
        return $this->belongsTo(PermissionSession::class, 'session_id');
    }

    /**
     * Scope to filter by action type.
     */
    public function scopeOfType(Builder $query, string $actionType): Builder
    {
        return $query->where('action_type', $actionType);
    }

    /**
     * Scope to get actions performed within a date range.
     */
    public function scopePerformedBetween(Builder $query, $startDate, $endDate): Builder
    {
        return $query->whereBetween('performed_at', [$startDate, $endDate]);
    }
}
