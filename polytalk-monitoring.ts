/**
 * Polytalk Crash Monitoring & Error Reporting Service
 * Tracks all failures, network issues, and performance metrics
 */

export interface CrashReport {
  id: string
  timestamp: string
  component: string
  errorType: string
  message: string
  stack?: string
  userAgent: string
  networkStatus: boolean
  context: Record<string, any>
}

interface PerformanceMetric {
  operation: string
  duration: number
  status: "success" | "error"
  timestamp: string
}

class PolytalkMonitoring {
  private crashes: CrashReport[] = []
  private metrics: PerformanceMetric[] = []
  private maxStoredReports = 50
  private isOnline = true

  constructor() {
    // Monitor network status
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        console.log("[v0] Network: Online")
      })
      window.addEventListener("offline", () => {
        this.isOnline = false
        console.error("[v0] Network: Offline - Some features may not work")
      })

      // Initial network status
      this.isOnline = navigator.onLine
    }
  }

  /**
   * Report a crash/error with context
   */
  reportCrash(
    component: string,
    error: unknown,
    context?: Record<string, any>
  ): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))

    const report: CrashReport = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toISOString(),
      component,
      errorType: errorObj.constructor.name,
      message: errorObj.message,
      stack: errorObj.stack,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      networkStatus: this.isOnline,
      context: context || {},
    }

    this.crashes.push(report)

    // Keep only recent crashes
    if (this.crashes.length > this.maxStoredReports) {
      this.crashes = this.crashes.slice(-this.maxStoredReports)
    }

    console.error("[v0] Crash Report:", report)

    // Attempt to send to backend
    this.sendCrashReport(report).catch((err) => {
      console.warn("[v0] Failed to send crash report:", err)
    })
  }

  /**
   * Track performance metric
   */
  trackMetric(operation: string, duration: number, status: "success" | "error" = "success"): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      status,
      timestamp: new Date().toISOString(),
    }

    this.metrics.push(metric)

    if (this.metrics.length > this.maxStoredReports) {
      this.metrics = this.metrics.slice(-this.maxStoredReports)
    }

    console.log(`[v0] Metric: ${operation} - ${duration}ms (${status})`)
  }

  /**
   * Send crash report to backend
   */
  private async sendCrashReport(report: CrashReport): Promise<void> {
    try {
      if (!this.isOnline) {
        console.warn("[v0] Cannot send crash report - offline")
        return
      }

      await fetch("/api/crash-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      })
    } catch (error) {
      console.error("[v0] Failed to send crash report:", error)
    }
  }

  /**
   * Get crash history for debugging
   */
  getCrashHistory(): CrashReport[] {
    return [...this.crashes]
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Check if app is online
   */
  getNetworkStatus(): boolean {
    return this.isOnline
  }

  /**
   * Clear crash history
   */
  clearHistory(): void {
    this.crashes = []
    this.metrics = []
  }

  /**
   * Safely execute async function with error handling
   */
  async safeExecute<T>(
    operation: string,
    fn: () => Promise<T>,
    errorContext?: Record<string, any>
  ): Promise<T | null> {
    const startTime = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - startTime
      this.trackMetric(operation, duration, "success")
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      this.trackMetric(operation, duration, "error")
      this.reportCrash(operation, error, errorContext)
      return null
    }
  }
}

// Singleton instance
export const polytalkMonitoring = new PolytalkMonitoring()
