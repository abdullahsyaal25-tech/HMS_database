import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    size = 'md',
    className,
    text,
    fullScreen = false
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    const spinner = (
        <div className={cn('flex items-center justify-center', fullScreen && 'min-h-screen', className)}>
            <div className="flex flex-col items-center gap-2">
                <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
                {text && (
                    <p className="text-sm text-gray-600 animate-pulse">
                        {text}
                    </p>
                )}
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
}

interface LoadingSkeletonProps {
    className?: string;
    lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        'h-4 bg-gray-200 rounded animate-pulse',
                        i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
                    )}
                />
            ))}
        </div>
    );
}

interface LoadingCardProps {
    title?: string;
    className?: string;
}

export function LoadingCard({ title, className }: LoadingCardProps) {
    return (
        <div className={cn('bg-white rounded-lg border p-6', className)}>
            {title && (
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-1/3" />
            )}
            <LoadingSkeleton lines={4} />
        </div>
    );
}