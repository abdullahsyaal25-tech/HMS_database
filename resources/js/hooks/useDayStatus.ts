import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';

// Helper function to get CSRF token
const getCsrfToken = (): string | null => {
    // Try window.csrfToken first (Inertia default)
    if (typeof window !== 'undefined' && (window as any).csrfToken) {
        return (window as any).csrfToken;
    }
    // Fallback to meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
};

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
    appointments_revenue: number;
    pharmacy_revenue: number;
    laboratory_revenue: number;
    departments_revenue: number;
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
            
            console.log('[DayStatus] archiveDay called - starting archive process');
            
            // Get CSRF token for the request
            const csrfToken = getCsrfToken();
            console.log('[DayStatus] CSRF token found:', csrfToken ? 'yes' : 'no');
            
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            };
            
            // Add CSRF token if available
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }
            
            const response = await fetch('/api/v1/day-status/archive', {
                method: 'POST',
                headers,
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[DayStatus] archiveDay response:', data);
            
            if (data.success) {
                // Refresh status after archiving
                console.log('[DayStatus] Archive successful, refreshing status...');
                await fetchDayStatus();
                await fetchYesterdaySummary();
                
                // Force a full page reload with cache-busting to ensure all server props are refreshed
                // This ensures the Wallet and other pages get fresh data with the new day_end_timestamp
                console.log('[DayStatus] Reloading page with cache-busting to get fresh data...');
                // Add a timestamp to prevent browser caching
                const cacheBuster = '__t=' + Date.now();
                const currentUrl = window.location.href;
                const separator = currentUrl.includes('?') ? '&' : '?';
                window.location.href = currentUrl + separator + cacheBuster;
                
                return true;
            } else {
                throw new Error(data.message || 'Failed to archive day');
            }
        } catch (err) {
            console.error('[DayStatus] Failed to archive day:', err);
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