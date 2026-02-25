<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySnapshot extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'snapshot_date',
        'appointments_count',
        'appointments_revenue',
        'pharmacy_sales_count',
        'pharmacy_revenue',
        'laboratory_count',
        'laboratory_revenue',
        'patients_count',
        'total_revenue',
        'metadata',
        'archived_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'snapshot_date' => 'date',
        'appointments_count' => 'integer',
        'appointments_revenue' => 'decimal:2',
        'pharmacy_sales_count' => 'integer',
        'pharmacy_revenue' => 'decimal:2',
        'laboratory_count' => 'integer',
        'laboratory_revenue' => 'decimal:2',
        'patients_count' => 'integer',
        'total_revenue' => 'decimal:2',
        'metadata' => 'array',
        'archived_at' => 'datetime',
    ];

    /**
     * Create a snapshot from cached data
     *
     * @param string $date
     * @param array $data
     * @return self
     */
    public static function createFromCacheData(string $date, array $data): self
    {
        // Support both old and new data structures for backwards compatibility
        // New structure (from RefreshDataController): today_sales, today_revenue, today_appointments, etc.
        // Old structure: sales_count, revenue, total, etc.
        
        $pharmacyData = $data['pharmacy'] ?? $data['frozen_data']['pharmacy'] ?? [];
        $appointmentsData = $data['appointments'] ?? $data['frozen_data']['appointments'] ?? [];
        $laboratoryData = $data['laboratory'] ?? $data['frozen_data']['laboratory'] ?? [];
        $patientsData = $data['patients'] ?? $data['frozen_data']['patients'] ?? [];
        $departmentsData = $data['departments'] ?? $data['frozen_data']['departments'] ?? [];
        
        // Calculate total revenue from all sources
        $pharmacyRevenue = $pharmacyData['today_revenue'] ?? $pharmacyData['revenue'] ?? 0;
        $appointmentsRevenue = $appointmentsData['today_revenue'] ?? $appointmentsData['revenue'] ?? 0;
        $laboratoryRevenue = $laboratoryData['today_revenue'] ?? $laboratoryData['revenue'] ?? 0;
        $departmentsRevenue = $departmentsData['today_revenue'] ?? 0;
        $totalRevenue = $pharmacyRevenue + $appointmentsRevenue + $laboratoryRevenue + $departmentsRevenue;
        
        return self::create([
            'snapshot_date' => $date,
            'appointments_count' => $appointmentsData['today_appointments'] ?? $appointmentsData['total'] ?? 0,
            'appointments_revenue' => $appointmentsRevenue,
            'pharmacy_sales_count' => $pharmacyData['today_sales'] ?? $pharmacyData['sales_count'] ?? 0,
            'pharmacy_revenue' => $pharmacyRevenue,
            'laboratory_count' => $laboratoryData['today_tests'] ?? $laboratoryData['total_tests'] ?? 0,
            'laboratory_revenue' => $laboratoryRevenue,
            'patients_count' => $patientsData['today_patients'] ?? $patientsData['total'] ?? 0,
            'total_revenue' => $totalRevenue,
            'metadata' => [
                'departments' => $departmentsData,
                'raw_data' => $data,
            ],
            'archived_at' => now(),
        ]);
    }

    /**
     * Get snapshots for a specific date
     *
     * @param string $date
     * @return self|null
     */
    public static function getByDate(string $date): ?self
    {
        return self::where('snapshot_date', $date)->latest()->first();
    }

    /**
     * Get all snapshots for a date range
     *
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getByDateRange(string $startDate, string $endDate)
    {
        return self::whereBetween('snapshot_date', [$startDate, $endDate])
            ->orderBy('snapshot_date', 'desc')
            ->get();
    }
}
