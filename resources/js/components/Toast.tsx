import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
    showSuccess: (title: string, message?: string, duration?: number) => void;
    showError: (title: string, message?: string, duration?: number) => void;
    showWarning: (title: string, message?: string, duration?: number) => void;
    showInfo: (title: string, message?: string, duration?: number) => void;
}


const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}


export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const activeTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: string) => {
        // Clear the timeout if exists
        const timeoutId = activeTimeouts.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            activeTimeouts.current.delete(id);
        }
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = { ...toast, id };
        
        setToasts(prev => [...prev, newToast]);

        // Auto-remove toast after duration
        if (toast.duration !== 0) {
            const duration = toast.duration || 5000;
            const timeoutId = setTimeout(() => {
                removeToast(id);
            }, duration);
            activeTimeouts.current.set(id, timeoutId);
        }
    }, [removeToast]);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'success', title, message, duration });
    }, [addToast]);

    const showError = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'error', title, message, duration });
    }, [addToast]);

    const showWarning = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'warning', title, message, duration });
    }, [addToast]);

    const showInfo = useCallback((title: string, message?: string, duration?: number) => {
        addToast({ type: 'info', title, message, duration });
    }, [addToast]);

    const contextValue: ToastContextType = {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 space-y-3">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: Toast;
    onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'info':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div
            className={`relative max-w-sm w-full bg-white border-l-4 ${getToastStyles()} rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out animate-in slide-in-from-right-full`}
            role="alert"
            aria-live="polite"
        >
            <div className="p-4">
                <div className="flex items-start space-x-3">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{toast.title}</p>
                        {toast.message && (
                            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                        )}
                    </div>
                    <button
                        onClick={onRemove}
                        className="flex-shrink-0 ml-4 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Progress bar */}
            {toast.duration !== 0 && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
                    <div 
                        className={`h-1 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ 
                            animation: `shrink ${toast.duration || 5000}ms linear forwards` 
                        }}
                    />
                </div>
            )}
        </div>
    );
};

// CSS-in-JS for the progress bar animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shrink {
        from { width: 100%; }
        to { width: 0%; }
    }
`;
document.head.appendChild(style);

// Convenience hooks for different toast types
export const useSuccessToast = () => {
    const { showSuccess } = useToast();
    return showSuccess;
};

export const useErrorToast = () => {
    const { showError } = useToast();
    return showError;
};

export const useWarningToast = () => {
    const { showWarning } = useToast();
    return showWarning;
};

export const useInfoToast = () => {
    const { showInfo } = useToast();
    return showInfo;
};