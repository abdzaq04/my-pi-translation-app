/**
 * Performance Monitoring Utility
 * Tracks critical metrics for Polytalk's real-time translation
 * 
 * Metrics:
 * - Speech-to-text latency
 * - Translation latency
 * - Text-to-speech latency
 * - Overall round-trip time
 * - Bandwidth usage
 * - Accuracy scores
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

export interface PerformanceThresholds {
  stlLatency: number // ms
  translationLatency: number // ms
  ttsLatency: number // ms
  bandwidthPerRequest: number // bytes
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThresholds = {
    stlLatency: 200,
    translationLatency: 500,
    ttsLatency: 1000,
    bandwidthPerRequest: 50000, // 50KB
  }

  private sessionStart = Date.now()

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    }

    this.metrics.push(metric)

    // Log if threshold exceeded
    if (this.isThresholdExceeded(metric)) {
      console.warn('[v0] Performance warning:', {
        metric: metric.name,
        value: metric.value,
        threshold: this.getThreshold(metric.name),
        unit: metric.unit,
      })
    }

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  private isThresholdExceeded(metric: PerformanceMetric): boolean {
    const threshold = this.getThreshold(metric.name)
    return threshold > 0 && metric.value > threshold
  }

  private getThreshold(metricName: string): number {
    if (metricName.includes('STT') || metricName.includes('speech-to-text')) {
      return this.thresholds.stlLatency
    }
    if (metricName.includes('translation')) {
      return this.thresholds.translationLatency
    }
    if (metricName.includes('TTS') || metricName.includes('text-to-speech')) {
      return this.thresholds.ttsLatency
    }
    return 0
  }

  /**
   * Record STT completion with latency
   */
  recordSTTLatency(latency: number, language: string, success: boolean) {
    this.recordMetric('speech-to-text-latency', latency, 'ms', {
      language,
      success: success.toString(),
    })
  }

  /**
   * Record translation latency
   */
  recordTranslationLatency(
    latency: number,
    sourceLanguage: string,
    targetLanguage: string,
    fromCache: boolean
  ) {
    this.recordMetric('translation-latency', latency, 'ms', {
      source: sourceLanguage,
      target: targetLanguage,
      cached: fromCache.toString(),
    })
  }

  /**
   * Record TTS latency
   */
  recordTTSLatency(latency: number, language: string, charsCount: number) {
    this.recordMetric('text-to-speech-latency', latency, 'ms', {
      language,
      characters: charsCount.toString(),
    })
  }

  /**
   * Record round-trip time for full translation cycle
   */
  recordRoundTrip(latency: number, inputMode: 'voice' | 'text') {
    this.recordMetric('round-trip-latency', latency, 'ms', {
      input_mode: inputMode,
    })
  }

  /**
   * Record bandwidth usage
   */
  recordBandwidth(bytes: number, operation: string) {
    this.recordMetric('bandwidth-usage', bytes, 'bytes', {
      operation,
    })
  }

  /**
   * Record translation accuracy (1-100)
   */
  recordAccuracy(score: number, sourceLanguage: string, targetLanguage: string) {
    this.recordMetric('translation-accuracy', score, '%', {
      source: sourceLanguage,
      target: targetLanguage,
    })
  }

  /**
   * Get average latency for a metric type
   */
  getAverageLatency(metricName: string): number {
    const filtered = this.metrics.filter((m) => m.name.includes(metricName))
    if (filtered.length === 0) return 0

    const sum = filtered.reduce((acc, m) => acc + m.value, 0)
    return sum / filtered.length
  }

  /**
   * Get performance report for current session
   */
  getSessionReport() {
    const sessionDuration = Date.now() - this.sessionStart

    return {
      sessionDuration,
      totalMetrics: this.metrics.length,
      averageSTTLatency: this.getAverageLatency('speech-to-text'),
      averageTranslationLatency: this.getAverageLatency('translation'),
      averageTTSLatency: this.getAverageLatency('text-to-speech'),
      averageRoundTrip: this.getAverageLatency('round-trip'),
      thresholdViolations: this.metrics.filter((m) => this.isThresholdExceeded(m)).length,
      metrics: this.metrics,
    }
  }

  /**
   * Send metrics to analytics service
   */
  async sendMetrics(endpoint: string) {
    try {
      const report = this.getSessionReport()
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })
      console.log('[v0] Performance metrics sent')
    } catch (error) {
      console.error('[v0] Failed to send metrics:', error)
    }
  }

  /**
   * Clear metrics and reset monitoring
   */
  reset() {
    this.metrics = []
    this.sessionStart = Date.now()
  }

  /**
   * Create a timing marker for manual measurement
   */
  createTimer() {
    const startTime = performance.now()
    return () => performance.now() - startTime
  }
}

export const performanceMonitor = new PerformanceMonitor()
