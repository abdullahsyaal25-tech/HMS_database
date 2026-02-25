import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface RefreshAllDataButtonProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showLabel?: boolean;
    className?: string;
}

export default function RefreshAllDataButton({
    variant = 'default',
    size = 'default',
    showLabel = true,
    className = ''
}: RefreshAllDataButtonProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setError(null);
        
        // Get CSRF token from meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        try {
            const response = await fetch('/api/v1/refresh/all-today-data', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setLastRefreshed(new Date().toLocaleTimeString());
                // Reload current page to reflect new data
                router.reload();
            } else {
                setError(data.message || 'Failed to refresh data');
            }
        } catch (err) {
            console.error('Failed to refresh data:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant={error ? "destructive" : variant}
                size={size}
                className={`
                    ${variant === 'default' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : ''}
                    ${isRefreshing ? 'opacity-75' : ''}
                    transition-all duration-200
                `}
            >
                {isRefreshing ? (
                    <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        {showLabel && 'Refreshing...'}
                    </>
                ) : error ? (
                    <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {showLabel && 'Retry'}
                    </>
                ) : lastRefreshed ? (
                    <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {showLabel && `Refreshed`}
                    </>
                ) : (
                    <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {showLabel && 'Refresh All Data'}
                    </>
                )}
            </Button>
            
            {lastRefreshed && !isRefreshing && !error && (
                <span className="text-xs text-muted-foreground hidden md:inline">
                    Last updated: {lastRefreshed}
                </span>
            )}
            
            {error && (
                <span className="text-xs text-red-500 hidden md:inline">
                    {error}
                </span>
            )}
        </div>
    );
}
