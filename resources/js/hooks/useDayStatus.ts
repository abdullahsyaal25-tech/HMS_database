import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

interface DayStatus {
    status: 'day_started' | 'new_day_available' | 'processing' | 'error';
    message: string;
    current_date: string;
    last_archived_date: string | null;
    new_day_available: boolean;
    day_end_timestamp: string | null;
    days_behind?: number;
}

interface YesterdaySummary {
    date: string;
    appointments_count: number;
    total_revenue: number;
    source: 'archived' | 'cached' | 'unavailable';
}

interface UseDayStatusReturn {
    dayStatus: DayStatus | null;
    yesterdaySummary: YesterdaySummary | null;
    isLoading: boolean;
    error: string | null;
    refreshStatus: () => Promise<void>;
    archiveDay: () => Promise<boolean>;
}

export function useDayStatus(): UseDayStatusReturn {
    const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);
    const [yesterdaySummary, setYesterdaySummary] = useState<YesterdaySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDayStatus = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch('/api/v1/day-status/status', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                setDayStatus(data.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Failed to fetch day status:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch day status');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchYesterdaySummary = useCallback(async () => {
        try {
            const response = await fetch('/api/v1/day-status/yesterday-summary', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                setYesterdaySummary(data.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Failed to fetch yesterday summary:', err);
        }
    }, []);

    const archiveDay = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch('/api/v1/day-status/archive', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Refresh status after archiving
                await fetchDayStatus();
                await fetchYesterdaySummary();
                
                // Reload Inertia props to refresh page data (appointments, stats, etc.)
                router.reload({ only: [] });
                
                return true;
            } else {
                throw new Error(data.message || 'Failed to archive day');
            }
        } catch (err) {
            console.error('Failed to archive day:', err);
            setError(err instanceof Error ? err.message : 'Failed to archive day');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchDayStatus, fetchYesterdaySummary]);

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchDayStatus();
        fetchYesterdaySummary();
        
        // Refresh every 5 minutes
        const interval = setInterval(() => {
            fetchDayStatus();
            fetchYesterdaySummary();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [fetchDayStatus, fetchYesterdaySummary]);

    return {
        dayStatus,
        yesterdaySummary,
        isLoading,
        error,
        refreshStatus: fetchDayStatus,
        archiveDay,
    };
}