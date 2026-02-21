<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Patient;

trait HasAuthorization
{
    /**
     * Check if user can access patients
     */
    protected function authorizePatientAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-patients')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify patients
     */
    protected function authorizePatientModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-patients')) {
            abort(403, 'Unauthorized access');
        }
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
