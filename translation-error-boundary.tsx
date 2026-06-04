import React, { ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class TranslationErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[v0] Translation error boundary caught:", error, errorInfo)
    // Send to error tracking service
    if (typeof window !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/crash-report", JSON.stringify({
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }))
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.reset) || (
          <div className="w-full h-full flex items-center justify-center bg-destructive/10 p-4 rounded-lg">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Translation Error
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error.message}
              </p>
              <button
                onClick={this.reset}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
