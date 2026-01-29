import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = '',
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
    };

    return (
        <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
            <div
                className={`animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600 ${sizeClasses[size]}`}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Loading...</span>
            </div>
            {text && (
                <p className="text-sm text-gray-600 animate-pulse">{text}</p>
            )}
        </div>
    );
};

interface LoadingOverlayProps {
    isLoading: boolean;
    message?: string;
    children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isLoading,
    message = 'Loading...',
    children,
}) => {
    if (!isLoading) {
        return <>{children}</>;
    }

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white bg-opacity-50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
                    <LoadingSpinner size="lg" text={message} />
                </div>
            </div>
            <div className="opacity-50 pointer-events-none">
                {children}
            </div>
        </div>
    );
};

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    rounded = false,
}) => {
    const style = {
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    };

    return (
        <div
            className={`animate-pulse bg-gray-300 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
            style={style}
            role="presentation"
        >
            <span className="sr-only">Loading content</span>
        </div>
    );
};

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 4,
}) => {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
                <Skeleton width="200px" height="24px" />
            </div>
            <div className="divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-4">
                        <div className="grid grid-cols-4 gap-4">
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <Skeleton key={colIndex} height="16px" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface FormSkeletonProps {
    fields?: number;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
    fields = 4,
}) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Skeleton width="120px" height="16px" />
                    <Skeleton height="40px" rounded />
                </div>
            ))}
            <div className="flex space-x-3 pt-4">
                <Skeleton width="100px" height="40px" rounded />
                <Skeleton width="100px" height="40px" rounded />
            </div>
        </div>
    );
};