export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function createAbortableTimeout(
  callback: () => void,
  delay: number
): { abort: () => void } {
  let timeoutId: NodeJS.Timeout | null = setTimeout(callback, delay)

  return {
    abort: () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = null
    },
  }
}

export class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private isProcessing = false
  private timeout = 30000 // 30 second timeout per request

  async enqueue(request: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await Promise.race([
            request(),
            new Promise((_, rej) =>
              setTimeout(() => rej(new Error("Request timeout")), this.timeout)
            ),
          ])
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })

      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const request = this.queue.shift()
      if (request) {
        try {
          await request()
        } catch (error) {
          console.error("[v0] Queue request error:", error)
        }
      }
    }

    this.isProcessing = false
  }
}
