import * as React from 'react';
import { cn } from '@/lib/utils';

interface LaboratoryBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'urgent' | 'routine' | 'stat' | 'critical' | 'normal';
  size?: 'sm' | 'md' | 'lg';
}

const LaboratoryBadge = React.forwardRef<HTMLDivElement, LaboratoryBadgeProps>(
  ({ className, variant = 'pending', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200 border';
    
    const variantClasses = {
      pending: 'bg-laboratory-pending/10 text-laboratory-pending border-laboratory-pending/30',
      in_progress: 'bg-laboratory-in-progress/10 text-laboratory-in-progress border-laboratory-in-progress/30',
      completed: 'bg-laboratory-completed/10 text-laboratory-completed border-laboratory-completed/30',
      cancelled: 'bg-laboratory-cancelled/10 text-laboratory-cancelled border-laboratory-cancelled/30',
      urgent: 'bg-laboratory-urgent/10 text-laboratory-urgent border-laboratory-urgent/30',
      routine: 'bg-laboratory-routine/10 text-laboratory-routine border-laboratory-routine/30',
      stat: 'bg-laboratory-stat/10 text-laboratory-stat border-laboratory-stat/30',
      critical: 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse',
      normal: 'bg-laboratory-normal/10 text-laboratory-normal border-laboratory-normal/30',
    };

    const sizeClasses = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
LaboratoryBadge.displayName = 'LaboratoryBadge';

export { LaboratoryBadge };