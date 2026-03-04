<?php

namespace App\Services;

use App\Models\PermissionAlert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PermissionAlertNotification;

/**
 * Permission Alert Service - DEACTIVATED
 * 
 * This service has been deactivated as part of RBAC cleanup.
 * All methods now return safe default values.
 * 
 * @deprecated This service is no longer in use
 */
class PermissionAlertService
{
    protected $config;

    /**
     * Constructor - now disabled.
     */
    public function __construct()
    {
        $this->config = config('permission-monitoring', []);
    }

    /**
     * Create a new alert - Returns null.
     */
    public function createAlert(string $alertType, string $title, string $message, array $data = [], int $userId = null)
    {
        // Deactivated - always return null
        return null;
    }

    /**
     * Handle alert actions - Does nothing.
     */
    protected function handleAlert(PermissionAlert $alert): void
    {
        // Deactivated
    }

    /**
     * Send email alert - Does nothing.
     */
    protected function sendEmailAlert(PermissionAlert $alert): void
    {
        // Deactivated
    }

    /**
     * Send in-app notification - Does nothing.
     */
    protected function sendInAppNotification(PermissionAlert $alert): void
    {
        // Deactivated
    }

    /**
     * Get all alerts - Returns empty collection.
     */
    public function getAllAlerts(string $status = null)
    {
        return collect();
    }

    /**
     * Get alerts by type - Returns empty collection.
     */
    public function getAlertsByType(string $alertType)
    {
        return collect();
    }

    /**
     * Get user alerts - Returns empty collection.
     */
    public function getUserAlerts(int $userId)
    {
        return collect();
    }

    /**
     * Get active alerts - Returns empty collection.
     */
    public function getActiveAlerts()
    {
        return collect();
    }

    /**
     * Get resolved alerts - Returns empty collection.
     */
    public function getResolvedAlerts(int $limit = 100)
    {
        return collect();
    }

    /**
     * Resolve alert - Does nothing.
     */
    public function resolveAlert(int $alertId): void
    {
        // Deactivated
    }

    /**
     * Dismiss alert - Does nothing.
     */
    public function dismissAlert(int $alertId): void
    {
        // Deactivated
    }

    /**
     * Bulk resolve alerts - Does nothing.
     */
    public function bulkResolveAlerts(array $alertIds): void
    {
        // Deactivated
    }

    /**
     * Delete old alerts - Does nothing.
     */
    public function deleteOldAlerts(int $days = 30): void
    {
        // Deactivated
    }

    /**
     * Get alert statistics - Returns empty array.
     */
    public function getAlertStatistics(): array
    {
        return [];
    }

    /**
     * Get alert count by type - Returns empty array.
     */
    public function getAlertCountByType(): array
    {
        return [];
    }

    /**
     * Get alert trends - Returns empty array.
     */
    public function getAlertTrends(int $days = 7): array
    {
        return [];
    }

    /**
     * Check if alerts are enabled - Always returns false.
     */
    public function isAlertsEnabled(): bool
    {
        return false;
    }

    /**
     * Enable alerts - Does nothing.
     */
    public function enableAlerts(): void
    {
        // Deactivated
    }

    /**
     * Disable alerts - Does nothing.
     */
    public function disableAlerts(): void
    {
        // Deactivated
    }

    /**
     * Configure alert thresholds - Does nothing.
     */
    public function configureAlertThresholds(array $thresholds): void
    {
        // Deactivated
    }

    /**
     * Get alert thresholds - Returns empty array.
     */
    public function getAlertThresholds(): array
    {
        return [];
    }

    /**
     * Check threshold - Always returns false.
     */
    public function checkThreshold(string $alertType, $value): bool
    {
        return false;
    }

    /**
     * Trigger alert - Does nothing.
     */
    public function triggerAlert(string $alertType, string $title, string $message, array $data = []): void
    {
        // Deactivated
    }

    /**
     * Clear alert - Does nothing.
     */
    public function clearAlert(int $alertId): void
    {
        // Deactivated
    }

    /**
     * Export alerts - Returns empty array.
     */
    public function exportAlerts(array $filters = []): array
    {
        return [];
    }

    /**
     * Get alert configuration - Returns empty array.
     */
    public function getAlertConfiguration(): array
    {
        return [];
    }

    /**
     * Update alert configuration - Does nothing.
     */
    public function updateAlertConfiguration(array $config): void
    {
        // Deactivated
    }

    /**
     * Test alert notification - Does nothing.
     */
    public function testAlertNotification(string $type): void
    {
        // Deactivated
    }

    /**
     * Get notification channels - Returns empty array.
     */
    public function getNotificationChannels(): array
    {
        return [];
    }

    /**
     * Set notification channel - Does nothing.
     */
    public function setNotificationChannel(string $channel, bool $enabled): void
    {
        // Deactivated
    }

    /**
     * Get alert recipients - Returns empty array.
     */
    public function getAlertRecipients(string $alertType): array
    {
        return [];
    }

    /**
     * Add alert recipient - Does nothing.
     */
    public function addAlertRecipient(string $alertType, int $userId): void
    {
        // Deactivated
    }

    /**
     * Remove alert recipient - Does nothing.
     */
    public function removeAlertRecipient(string $alertType, int $userId): void
    {
        // Deactivated
    }

    /**
     * Get service status - Returns deactivated.
     */
    public function getServiceStatus(): array
    {
        return [
            'status' => 'deactivated',
            'message' => 'Permission alert service is deactivated',
        ];
    }

    /**
     * Create security alert - Returns null (deactivated).
     */
    public function createSecurityAlert(string $title, string $message, array $data = []): ?PermissionAlert
    {
        // Deactivated
        return null;
    }

    /**
     * Create critical alert - Returns null (deactivated).
     */
    public function createCriticalAlert(string $title, string $message, array $data = []): ?PermissionAlert
    {
        // Deactivated
        return null;
    }

    /**
     * Log failed attempt - Does nothing.
     */
    public function logFailedAttempt(array $data = []): void
    {
        // Deactivated
    }
}
