import { useEffect, useRef, useCallback } from "react"

interface PerformanceMetrics {
  avgRenderTime: number
  maxRenderTime: number
  totalRenders: number
  isSlowRender: boolean
}

interface UsePerformanceMonitorOptions {
  componentName: string
  onSlowRender?: (metrics: PerformanceMetrics) => void
  renderTimeThreshold?: number // ms
}

/**
 * Performance monitoring hook for detecting UI thread blocking
 * Tracks render times and alerts on performance degradation
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions
) {
  const {
    componentName,
    onSlowRender,
    renderTimeThreshold = 16.67, // 60fps threshold
  } = options

  const metricsRef = useRef({
    renderTimes: [] as number[],
    renderCount: 0,
    maxRenderTime: 0,
  })

  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    const renderTime = Date.now() - startTimeRef.current
    const metrics = metricsRef.current

    metrics.renderTimes.push(renderTime)
    metrics.renderCount++
    metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime)

    // Keep only last 100 renders for memory efficiency
    if (metrics.renderTimes.length > 100) {
      metrics.renderTimes.shift()
    }

    const avgRenderTime = metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length
    const isSlowRender = renderTime > renderTimeThreshold

    if (isSlowRender) {
      console.warn(
        `[v0] Slow render detected in ${componentName}: ${renderTime}ms (avg: ${avgRenderTime.toFixed(2)}ms)`
      )

      onSlowRender?.({
        avgRenderTime,
        maxRenderTime: metrics.maxRenderTime,
        totalRenders: metrics.renderCount,
        isSlowRender,
      })
    }

    startTimeRef.current = Date.now()
  })

  return {
    metrics: metricsRef.current,
  }
}

/**
 * Hook to track input change event frequency
 * Detects excessive onChange calls that cause freezing
 */
export function useInputChangeTracking(componentName: string) {
  const changeCountRef = useRef(0)
  const windowStartRef = useRef(Date.now())

  const trackChange = useCallback(() => {
    const now = Date.now()
    const timeSinceWindowStart = now - windowStartRef.current

    // Reset window every second
    if (timeSinceWindowStart > 1000) {
      const changesPerSecond = changeCountRef.current
      if (changesPerSecond > 50) {
        console.warn(
          `[v0] High input change frequency in ${componentName}: ${changesPerSecond} changes/sec`
        )
      }
      changeCountRef.current = 0
      windowStartRef.current = now
    } else {
      changeCountRef.current++
    }
  }, [componentName])

  return { trackChange }
}

/**
 * Hook to detect memory leaks from event listeners
 */
export function useListenerCleanup(componentName: string) {
  const listenersRef = useRef<Map<string, Function>>(new Map())

  const addListener = useCallback(
    (key: string, cleanup: Function) => {
      if (listenersRef.current.has(key)) {
        console.warn(
          `[v0] Duplicate listener "${key}" in ${componentName}. Old one will be overwritten.`
        )
        const oldCleanup = listenersRef.current.get(key)
        oldCleanup?.()
      }
      listenersRef.current.set(key, cleanup)
    },
    [componentName]
  )

  useEffect(() => {
    return () => {
      if (listenersRef.current.size > 0) {
        console.log(
          `[v0] Cleaning up ${listenersRef.current.size} listeners in ${componentName}`
        )
        listenersRef.current.forEach((cleanup) => cleanup())
        listenersRef.current.clear()
      }
    }
  }, [componentName])

  return { addListener, listeners: listenersRef.current }
}
