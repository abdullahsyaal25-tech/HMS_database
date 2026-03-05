<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Patient;

trait HasAuthorization
{
    /**
     * Check if user can access patients
     */
    protected function authorizePatientAccess(): bool
    {
        return auth()->user()?->hasPermission('view-patients') ?? false;
    }

    /**
     * Check if user can modify patients
     */
    protected function authorizePatientModify(): bool
    {
        return auth()->user()?->hasPermission('edit-patients') ?? false;
    }

    /**
     * Check if user can access this specific patient
     */
    protected function canAccessPatient(Patient $patient): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        // Super admin can access all patients
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Users with broad permissions can access all patients
        if ($user->hasPermission('view-all-patients')) {
            return true;
        }

        // Owner access (patients viewing their own data in portal)
        if ($patient->user_id === $user->id) {
            return true;
        }

        return $user->hasPermission('view-patients');
    }
}
