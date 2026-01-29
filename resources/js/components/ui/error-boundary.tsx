import * as React from "react"
import { Button } from "./button"
import { Alert, AlertDescription, AlertTitle } from "./alert"
import { AlertCircle, RefreshCw, Bug, ShieldX } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  isolate?: boolean // Whether to show a minimal fallback or full error page
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: React.ErrorInfo
  retry: () => void
  errorId: string
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: ErrorBoundary.prototype.generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo)
    }
  }

  private generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private reportErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, you would send this to your error reporting service
    // like Sentry, LogRocket, etc.
    console.error('Production error report:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    })
  }

  private retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: this.generateErrorId()
    })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          retry={this.retry}
          errorId={this.state.errorId}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, errorInfo, retry, errorId }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(process.env.NODE_ENV === 'development')
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    const errorDetails = `
Error ID: ${errorId}
Error: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo.componentStack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorDetails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy error details:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            <ShieldX className="h-5 w-5" />
            Something went wrong
          </AlertTitle>
          <AlertDescription className="mt-2">
            We're sorry, but an unexpected error occurred. Please try again or contact support if the problem persists.
          </AlertDescription>
        </Alert>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Button onClick={retry} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload Page
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Error ID:</span>
              <span className="font-mono">{errorId}</span>
            </div>
            <div className="flex justify-between">
              <span>Error:</span>
              <span className="font-medium">{error.message}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Bug className="mr-2 h-3 w-3" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            {showDetails && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyToClipboard}
              >
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
            )}
          </div>

          {showDetails && (
            <div className="mt-3 p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-40">
              <div className="font-semibold mb-2 text-destructive">Error Stack:</div>
              <pre className="whitespace-pre-wrap">{error.stack}</pre>
              
              <div className="font-semibold mt-3 mb-2 text-muted-foreground">Component Stack:</div>
              <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Minimal error fallback for isolated components
function MinimalErrorFallback({ error, retry, errorId }: Omit<ErrorFallbackProps, 'errorInfo'>) {
  return (
    <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Component Error</span>
          <span className="text-xs text-muted-foreground font-mono">{errorId}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        </div>
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        {error.message}
      </div>
    </div>
  )
}

// Hook for programmatic error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const handleError = React.useCallback((error: Error) => {
    setError(error)
    // You can also trigger global error handling here
  }, [])

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export { ErrorBoundary, DefaultErrorFallback, MinimalErrorFallback }