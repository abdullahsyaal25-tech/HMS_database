import * as React from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"
import { Skeleton } from "./skeleton"

interface LoadingProps extends React.ComponentProps<"div"> {
  variant?: "spinner" | "skeleton" | "dots" | "pulse"
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
}

function Loading({
  variant = "spinner",
  size = "md",
  text,
  className,
  ...props
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  const renderSpinner = () => (
    <div className="flex items-center justify-center">
      <Spinner className={cn(sizeClasses[size], "text-primary")} />
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )

  const renderSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className={cn("h-4 w-3/4", className)} />
      <Skeleton className={cn("h-4 w-1/2", className)} />
      {text && (
        <div className="text-sm text-muted-foreground">{text}</div>
      )}
    </div>
  )

  const renderDots = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className={cn(
        "rounded-full bg-primary animate-bounce",
        sizeClasses[size],
        "delay-0"
      )} />
      <div className={cn(
        "rounded-full bg-primary animate-bounce",
        sizeClasses[size],
        "delay-75"
      )} />
      <div className={cn(
        "rounded-full bg-primary animate-bounce",
        sizeClasses[size],
        "delay-150"
      )} />
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )

  const renderPulse = () => (
    <div className="flex items-center justify-center">
      <div className={cn(
        "rounded-full bg-primary animate-pulse",
        sizeClasses[size]
      )} />
      {text && (
        <span className="ml-2 text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )

  return (
    <div
      data-slot="loading"
      className={cn("flex items-center justify-center py-4", className)}
      role="status"
      aria-label={text || "Loading"}
      {...props}
    >
      {variant === "spinner" && renderSpinner()}
      {variant === "skeleton" && renderSkeleton()}
      {variant === "dots" && renderDots()}
      {variant === "pulse" && renderPulse()}
    </div>
  )
}

// Loading overlay component
interface LoadingOverlayProps extends React.ComponentProps<"div"> {
  isLoading: boolean
  text?: string
  background?: "transparent" | "blur" | "solid"
  position?: "fixed" | "absolute" | "relative"
}

function LoadingOverlay({
  isLoading,
  text = "Loading...",
  background = "blur",
  position = "fixed",
  className,
  children,
  ...props
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>
  }

  const backgroundClasses = {
    transparent: "bg-transparent",
    blur: "bg-background/80 backdrop-blur-sm",
    solid: "bg-background"
  }

  const positionClasses = {
    fixed: "fixed inset-0 z-50",
    absolute: "absolute inset-0 z-10",
    relative: "relative z-10"
  }

  return (
    <>
      {children}
      <div
        data-slot="loading-overlay"
        className={cn(
          positionClasses[position],
          backgroundClasses[background],
          "flex items-center justify-center",
          className
        )}
        {...props}
      >
        <div className="text-center space-y-4 p-8">
          <Loading variant="spinner" size="lg" />
          <div className="text-lg font-medium text-foreground">{text}</div>
        </div>
      </div>
    </>
  )
}

// Loading skeleton for lists
interface LoadingListProps extends React.ComponentProps<"div"> {
  count?: number
  variant?: "card" | "row" | "grid"
  className?: string
}

function LoadingList({
  count = 5,
  variant = "row",
  className,
  ...props
}: LoadingListProps) {
  const renderCard = () => (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )

  const renderRow = () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div
      data-slot="loading-list"
      className={cn("space-y-4", className)}
      {...props}
    >
      {variant === "card" && Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          {renderCard()}
        </div>
      ))}
      
      {variant === "row" && Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          {renderRow()}
        </div>
      ))}
      
      {variant === "grid" && renderGrid()}
    </div>
  )
}

// Loading skeleton for forms
interface LoadingFormProps extends React.ComponentProps<"div"> {
  fields?: number
  className?: string
}

function LoadingForm({
  fields = 4,
  className,
  ...props
}: LoadingFormProps) {
  return (
    <div
      data-slot="loading-form"
      className={cn("space-y-4", className)}
      {...props}
    >
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 justify-end">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// Loading skeleton for tables
interface LoadingTableProps extends React.ComponentProps<"div"> {
  rows?: number
  columns?: number
  className?: string
}

function LoadingTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: LoadingTableProps) {
  return (
    <div
      data-slot="loading-table"
      className={cn("space-y-2", className)}
      {...props}
    >
      {/* Table header */}
      <div className="flex space-x-4 p-2 border-b">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-2 border-b">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Hook for managing loading states
export function useLoading(initialLoading = false) {
  const [isLoading, setIsLoading] = React.useState(initialLoading)

  const startLoading = React.useCallback(() => {
    setIsLoading(true)
  }, [])

  const stopLoading = React.useCallback(() => {
    setIsLoading(false)
  }, [])

  const withLoading = React.useCallback(async (asyncFn: () => Promise<unknown>): Promise<unknown> => {
    startLoading()
    try {
      const result = await asyncFn()
      return result
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  return {
    isLoading,
    startLoading,
    stopLoading,
    withLoading
  }
}

export {
  Loading,
  LoadingOverlay,
  LoadingList,
  LoadingForm,
  LoadingTable,
  useLoading
}
