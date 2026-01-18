<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class PermissionChangeRequest extends Model
{
    protected $fillable = [
        'user_id',
        'requested_by',
        'permissions_to_add',
        'permissions_to_remove',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'expires_at',
    ];

    protected $casts = [
        'permissions_to_add' => 'array',
        'permissions_to_remove' => 'array',
        'approved_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user whose permissions are being changed.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who made the request.
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Get the user who approved/rejected the request.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get permissions to add as Permission models.
     */
    public function permissionsToAdd()
    {
        if (!$this->permissions_to_add) {
            return collect();
        }

        return Permission::whereIn('id', $this->permissions_to_add)->get();
    }

    /**
     * Get permissions to remove as Permission models.
     */
    public function permissionsToRemove()
    {
        if (!$this->permissions_to_remove) {
            return collect();
        }

        return Permission::whereIn('id', $this->permissions_to_remove)->get();
    }

    /**
     * Scope to get only pending requests.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get only approved requests.
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get only rejected requests.
     */
    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Scope to get only expired requests.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', 'expired');
    }

    /**
     * Scope to get requests for a specific user.
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get requests made by a specific user.
     */
    public function scopeRequestedBy(Builder $query, $userId): Builder
    {
        return $query->where('requested_by', $userId);
    }

    /**
     * Check if the request is still valid (not expired and pending).
     */
    public function isValid(): bool
    {
        return $this->status === 'pending' &&
               (!$this->expires_at || $this->expires_at->isFuture());
    }

    /**
     * Approve the request.
     */
    public function approve($approvedBy): bool
    {
        return $this->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ]);
    }

    /**
     * Reject the request.
     */
    public function reject($approvedBy): bool
    {
        return $this->update([
            'status' => 'rejected',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ]);
    }

    /**
     * Mark the request as expired.
     */
    public function markExpired(): bool
    {
        return $this->update(['status' => 'expired']);
    }

    /**
     * Apply the permission changes to the user.
     */
    public function applyChanges(): void
    {
        $user = $this->user;

        // Add permissions
        if ($this->permissions_to_add) {
            foreach ($this->permissions_to_add as $permissionId) {
                $user->userPermissions()->updateOrCreate(
                    ['permission_id' => $permissionId],
                    ['allowed' => true]
                );
            }
        }

        // Remove permissions
        if ($this->permissions_to_remove) {
            $user->userPermissions()
                ->whereIn('permission_id', $this->permissions_to_remove)
                ->delete();
        }
    }
}
