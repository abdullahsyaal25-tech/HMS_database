import { useEffect, useState, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { Shield, AlertTriangle, Lock, X, Bell, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SecurityAlert {
    id: string;
    type: 'unauthorized_access' | 'privilege_escalation' | 'anomaly_detected' | 'permission_change' | 'session_alert';
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    read: boolean;
}

export interface SecurityAlertListenerProps {
    userId?: number;
    isAdmin?: boolean;
    maxAlerts?: number;
    position?: 'top-right' | 'bottom-right';
}

interface AlertItemProps {
    alert: SecurityAlert;
    onDismiss: (id: string) => void;
    onMarkAsRead: (id: string) => void;
}

const severityConfig: Record<SecurityAlert['severity'], {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    borderColor: string;
    badge: string;
}> = {
    critical: {
        icon: ShieldAlert,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badge: 'bg-red-100 text-red-800 border-red-200',
    },
    high: {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
    },
    medium: {
        icon: Shield,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    low: {
        icon: ShieldCheck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
    },
};

const alertTypeLabels: Record<SecurityAlert['type'], string> = {
    unauthorized_access: 'Unauthorized Access',
    privilege_escalation: 'Privilege Escalation',
    anomaly_detected: 'Anomaly Detected',
    permission_change: 'Permission Change',
    session_alert: 'Session Alert',
};

const positionClasses: Record<string, string> = {
    'top-right': 'top-20 right-4',
    'bottom-right': 'bottom-4 right-4',
};

function AlertItem({ alert, onDismiss, onMarkAsRead }: AlertItemProps) {
    const config = severityConfig[alert.severity];
    const Icon = config.icon;
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border shadow-lg transition-all duration-300',
                'animate-in slide-in-from-right-full fade-in duration-300',
                config.bgColor,
                config.borderColor,
                !alert.read && 'ring-2 ring-offset-1',
                alert.severity === 'critical' && !alert.read && 'ring-red-400',
                alert.severity === 'high' && !alert.read && 'ring-orange-400',
                alert.severity === 'medium' && !alert.read && 'ring-amber-400',
                alert.severity === 'low' && !alert.read && 'ring-blue-400'
            )}
            role="alert"
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className={cn('mt-0.5 flex-shrink-0', config.color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn('font-semibold text-sm', config.color)}>
                                {alertTypeLabels[alert.type]}
                            </h4>
                            <Badge variant="outline" className={cn('text-xs', config.badge)}>
                                {alert.severity.toUpperCase()}
                            </Badge>
                            {!alert.read && (
                                <span className="relative flex h-2 w-2">
                                    <span className={cn(
                                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                                        alert.severity === 'critical' && 'bg-red-400',
                                        alert.severity === 'high' && 'bg-orange-400',
                                        alert.severity === 'medium' && 'bg-amber-400',
                                        alert.severity === 'low' && 'bg-blue-400'
                                    )}></span>
                                    <span className={cn(
                                        'relative inline-flex rounded-full h-2 w-2',
                                        alert.severity === 'critical' && 'bg-red-500',
                                        alert.severity === 'high' && 'bg-orange-500',
                                        alert.severity === 'medium' && 'bg-amber-500',
                                        alert.severity === 'low' && 'bg-blue-500'
                                    )}></span>
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                        </p>
                        
                        {alert.details && isExpanded && (
                            <div className="mt-2 p-2 bg-white/50 rounded text-xs font-mono overflow-x-auto">
                                <pre>{JSON.stringify(alert.details, null, 2)}</pre>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                            <div className="flex items-center gap-1">
                                {alert.details && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                    >
                                        {isExpanded ? 'Less' : 'More'}
                                    </Button>
                                )}
                                {!alert.read && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={() => onMarkAsRead(alert.id)}
                                    >
                                        Mark read
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-1 -mt-1 opacity-60 hover:opacity-100"
                        onClick={() => onDismiss(alert.id)}
                        aria-label="Dismiss alert"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function SecurityAlertListener({
    userId,
    isAdmin = false,
    maxAlerts = 10,
    position = 'top-right',
}: SecurityAlertListenerProps) {
    const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const echoRef = useRef<any>(null);
    const page = usePage();
    
    // Get user info from page props if not provided
    const currentUserId = userId || (page.props.auth as any)?.user?.id;
    const userIsAdmin = isAdmin || (page.props.auth as any)?.user?.role === 'Super Admin';

    // Add a new alert
    const addAlert = useCallback((alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'read'>) => {
        const newAlert: SecurityAlert = {
            ...alertData,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            read: false,
        };

        setAlerts((prev) => {
            const updated = [newAlert, ...prev];
            // Keep only the most recent alerts
            return updated.slice(0, maxAlerts);
        });
        
        setUnreadCount((prev) => prev + 1);
    }, [maxAlerts]);

    // Dismiss an alert
    const dismissAlert = useCallback((id: string) => {
        setAlerts((prev) => {
            const alert = prev.find(a => a.id === id);
            if (alert && !alert.read) {
                setUnreadCount((count) => Math.max(0, count - 1));
            }
            return prev.filter((a) => a.id !== id);
        });
    }, []);

    // Mark alert as read
    const markAsRead = useCallback((id: string) => {
        setAlerts((prev) =>
            prev.map((a) =>
                a.id === id ? { ...a, read: true } : a
            )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(() => {
        setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
        setUnreadCount(0);
    }, []);

    // Clear all alerts
    const clearAll = useCallback(() => {
        setAlerts([]);
        setUnreadCount(0);
    }, []);

    // Connect to Laravel Echo for real-time alerts (only for admins)
    useEffect(() => {
        if (!userIsAdmin) {
            return;
        }

        // Check if Echo is available (Laravel Echo should be initialized globally)
        const echo = (window as any).Echo;
        
        if (!echo) {
            console.warn('[SecurityAlertListener] Laravel Echo not found. Real-time alerts disabled.');
            return;
        }

        echoRef.current = echo;

        try {
            // Subscribe to the private admin security alerts channel
            echo.private('admin.security-alerts')
                .listen('.security.alert', (event: {
                    type: SecurityAlert['type'];
                    data: {
                        severity?: SecurityAlert['severity'];
                        message?: string;
                        details?: Record<string, unknown>;
                    };
                }) => {
                    addAlert({
                        type: event.type || 'anomaly_detected',
                        severity: event.data?.severity || 'medium',
                        message: event.data?.message || 'Security alert received',
                        details: event.data?.details,
                    });
                });

            setIsConnected(true);
            console.log('[SecurityAlertListener] Connected to security alerts channel');
        } catch (error) {
            console.error('[SecurityAlertListener] Failed to connect:', error);
            setIsConnected(false);
        }

        return () => {
            if (echoRef.current) {
                try {
                    echoRef.current.leave('admin.security-alerts');
                } catch (error) {
                    console.error('[SecurityAlertListener] Error leaving channel:', error);
                }
            }
        };
    }, [userIsAdmin, addAlert]);

    // Listen for custom events (for testing or programmatic alerts)
    useEffect(() => {
        const handleSecurityAlert = (event: CustomEvent<{
            type: SecurityAlert['type'];
            severity: SecurityAlert['severity'];
            message: string;
            details?: Record<string, unknown>;
        }>) => {
            const { type, severity, message, details } = event.detail;
            addAlert({ type, severity, message, details });
        };

        window.addEventListener('security-alert' as any, handleSecurityAlert as any);
        return () => {
            window.removeEventListener('security-alert' as any, handleSecurityAlert as any);
        };
    }, [addAlert]);

    // Don't render if user is not an admin and there are no alerts
    if (!userIsAdmin && alerts.length === 0) {
        return null;
    }

    return (
        <div className={cn('fixed z-[100] flex flex-col gap-2', positionClasses[position])}>
            {/* Connection status indicator */}
            {userIsAdmin && (
                <div className="flex items-center justify-end gap-2">
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {unreadCount} new
                        </Badge>
                    )}
                    <div className={cn(
                        'flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-background border',
                        isConnected ? 'text-green-600 border-green-200' : 'text-gray-400 border-gray-200'
                    )}>
                        <Bell className="h-3 w-3" />
                        {isConnected ? 'Live' : 'Offline'}
                    </div>
                    {alerts.length > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={markAllAsRead}
                            >
                                Mark all read
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={clearAll}
                            >
                                Clear all
                            </Button>
                        </>
                    )}
                </div>
            )}

            {/* Alerts list */}
            <div className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {alerts.map((alert) => (
                    <AlertItem
                        key={alert.id}
                        alert={alert}
                        onDismiss={dismissAlert}
                        onMarkAsRead={markAsRead}
                    />
                ))}
            </div>
        </div>
    );
}

// Helper function to trigger security alerts programmatically (for testing)
export function triggerSecurityAlert(
    type: SecurityAlert['type'],
    severity: SecurityAlert['severity'],
    message: string,
    details?: Record<string, unknown>
) {
    const event = new CustomEvent('security-alert', {
        detail: { type, severity, message, details },
    });
    window.dispatchEvent(event);
}

export default SecurityAlertListener;
