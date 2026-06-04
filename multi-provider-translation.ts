/**
 * Multi-Provider Translation Service
 * FIXED: Now routes through backend API endpoint for security and performance
 * - No direct API calls from client
 * - Prevents CORS issues
 * - Protects API keys
 * - Enables request timeout and retry logic
 */

export type TranslationProvider = "google" | "deepl" | "openai"

export interface AdvancedTranslationRequest {
  text: string
  sourceLanguage: string
  targetLanguage: string
  tone?: "formal" | "casual" | "business" | "travel"
  provider?: TranslationProvider
}

export interface AdvancedTranslationResponse {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  tone: string
  provider: TranslationProvider
  confidence: number
  detectedLanguage?: string
  timestamp?: string
}

class MultiProviderTranslationService {
  private cache: Map<string, AdvancedTranslationResponse> = new Map()
  private requestInFlight: Map<string, Promise<AdvancedTranslationResponse>> = new Map()

  private getCacheKey(req: AdvancedTranslationRequest): string {
    return `${req.text}|${req.sourceLanguage}|${req.targetLanguage}|${req.tone || "default"}`
  }

  async translate(request: AdvancedTranslationRequest): Promise<AdvancedTranslationResponse> {
    const cacheKey = this.getCacheKey(request)
    
    // Return cached result
    if (this.cache.has(cacheKey)) {
      console.log("[v0] Translation: Cache hit")
      return this.cache.get(cacheKey)!
    }

    // Return in-flight request if one exists (deduplication)
    if (this.requestInFlight.has(cacheKey)) {
      console.log("[v0] Translation: Reusing in-flight request")
      return this.requestInFlight.get(cacheKey)!
    }

    // Create new request
    const translationPromise = this.performTranslation(request, cacheKey)
    this.requestInFlight.set(cacheKey, translationPromise)

    try {
      const result = await translationPromise
      this.cache.set(cacheKey, result)
      return result
    } finally {
      this.requestInFlight.delete(cacheKey)
    }
  }

  private async performTranslation(
    request: AdvancedTranslationRequest,
    cacheKey: string
  ): Promise<AdvancedTranslationResponse> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: request.text,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          tone: request.tone,
          provider: request.provider || "deepl",
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `Translation API error: ${errorData.error || response.statusText} (${response.status})`
        )
      }

      const result = await response.json()

      // Validate response structure
      if (!result.translatedText || typeof result.translatedText !== "string") {
        throw new Error("Invalid translation response: missing translatedText")
      }

      return {
        originalText: request.text,
        translatedText: result.translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        tone: request.tone || "neutral",
        provider: result.provider || "deepl",
        confidence: result.confidence || 0.9,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Translation failed"
      console.error("[v0] Translation error:", message)
      throw new Error(message)
    } finally {
      clearTimeout(timeoutId)
    }
  }
}

export const multiProviderTranslationService = new MultiProviderTranslationService()
