import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle, Archive, Sun } from 'lucide-react';
import { router } from '@inertiajs/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setError(null);
        
        try {
            // Get CSRF token from cookie for proper authentication
            const getCsrfToken = () => {
                const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                return match ? decodeURIComponent(match[1]) : null;
            };
            
            const response = await fetch('/api/v1/refresh/all-today-data', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getCsrfToken() || '',
                },
                credentials: 'include'
            });
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Response might be HTML or Inertia response - still consider it success if status is 200
                if (response.ok) {
                    data = { success: true, message: 'Day ended successfully' };
                } else {
                    throw new Error('Unexpected response format');
                }
            }
            
            if (response.ok && (data.success || data.props)) {
                setLastRefreshed(new Date().toLocaleTimeString());
                setIsDialogOpen(false); // Close dialog on success
                // Reload current page to reflect fresh data from database
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
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button 
                        disabled={isRefreshing}
                        variant={error ? "destructive" : variant}
                        size={size}
                        className={`
                            ${variant === 'default' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''}
                            ${isRefreshing ? 'opacity-75' : ''}
                            transition-all duration-200
                        `}
                    >
                        {isRefreshing ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                {showLabel && 'Starting New Day...'}
                            </>
                        ) : error ? (
                            <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                {showLabel && 'Retry'}
                            </>
                        ) : lastRefreshed ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {showLabel && 'Day Started'}
                            </>
                        ) : (
                            <>
                                <Sun className="h-4 w-4 mr-2" />
                                {showLabel && 'Start New Day'}
                            </>
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Sun className="h-5 w-5 text-amber-500" />
                            End of Day / Start New Day
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <p>
                                This will <strong>archive</strong> today's data to the database as a historical record, 
                                then <strong>clear the cache</strong> so pages show fresh data from the database.
                            </p>
                            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg space-y-2">
                                <p className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-2">
                                    <Sun className="h-4 w-4" />
                                    End of Day System
                                </p>
                                <ul className="text-sm text-amber-600 dark:text-amber-400 list-disc list-inside space-y-1">
                                    <li>Current "today" data is archived to daily_snapshots table</li>
                                    <li>Cache is cleared to show fresh database data</li>
                                    <li>Like closing the register at end of business day</li>
                                    <li>All pages reload automatically with fresh data</li>
                                </ul>
                            </div>
                            <p className="text-amber-600 dark:text-amber-500 font-medium text-sm">
                                Current data will be saved as a snapshot before clearing cache.
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                handleRefresh();
                            }} 
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            End Day & Start Fresh
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            {lastRefreshed && !isRefreshing && !error && (
                <span className="text-xs text-muted-foreground hidden md:inline flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    New day started at: {lastRefreshed}
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
