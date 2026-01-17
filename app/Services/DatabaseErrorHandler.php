<?php

namespace App\Services;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseErrorHandler
{
    /**
     * Handle QueryException with detailed logging and specific error types
     */
    public static function handleQueryException(\Illuminate\Database\QueryException $e, string $context = '')
    {
        $errorCode = $e->getCode();
        $errorMessage = $e->getMessage();

        // Log detailed error for monitoring
        Log::error("Database Error in {$context}", [
            'code' => $errorCode,
            'message' => $errorMessage,
            'sql' => $e->getSql(),
            'bindings' => $e->getBindings(),
            'trace' => $e->getTraceAsString(),
            'context' => $context
        ]);

        // Handle specific error types and throw appropriate exceptions
        switch ($errorCode) {
            case 23000: // Integrity constraint violation
                throw new \InvalidArgumentException('Data integrity violation: ' . $errorMessage, 0, $e);
            case 1045: // Access denied
                throw new \RuntimeException('Database access denied', 0, $e);
            case 2006: // MySQL server gone away
                throw new \RuntimeException('Database connection lost', 0, $e);
            case 1062: // Duplicate entry
                throw new \InvalidArgumentException('Duplicate entry found', 0, $e);
            case 1451: // Foreign key constraint fails
                throw new \InvalidArgumentException('Cannot delete: related records exist', 0, $e);
            default:
                throw new \RuntimeException('Database operation failed: ' . $errorMessage, 0, $e);
        }
    }

    /**
     * Handle general database exceptions
     */
    public static function handleException(\Exception $e, string $context = '')
    {
        Log::error("General database exception in {$context}", [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'context' => $context
        ]);

        throw new \RuntimeException('Database operation failed: ' . $e->getMessage(), 0, $e);
    }

    /**
     * Check database connection health
     */
    public static function checkConnection(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            Log::error('Database connection check failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get database performance metrics
     */
    public static function getPerformanceMetrics(): array
    {
        $connection = DB::connection();

        try {
            // Get connection info
            $pdo = $connection->getPdo();

            // Get MySQL status if available
            $status = [];
            if ($pdo) {
                $result = $pdo->query("SHOW PROCESSLIST");
                $status = $result->fetchAll(\PDO::FETCH_ASSOC);
            }

            return [
                'connection_status' => self::checkConnection(),
                'active_connections' => count($status),
                'query_log_count' => count(DB::getQueryLog()),
                'slow_queries' => collect(DB::getQueryLog())
                    ->where('time', '>', 100)
                    ->count()
            ];
        } catch (\Exception $e) {
            return [
                'connection_status' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}