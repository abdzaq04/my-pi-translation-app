import { useCallback, useRef, useEffect, useState } from "react"
import { multiProviderTranslationService } from "@/lib/services/multi-provider-translation"
import { nonBlockingTTSService } from "@/lib/services/non-blocking-tts"
import { debounce } from "@/lib/debounce"

interface UseTranslationOptions {
  debounceMs?: number
  onTranslationStart?: () => void
  onTranslationComplete?: (result: any) => void
  onTranslationError?: (error: Error) => void
}

export function useTranslation(options: UseTranslationOptions = {}) {
  const {
    debounceMs = 300,
    onTranslationStart,
    onTranslationComplete,
    onTranslationError,
  } = options

  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      nonBlockingTTSService.abort()
    }
  }, [])

  const performTranslation = useCallback(
    async (
      text: string,
      sourceLanguage: string,
      targetLanguage: string,
      tone?: string,
      provider?: "google" | "deepl" | "openai"
    ) => {
      if (!text?.trim()) {
        setIsTranslating(false)
        return null
      }

      try {
        setIsTranslating(true)
        setError(null)
        onTranslationStart?.()

        // Create abort controller for this translation
        abortControllerRef.current = new AbortController()

        console.log("[v0] Starting translation:", { text: text.substring(0, 30), sourceLanguage, targetLanguage })

        // Call translation service (which calls backend API)
        const result = await multiProviderTranslationService.translate({
          text,
          sourceLanguage,
          targetLanguage,
          tone,
          provider,
        })

        console.log("[v0] Translation complete:", { result: result.translatedText.substring(0, 30) })

        setIsTranslating(false)
        onTranslationComplete?.(result)

        // Play TTS asynchronously without blocking UI
        nonBlockingTTSService
          .speakAsync(result.translatedText, {
            language: targetLanguage,
            voice_gender: "female",
          })
          .catch((err) => console.error("[v0] TTS error:", err))

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Translation failed")
        console.error("[v0] Translation error:", error.message)

        setError(error)
        setIsTranslating(false)
        onTranslationError?.(error)
        return null
      }
    },
    [onTranslationStart, onTranslationComplete, onTranslationError]
  )

  // Debounced version for auto-translate on text input
  const debouncedTranslate = useRef(
    debounce(performTranslation, debounceMs)
  ).current

  const cancel = useCallback(() => {
    console.log("[v0] Translation cancelled")
    abortControllerRef.current?.abort()
    nonBlockingTTSService.abort()
    setIsTranslating(false)
  }, [])

  return {
    performTranslation,
    debouncedTranslate,
    isTranslating,
    error,
    cancel,
  }
}
