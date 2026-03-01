<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\v1\PatientController;
use App\Http\Controllers\API\v1\DoctorController;
use App\Http\Controllers\API\v1\AppointmentController;
use App\Http\Controllers\API\v1\DepartmentController;
use App\Http\Controllers\API\v1\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Admin\PermissionsController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\API\v1\MedicineController as ApiMedicineController;
use App\Http\Controllers\API\v1\SalesController as ApiSalesController;
use App\Http\Controllers\API\v1\StockController as ApiStockController;
use App\Http\Controllers\API\v1\AlertController as ApiAlertController;
use App\Http\Controllers\API\v1\PurchaseController as ApiPurchaseController;
use App\Http\Controllers\API\v1\MedicineCategoryController as ApiMedicineCategoryController;
use App\Http\Controllers\API\v1\ReportController as ApiReportController;
use App\Http\Controllers\API\v1\DashboardController as ApiDashboardController;
use App\Http\Controllers\API\v1\RefreshDataController;
use App\Http\Controllers\API\v1\DayStatusController;
use App\Http\Controllers\WalletController;

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

    // Protected routes with Sanctum authentication (for API compatibility)
    Route::middleware(['auth:sanctum'])->group(function () {
        // Patient routes
        Route::apiResource('patients', PatientController::class)->names('api.patients');

        // Doctor routes
        Route::apiResource('doctors', DoctorController::class)->names('api.doctors');

        // Appointment routes
        Route::apiResource('appointments', AppointmentController::class)->names('api.appointments');

        // Department routes
        Route::apiResource('departments', DepartmentController::class)->names('api.departments');

        // Additional appointment routes
        Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}/complete', [AppointmentController::class, 'complete']);

        // Admin routes - protected with permission checks
        Route::middleware('check.permission:view-admin-dashboard')->group(function () {
            Route::get('/admin/recent-activity', [AdminController::class, 'getRecentActivity']);
            Route::get('/admin/stats', [AdminController::class, 'getStats']);
        });
        
        Route::middleware('check.permission:view-activity-logs')->group(function () {
            Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);
            Route::get('/admin/audit-analytics', [AdminController::class, 'getAuditAnalytics']);
        });

        // Notification routes
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/notifications/recent', [NotificationController::class, 'recent']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

        // Permission Management routes with additional security middleware and permission checks
        Route::middleware([
            'permission.ip.restriction',
            'permission.rate.limit',
            'permission.session',
            'check.permission:manage-permissions'
        ])->prefix('admin/permissions')->group(function () {
            // Temporary Permissions
            Route::post('/grant-temporary', [PermissionsController::class, 'grantTemporaryPermission'])
                ->middleware('check.permission:grant-temporary-permissions');
            Route::delete('/revoke-temporary/{tempPermissionId}', [PermissionsController::class, 'revokeTemporaryPermission'])
                ->middleware('check.permission:revoke-temporary-permissions');
            Route::get('/temporary-permissions', [PermissionsController::class, 'listTemporaryPermissions'])
                ->middleware('check.permission:view-temporary-permissions');
            Route::post('/check-temporary-permission', [PermissionsController::class, 'checkTemporaryPermission'])
                ->middleware('check.permission:view-temporary-permissions');

            // Permission Change Requests
            Route::post('/change-requests', [PermissionsController::class, 'createPermissionChangeRequest'])
                ->middleware('check.permission:create-permission-requests');
            Route::get('/change-requests', [PermissionsController::class, 'listPermissionChangeRequests'])
                ->middleware('check.permission:view-permission-requests');
            Route::get('/change-requests/{requestId}', [PermissionsController::class, 'showPermissionChangeRequest'])
                ->middleware('check.permission:view-permission-requests');
            Route::post('/change-requests/{requestId}/approve', [PermissionsController::class, 'approvePermissionChangeRequest'])
                ->middleware('check.permission:approve-permission-requests');
            Route::post('/change-requests/{requestId}/reject', [PermissionsController::class, 'rejectPermissionChangeRequest'])
                ->middleware('check.permission:reject-permission-requests');
            Route::delete('/change-requests/{requestId}/cancel', [PermissionsController::class, 'cancelPermissionChangeRequest'])
                ->middleware('check.permission:cancel-permission-requests');
        });


        // Dashboard routes
        Route::prefix('dashboard')->group(function () {
            Route::get('/data', [DashboardController::class, 'data']);
            Route::get('/realtime', [DashboardController::class, 'realtime']);
        });

        // Pharmacy routes
        Route::prefix('pharmacy')->group(function () {
            // Medicines
            Route::apiResource('medicines', ApiMedicineController::class);
            Route::get('medicines/{medicine}/stock-history', [ApiMedicineController::class, 'stockHistory']);
            Route::post('medicines/{medicine}/adjust-stock', [ApiMedicineController::class, 'adjustStock']);

            // Medicine Categories
            Route::apiResource('categories', ApiMedicineCategoryController::class);

            // Sales
            Route::apiResource('sales', ApiSalesController::class);
            Route::post('sales/{sale}/void', [ApiSalesController::class, 'void']);
            Route::get('sales/{sale}/receipt', [ApiSalesController::class, 'receipt']);
            Route::get('sales/{sale}/items', [ApiSalesController::class, 'items']);

            // Stock Management
            Route::get('stock', [ApiStockController::class, 'index']);
            Route::get('stock/movements', [ApiStockController::class, 'movements']);
            Route::post('stock/adjust', [ApiStockController::class, 'adjust']);
            Route::get('stock/valuation', [ApiStockController::class, 'valuation']);
            Route::get('stock/alerts', [ApiStockController::class, 'alerts']);

            // Purchases
            Route::apiResource('purchases', ApiPurchaseController::class);
            Route::post('purchases/{purchase}/receive', [ApiPurchaseController::class, 'receive']);
            Route::post('purchases/{purchase}/cancel', [ApiPurchaseController::class, 'cancel']);

            // Alerts
            Route::get('alerts', [ApiAlertController::class, 'index']);
            Route::get('alerts/pending', [ApiAlertController::class, 'pending']);
            Route::post('alerts/{alert}/resolve', [ApiAlertController::class, 'resolve']);
            Route::get('alerts/expiry-risk', [ApiAlertController::class, 'expiryRisk']);

            // Reports
            Route::get('reports/dashboard', [ApiReportController::class, 'dashboard']);
            Route::get('reports/sales', [ApiReportController::class, 'sales']);
            Route::get('reports/stock', [ApiReportController::class, 'stock']);
            Route::get('reports/expiry', [ApiReportController::class, 'expiry']);

            // Dashboard
            Route::get('dashboard/stats', [ApiDashboardController::class, 'stats']);
            Route::get('dashboard/activities', [ApiDashboardController::class, 'recentActivities']);
        });
    });

    // Wallet routes outside sanctum group - using session-based auth (web guard)
    // Note: API routes need 'web' middleware to enable session authentication
    Route::prefix('wallet')->middleware(['web', 'auth'])->group(function () {
        Route::get('/realtime', [WalletController::class, 'realtime']);
        Route::get('/today-revenue', [WalletController::class, 'calculateTodayRevenue']);
        Route::get('/reset-all-revenue', [WalletController::class, 'resetAllRevenueData']);
    });

    // Refresh All Data route - updates all "today" data across the application
    // Using GET to avoid CSRF issues
    Route::prefix('refresh')->middleware(['web', 'auth'])->group(function () {
        Route::get('/all-today-data', [RefreshDataController::class, 'refreshAllTodayData']);
    });

    // Day Status routes - for smart day detection system
    Route::prefix('day-status')->middleware(['web', 'auth'])->group(function () {
        Route::get('/status', [DayStatusController::class, 'getStatus']);
        Route::post('/archive', [DayStatusController::class, 'archiveDay']);
        Route::get('/yesterday-summary', [DayStatusController::class, 'getYesterdaySummary']);
    });

    // Permission Monitoring routes - protected with permission checks
    Route::prefix('permission-monitoring')->middleware(['web', 'auth', 'check.permission:view-permission-monitoring'])->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'dashboard']);
        Route::get('/metrics', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'metrics']);
        Route::get('/alerts', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'alerts']);
        Route::get('/alert-statistics', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'alertStatistics']);
        Route::get('/health-status', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'healthStatus']);
        Route::post('/acknowledge-alert/{alert}', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'acknowledgeAlert'])
            ->middleware('check.permission:manage-permission-alerts');
        Route::post('/resolve-alert/{alert}', [App\Http\Controllers\API\v1\PermissionMonitoringController::class, 'resolveAlert'])
            ->middleware('check.permission:manage-permission-alerts');
    });
});


