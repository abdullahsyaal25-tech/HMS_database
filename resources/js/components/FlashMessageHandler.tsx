import { useEffect, useState, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FlashMessageType = 'success' | 'error' | 'warning' | 'info';

export interface FlashMessage {
    id: string;
    type: FlashMessageType;
    message: string;
    title?: string;
    duration?: number;
}

export interface FlashMessageHandlerProps {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    defaultDuration?: number;
    maxMessages?: number;
}

interface ToastItemProps {
    message: FlashMessage;
    onDismiss: (id: string) => void;
    onPause: (id: string) => void;
    onResume: (id: string) => void;
}

const iconMap: Record<FlashMessageType, React.ComponentType<{ className?: string }>> = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const styleMap: Record<FlashMessageType, { bg: string; border: string; icon: string; title: string }> = {
    success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-900',
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
    },
    warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        title: 'text-amber-900',
    },
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-900',
    },
};

const titleMap: Record<FlashMessageType, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
};

const positionClasses: Record<string, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

function ToastItem({ message, onDismiss, onPause, onResume }: ToastItemProps) {
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef<number | null>(null);
    const Icon = iconMap[message.type];
    const styles = styleMap[message.type];
    const displayTitle = message.title || titleMap[message.type];

    useEffect(() => {
        const duration = message.duration || 5000;
        const startTime = Date.now();
        const endTime = startTime + duration;

        const animate = () => {
            if (isPaused) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            const now = Date.now();
            const remaining = Math.max(0, endTime - now);
            const newProgress = (remaining / duration) * 100;

            setProgress(newProgress);

            if (newProgress > 0) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                onDismiss(message.id);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [message.id, message.duration, isPaused, onDismiss]);

    const handleMouseEnter = () => {
        setIsPaused(true);
        onPause(message.id);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
        onResume(message.id);
    };

    return (
        <div
            className={cn(
                'relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg transition-all duration-300',
                'animate-in slide-in-from-right-full fade-in duration-300',
                styles.bg,
                styles.border
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="alert"
            aria-live="polite"
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.icon)} />
                    <div className="flex-1 min-w-0">
                        <h4 className={cn('font-semibold text-sm', styles.title)}>
                            {displayTitle}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            {message.message}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-1 -mt-1 opacity-60 hover:opacity-100"
                        onClick={() => onDismiss(message.id)}
                        aria-label="Dismiss notification"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                <div
                    className={cn(
                        'h-full transition-all duration-100 ease-linear',
                        message.type === 'success' && 'bg-green-500',
                        message.type === 'error' && 'bg-red-500',
                        message.type === 'warning' && 'bg-amber-500',
                        message.type === 'info' && 'bg-blue-500'
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export function FlashMessageHandler({
    position = 'top-right',
    defaultDuration = 5000,
    maxMessages = 5,
}: FlashMessageHandlerProps) {
    const [messages, setMessages] = useState<FlashMessage[]>([]);
    const page = usePage();
    const flash = page.props.flash as FlashMessageHandlerProps['flash'];

    // Generate unique ID
    const generateId = useCallback(() => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    // Add message to queue
    const addMessage = useCallback((
        type: FlashMessageType,
        message: string,
        title?: string,
        duration?: number
    ) => {
        const newMessage: FlashMessage = {
            id: generateId(),
            type,
            message,
            title,
            duration: duration || defaultDuration,
        };

        setMessages((prev) => {
            // Remove oldest if max reached
            const updated = [...prev, newMessage];
            if (updated.length > maxMessages) {
                return updated.slice(updated.length - maxMessages);
            }
            return updated;
        });
    }, [generateId, defaultDuration, maxMessages]);

    // Dismiss message
    const dismissMessage = useCallback((id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    // Handle pause (for accessibility)
    const handlePause = useCallback((id: string) => {
        // Message is paused via state in ToastItem component
    }, []);

    const handleResume = useCallback((id: string) => {
        // Message is resumed via state in ToastItem component
    }, []);

    // Listen for flash messages from Inertia
    useEffect(() => {
        if (!flash) return;

        if (flash.success) {
            addMessage('success', flash.success);
        }
        if (flash.error) {
            addMessage('error', flash.error);
        }
        if (flash.warning) {
            addMessage('warning', flash.warning);
        }
        if (flash.info) {
            addMessage('info', flash.info);
        }
    }, [flash, addMessage]);

    // Listen for custom events (for programmatic notifications)
    useEffect(() => {
        const handleFlashEvent = (event: CustomEvent<{
            type: FlashMessageType;
            message: string;
            title?: string;
            duration?: number;
        }>) => {
            const { type, message, title, duration } = event.detail;
            addMessage(type, message, title, duration);
        };

        window.addEventListener('flash-message' as any, handleFlashEvent as any);
        return () => {
            window.removeEventListener('flash-message' as any, handleFlashEvent as any);
        };
    }, [addMessage]);

    // Clear all messages on page navigation
    useEffect(() => {
        return () => {
            setMessages([]);
        };
    }, [page.url]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'fixed z-[100] flex flex-col gap-2 p-4 pointer-events-none',
                positionClasses[position]
            )}
            aria-live="polite"
            aria-atomic="true"
        >
            {messages.map((message) => (
                <div key={message.id} className="pointer-events-auto">
                    <ToastItem
                        message={message}
                        onDismiss={dismissMessage}
                        onPause={handlePause}
                        onResume={handleResume}
                    />
                </div>
            ))}
        </div>
    );
}

// Helper function to dispatch flash messages programmatically
export function flashMessage(
    type: FlashMessageType,
    message: string,
    title?: string,
    duration?: number
) {
    const event = new CustomEvent('flash-message', {
        detail: { type, message, title, duration },
    });
    window.dispatchEvent(event);
}

// Convenience exports
export const flashSuccess = (message: string, title?: string, duration?: number) =>
    flashMessage('success', message, title, duration);
export const flashError = (message: string, title?: string, duration?: number) =>
    flashMessage('error', message, title, duration);
export const flashWarning = (message: string, title?: string, duration?: number) =>
    flashMessage('warning', message, title, duration);
export const flashInfo = (message: string, title?: string, duration?: number) =>
    flashMessage('info', message, title, duration);

export default FlashMessageHandler;
