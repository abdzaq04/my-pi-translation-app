/**
 * Retry system for resilient API calls
 * Implements exponential backoff with jitter
 */

export interface RetryConfig {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  jitterFactor?: number
  onRetry?: (attempt: number, error: Error, delay: number) => void
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
}

/**
 * Execute async function with automatic retry on failure
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const options = { ...DEFAULT_CONFIG, ...config }

  let lastError: Error | null = null
  let delay = options.initialDelayMs

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === options.maxAttempts) {
        throw lastError
      }

      // Calculate delay with exponential backoff and jitter
      const jitter = (Math.random() - 0.5) * options.jitterFactor * delay
      const nextDelay = Math.min(delay * options.backoffMultiplier + jitter, options.maxDelayMs)

      // Call retry callback if provided
      options.onRetry?.(attempt, lastError, nextDelay)

      console.warn(`[v0] Retry ${attempt}/${options.maxAttempts} after ${nextDelay}ms:`, lastError.message)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, nextDelay))
      delay = nextDelay
    }
  }

  throw lastError || new Error("Retry exhausted without error")
}

/**
 * Retry specific for API calls
 */
export async function apiCallWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<T> {
  return withRetry(
    async () => {
      const response = await fetch(endpoint, options)

      if (!response.ok) {
        // Only retry on server errors (5xx) or timeout-like issues
        if (response.status >= 500 || response.status === 408 || response.status === 429) {
          const error = new Error(`API Error: ${response.status}`)
          error.name = "RetryableError"
          throw error
        }

        // For client errors (4xx), throw immediately
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      return response.json() as Promise<T>
    },
    { ...DEFAULT_CONFIG, ...config }
  )
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed"
  private failureCount = 0
  private successCount = 0
  private lastFailureTime: number | null = null
  private readonly failureThreshold = 5
  private readonly successThreshold = 2
  private readonly resetTimeoutMs = 30000

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      // Check if timeout expired
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        console.log("[v0] Circuit breaker: Attempting recovery (half-open state)")
        this.state = "half-open"
        this.successCount = 0
      } else {
        throw new Error("Circuit breaker is open - service temporarily unavailable")
      }
    }

    try {
      const result = await fn()

      if (this.state === "half-open") {
        this.successCount++
        if (this.successCount >= this.successThreshold) {
          console.log("[v0] Circuit breaker: Recovered (closed state)")
          this.state = "closed"
          this.failureCount = 0
          this.successCount = 0
          this.lastFailureTime = null
        }
      } else {
        this.failureCount = 0
      }

      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.failureThreshold) {
        console.error("[v0] Circuit breaker: Opened due to repeated failures")
        this.state = "open"
      }

      throw error
    }
  }

  getStatus(): string {
    return `CircuitBreaker(state=${this.state}, failures=${this.failureCount}, successes=${this.successCount})`
  }

  reset(): void {
    this.state = "closed"
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
  }
}
