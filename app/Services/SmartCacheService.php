<?php

namespace App\Services;

use App\Models\Patient;
use App\Services\StatsService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SmartCacheService
{
    /**
     * Get cached dashboard statistics
     * TTL: 5 minutes - balances freshness with performance
     */
    public function getDashboardStats()
    {
        return Cache::remember('dashboard_stats', 300, function () { // 5 minutes
            return app(StatsService::class)->getDailyPatientStats();
        });
    }

    /**
     * Get patient with recent appointments (cached)
     * TTL: 15 minutes - patient data changes moderately
     */
    public function getPatientWithAppointments(int $patientId)
    {
        $cacheKey = "patient_{$patientId}_with_appts";

        return Cache::remember($cacheKey, 900, function () use ($patientId) { // 15 minutes
            return Patient::with(['appointments' => function ($q) {
                $q->where('appointment_date', '>', now()->subMonths(6))
                  ->orderBy('appointment_date', 'desc');
            }])->find($patientId);
        });
    }

    /**
     * Get doctor list with basic info (cached)
     * TTL: 1 hour - doctor info changes infrequently
     */
    public function getDoctorsList()
    {
        return Cache::remember('doctors_list', 3600, function () { // 1 hour
            return \App\Models\Doctor::select('id', 'first_name', 'last_name', 'specialization', 'status')
                ->where('status', 'active')
                ->orderBy('last_name')
                ->get();
        });
    }

    /**
     * Get department list (cached)
     * TTL: 2 hours - department data is very stable
     */
    public function getDepartmentsList()
    {
        return Cache::remember('departments_list', 7200, function () { // 2 hours
            return \App\Models\Department::select('id', 'name', 'description')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Clear patient cache when updated
     */
    public function clearPatientCache(int $patientId)
    {
        Cache::forget("patient_{$patientId}_with_appts");
    }

    /**
     * Clear all dashboard caches
     */
    public function clearDashboardCache()
    {
        Cache::forget('dashboard_stats');
    }

    /**
     * Get cached growth metrics (longer cache since less frequent updates)
     * TTL: 4 hours - growth metrics don't need real-time updates
     */
    public function getGrowthMetrics()
    {
        return Cache::remember('growth_metrics', 14400, function () { // 4 hours
            return app(StatsService::class)->getGrowthMetrics();
        });
    }

    /**
     * Get current cache statistics for monitoring
     */
    public function getCacheStats(): array
    {
        return [
            'cache_driver' => config('cache.default'),
            'cache_keys' => [
                'dashboard_stats' => Cache::has('dashboard_stats'),
                'doctors_list' => Cache::has('doctors_list'),
                'departments_list' => Cache::has('departments_list'),
                'growth_metrics' => Cache::has('growth_metrics'),
            ],
            'file_cache_size' => $this->getFileCacheSize(),
        ];
    }

    /**
     * Get file cache directory size (for file-based caching)
     */
    private function getFileCacheSize(): string
    {
        $cachePath = storage_path('framework/cache/data');
        if (!file_exists($cachePath)) {
            return '0 B';
        }

        $size = 0;
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($cachePath));

        foreach ($files as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $this->formatBytes($size);
    }

    /**
     * Get cached appointment statistics
     * TTL: 10 minutes - appointment data changes frequently
     */
    public function getAppointmentStats()
    {
        return Cache::remember('appointment_stats', 600, function () { // 10 minutes
            return [
                'today' => DB::table('appointments')
                    ->whereDate('appointment_date', today())
                    ->count(),
                'upcoming' => DB::table('appointments')
                    ->where('appointment_date', '>', now())
                    ->count(),
                'by_status' => DB::table('appointments')
                    ->selectRaw('status, COUNT(*) as count')
                    ->groupBy('status')
                    ->pluck('count', 'status')
                    ->toArray(),
                'total_this_month' => DB::table('appointments')
                    ->whereYear('appointment_date', now()->year)
                    ->whereMonth('appointment_date', now()->month)
                    ->count(),
            ];
        });
    }

    /**
     * Get cached patient report with recent activity
     * TTL: 15 minutes - patient data changes moderately
     */
    public function getPatientReport(int $patientId)
    {
        $cacheKey = "patient_report_{$patientId}";
        return Cache::tags(['patient_reports', "patient_{$patientId}"])
            ->remember($cacheKey, 900, function () use ($patientId) {
                return Patient::with([
                    'appointments' => function ($q) {
                        $q->where('appointment_date', '>', now()->subMonths(6))
                          ->orderBy('appointment_date', 'desc');
                    },
                    'bills' => function ($q) {
                        $q->where('created_at', '>', now()->subMonths(6))
                          ->orderBy('created_at', 'desc');
                    },
                    'labTestResults' => function ($q) {
                        $q->where('created_at', '>', now()->subMonths(3))
                          ->orderBy('created_at', 'desc');
                    }
                ])->find($patientId);
            });
    }

    /**
     * Get cached medicine inventory summary
     * TTL: 30 minutes - inventory changes regularly
     */
    public function getMedicineInventorySummary()
    {
        return Cache::remember('medicine_inventory_summary', 1800, function () { // 30 minutes
            return DB::table('medicines')
                ->selectRaw('
                    COUNT(*) as total_medicines,
                    SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_count,
                    SUM(CASE WHEN expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon_count,
                    AVG(stock_quantity) as avg_stock_level
                ')
                ->first();
        });
    }

    /**
     * Get cached department workload statistics
     * TTL: 20 minutes - workload data changes moderately
     */
    public function getDepartmentWorkload()
    {
        return Cache::remember('department_workload', 1200, function () { // 20 minutes
            return DB::table('doctors')
                ->join('departments', 'doctors.department_id', '=', 'departments.id')
                ->leftJoin('appointments', function ($join) {
                    $join->on('doctors.id', '=', 'appointments.doctor_id')
                         ->where('appointments.appointment_date', '>=', now()->startOfMonth())
                         ->where('appointments.appointment_date', '<=', now()->endOfMonth());
                })
                ->selectRaw('
                    departments.name,
                    COUNT(doctors.id) as doctor_count,
                    COUNT(appointments.id) as appointment_count,
                    AVG(CASE WHEN appointments.id IS NOT NULL THEN 1 ELSE 0 END) as avg_appointments_per_doctor
                ')
                ->groupBy('departments.id', 'departments.name')
                ->get();
        });
    }

    /**
     * Clear patient-related caches when patient data changes
     */
    public function clearPatientCaches(int $patientId)
    {
        Cache::tags(["patient_{$patientId}"])->flush();
        $this->clearDashboardCache(); // If patient stats affect dashboard
    }

    /**
     * Clear appointment-related caches
     */
    public function clearAppointmentCaches()
    {
        Cache::forget('appointment_stats');
        Cache::forget('department_workload');
        $this->clearDashboardCache();
    }

    /**
     * Clear medicine-related caches
     */
    public function clearMedicineCaches()
    {
        Cache::forget('medicine_inventory_summary');
    }

    /**
     * Get enhanced cache statistics
     */
    public function getEnhancedCacheStats(): array
    {
        return [
            'cache_driver' => config('cache.default'),
            'cache_keys' => [
                'dashboard_stats' => Cache::has('dashboard_stats'),
                'doctors_list' => Cache::has('doctors_list'),
                'departments_list' => Cache::has('departments_list'),
                'growth_metrics' => Cache::has('growth_metrics'),
                'appointment_stats' => Cache::has('appointment_stats'),
                'medicine_inventory_summary' => Cache::has('medicine_inventory_summary'),
                'department_workload' => Cache::has('department_workload'),
            ],
            'file_cache_size' => $this->getFileCacheSize(),
            'cache_hit_ratio' => $this->calculateCacheHitRatio(),
        ];
    }

    /**
     * Calculate cache hit ratio (simplified version)
     */
    private function calculateCacheHitRatio(): string
    {
        // This is a simplified calculation - in production you'd track hits/misses
        $totalKeys = count($this->getEnhancedCacheStats()['cache_keys']);
        $activeKeys = count(array_filter($this->getEnhancedCacheStats()['cache_keys']));

        if ($totalKeys === 0) return '0%';

        return round(($activeKeys / $totalKeys) * 100, 1) . '%';
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}