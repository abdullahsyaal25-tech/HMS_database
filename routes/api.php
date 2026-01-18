<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\v1\PatientController;
use App\Http\Controllers\API\v1\DoctorController;
use App\Http\Controllers\API\v1\AppointmentController;
use App\Http\Controllers\API\v1\DepartmentController;
use App\Http\Controllers\API\v1\AdminController;
use App\Http\Controllers\Admin\PermissionsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API Version 1
Route::prefix('v1')->group(function () {
    // Public routes (if needed)
    // Route::get('/health', function () { return ['status' => 'ok']; });

    // Protected routes with sanctum middleware
    Route::middleware('auth:sanctum')->group(function () {
        // Patient routes
        Route::apiResource('patients', PatientController::class);

        // Doctor routes
        Route::apiResource('doctors', DoctorController::class);

        // Appointment routes
        Route::apiResource('appointments', AppointmentController::class);

        // Department routes
        Route::apiResource('departments', DepartmentController::class);

        // Additional appointment routes
        Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}/complete', [AppointmentController::class, 'complete']);

        // Admin routes
        Route::get('/admin/recent-activity', [AdminController::class, 'getRecentActivity']);
        Route::get('/admin/stats', [AdminController::class, 'getStats']);
        Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);
        Route::get('/admin/audit-analytics', [AdminController::class, 'getAuditAnalytics']);

        // Permission Management routes with additional security middleware
        Route::middleware(['permission.ip.restriction', 'permission.rate.limit', 'permission.session'])->prefix('admin/permissions')->group(function () {
            // Temporary Permissions
            Route::post('/grant-temporary', [PermissionsController::class, 'grantTemporaryPermission']);
            Route::delete('/revoke-temporary/{tempPermissionId}', [PermissionsController::class, 'revokeTemporaryPermission']);
            Route::get('/temporary-permissions', [PermissionsController::class, 'listTemporaryPermissions']);
            Route::post('/check-temporary-permission', [PermissionsController::class, 'checkTemporaryPermission']);

            // Permission Change Requests
            Route::post('/change-requests', [PermissionsController::class, 'createPermissionChangeRequest']);
            Route::get('/change-requests', [PermissionsController::class, 'listPermissionChangeRequests']);
            Route::get('/change-requests/{requestId}', [PermissionsController::class, 'showPermissionChangeRequest']);
            Route::post('/change-requests/{requestId}/approve', [PermissionsController::class, 'approvePermissionChangeRequest']);
            Route::post('/change-requests/{requestId}/reject', [PermissionsController::class, 'rejectPermissionChangeRequest']);
            Route::delete('/change-requests/{requestId}/cancel', [PermissionsController::class, 'cancelPermissionChangeRequest']);
        });
    });

});
