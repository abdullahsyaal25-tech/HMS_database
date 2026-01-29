import * as React from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<"div"> {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
}

function Progress({
  className,
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = "default",
  size = "md",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "error":
        return "bg-red-500"
      case "info":
        return "bg-blue-500"
      default:
        return "bg-primary"
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-2"
      case "lg":
        return "h-4"
      default:
        return "h-3"
    }
  }

  return (
    <div
      data-slot="progress"
      className={cn("w-full space-y-1", className)}
      {...props}
    >
      {label && (
        <div className="flex items-center justify-between text-sm text-foreground">
          <span>{label}</span>
          {showPercentage && (
            <span className="font-medium tabular-nums">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-muted",
          getSizeClasses()
        )}
      >
        <div
          className={cn(
            "flex h-full items-center justify-center bg-primary-foreground text-xs font-medium text-primary-foreground transition-all",
            getVariantClasses(),
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${Math.round(percentage)}%`}
        >
          {showPercentage && percentage > 20 && (
            <span className="text-xs font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProgressRingProps extends React.ComponentProps<"div"> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  showPercentage?: boolean
  variant?: "default" | "success" | "warning" | "error" | "info"
}

function ProgressRing({
  className,
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
  variant = "default",
  ...props
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  const getVariantColor = () => {
    switch (variant) {
      case "success":
        return "#10b981"
      case "warning":
        return "#f59e0b"
      case "error":
        return "#ef4444"
      case "info":
        return "#3b82f6"
      default:
        return "#6366f1"
    }
  }

  return (
    <div
      data-slot="progress-ring"
      className={cn("flex flex-col items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `Progress: ${Math.round(percentage)}%`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getVariantColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference - (percentage / 100) * circumference}
          className="transition-all duration-500 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      
      <div className="mt-2 text-center">
        {label && (
          <div className="text-sm text-foreground">{label}</div>
        )}
        {showPercentage && (
          <div className="text-2xl font-bold text-foreground">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    </div>
  )
}

export { Progress, ProgressRing }