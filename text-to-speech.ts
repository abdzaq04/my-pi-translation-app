/**
 * Text-to-Speech Service
 * Provides natural voice synthesis with multiple engine support:
 * - Web Speech API (native browser support)
 * - Google Cloud Text-to-Speech
 * - Azure Cognitive Services Speech
 * - AWS Polly
 * - ElevenLabs (for premium voice quality)
 * 
 * Features:
 * - Multiple voice options per language
 * - Speed and pitch control
 * - Offline fallback
 * - Audio caching
 */

export interface TTSConfig {
  language: string
  voice?: string
  rate?: number // 0.5 to 2.0
  pitch?: number // 0.0 to 2.0
  volume?: number // 0.0 to 1.0
}

export interface TTSResult {
  audioUrl: string | null
  duration: number
  language: string
}

class TextToSpeechService {
  private synthesis: any = null
  private isSupported: boolean = false
  private audioCache: Map<string, HTMLAudioElement> = new Map()
  private isPlaying: boolean = false
  private apiEndpoint: string = process.env.NEXT_PUBLIC_TTS_API || '/api/text-to-speech'

  constructor() {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis
      this.isSupported = !!this.synthesis
    }
  }

  async speak(text: string, config: TTSConfig): Promise<TTSResult> {
    const cacheKey = `${text}|${config.language}|${config.voice}`

    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      console.log('[v0] TTS: Playing cached audio')
      const audio = this.audioCache.get(cacheKey)!
      audio.play()
      return {
        audioUrl: null,
        duration: audio.duration,
        language: config.language,
      }
    }

    try {
      return await this.synthesizeOnline(text, config, cacheKey)
    } catch (error) {
      console.error('[v0] TTS error:', error)
      return this.synthesizeLocally(text, config, cacheKey)
    }
  }

  private async synthesizeOnline(text: string, config: TTSConfig, cacheKey: string): Promise<TTSResult> {
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, ...config }),
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }

    const blob = await response.blob()
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)

    // Cache the audio element
    this.audioCache.set(cacheKey, audio)

    audio.play()
    return {
      audioUrl,
      duration: audio.duration,
      language: config.language,
    }
  }

  private synthesizeLocally(text: string, config: TTSConfig, cacheKey: string): TTSResult {
    if (!this.isSupported) {
      console.warn('[v0] TTS: Not supported in this browser')
      return {
        audioUrl: null,
        duration: 0,
        language: config.language,
      }
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = config.language
    utterance.rate = config.rate || 1
    utterance.pitch = config.pitch || 1
    utterance.volume = config.volume || 1

    const startTime = performance.now()
    this.synthesis.speak(utterance)

    return {
      audioUrl: null,
      duration: (performance.now() - startTime) / 1000,
      language: config.language,
    }
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
      this.isPlaying = false
    }
  }

  getAvailableVoices(language: string): string[] {
    if (!this.isSupported) return []

    return this.synthesis
      .getVoices()
      .filter((voice: any) => voice.lang.startsWith(language))
      .map((voice: any) => voice.name)
  }

  clearCache() {
    this.audioCache.forEach((audio) => {
      try {
        URL.revokeObjectURL(audio.src)
      } catch (e) {
        // ignore
      }
    })
    this.audioCache.clear()
  }
}

export const textToSpeechService = new TextToSpeechService()
