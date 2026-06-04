/**
 * ElevenLabs Text-to-Speech Service
 * Premium voice synthesis with voice cloning capability
 * Supports 29+ languages and multiple voice profiles
 */

export interface ElevenLabsConfig {
  voice_id?: string
  model_id?: string
  language?: string
  voice_gender?: "male" | "female"
  stability?: number // 0.0 to 1.0
  similarity_boost?: number // 0.0 to 1.0
}

export interface TTSPlaybackResult {
  audioUrl: string
  duration: number
  provider: "elevenlabs" | "google" | "web-speech"
  isPlaying: boolean
}

class ElevenLabsService {
  private apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
  private apiEndpoint = "https://api.elevenlabs.io/v1"
  private cache: Map<string, ArrayBuffer> = new Map()
  private currentAudio: HTMLAudioElement | null = null
  private voiceCache: Map<string, string> = new Map()

  // Predefined voice IDs for different profiles
  private voiceProfiles: Record<string, Record<string, string>> = {
    male: {
      neutral: "EXAVITQu4vr4xnSDxMaL", // Adam
      deep: "iP3nSVeeffnznJZsXm6u", // Charlie
      young: "pNInz6obpgDQGcFmaJgB", // Sam
    },
    female: {
      neutral: "21m00Tcm4TlvDq8ikWAM", // Rachel
      warm: "EXAVITQu4vr4xnSDxMaL", // Bella
      professional: "zrHiPebRn5AKIOuxW0O9", // Sarah
    },
  }

  async speak(text: string, config: ElevenLabsConfig = {}): Promise<TTSPlaybackResult> {
    const cacheKey = `${text}|${config.voice_id}|${config.language}`

    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log("[v0] ElevenLabs: Playing cached audio")
      const audioBuffer = this.cache.get(cacheKey)!
      return this.playAudio(audioBuffer, cacheKey)
    }

    try {
      const audioBuffer = await this.synthesize(text, config)
      this.cache.set(cacheKey, audioBuffer)
      return this.playAudio(audioBuffer, cacheKey)
    } catch (error) {
      console.error("[v0] ElevenLabs error:", error)
      // Fallback to Google Text-to-Speech
      return this.fallbackToGoogleTTS(text, config)
    }
  }

  private async synthesize(text: string, config: ElevenLabsConfig): Promise<ArrayBuffer> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured. Set NEXT_PUBLIC_ELEVENLABS_API_KEY environment variable.")
    }

    const voiceId = config.voice_id || this.getVoiceId(config.voice_gender || "female")

    console.log("[v0] ElevenLabs: Synthesizing speech with voice:", voiceId)

    const response = await fetch(`${this.apiEndpoint}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: config.model_id || "eleven_monolingual_v1",
        voice_settings: {
          stability: config.stability || 0.5,
          similarity_boost: config.similarity_boost || 0.75,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] ElevenLabs API error:", error)
      throw new Error(`ElevenLabs API error: ${error.detail?.message || response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log("[v0] ElevenLabs: Synthesis successful, size:", audioBuffer.byteLength)

    return audioBuffer
  }

  private async fallbackToGoogleTTS(text: string, config: ElevenLabsConfig): Promise<TTSPlaybackResult> {
    console.log("[v0] Falling back to Google Text-to-Speech")

    try {
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language: config.language || "en-US",
          voice: config.voice_gender === "male" ? "en-US-Neural2-A" : "en-US-Neural2-E",
        }),
      })

      if (!response.ok) {
        throw new Error("Google TTS failed")
      }

      const audioBuffer = await response.arrayBuffer()
      const cacheKey = `${text}|google|${config.language}`
      return this.playAudio(audioBuffer, cacheKey)
    } catch (error) {
      console.error("[v0] Google TTS fallback failed:", error)
      // Final fallback to Web Speech API
      return this.webSpeechFallback(text, config)
    }
  }

  private webSpeechFallback(text: string, config: ElevenLabsConfig): TTSPlaybackResult {
    console.log("[v0] Falling back to Web Speech API")

    if (typeof window === "undefined") {
      throw new Error("Web Speech API not available")
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = config.language || "en-US"
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)

    return {
      audioUrl: "",
      duration: 0,
      provider: "web-speech",
      isPlaying: true,
    }
  }

  private playAudio(audioBuffer: ArrayBuffer, cacheKey: string): TTSPlaybackResult {
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" })
    const audioUrl = URL.createObjectURL(blob)

    // Stop any currently playing audio
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
    }

    this.currentAudio = new Audio(audioUrl)
    this.currentAudio.play()

    return {
      audioUrl,
      duration: 0,
      provider: "elevenlabs",
      isPlaying: true,
    }
  }

  private getVoiceId(gender: "male" | "female"): string {
    const profiles = this.voiceProfiles[gender]
    return profiles.neutral // Default to neutral profile
  }

  async getAvailableVoices(): Promise<Array<{ id: string; name: string; gender: string }>> {
    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured")
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch voices")
      }

      const data = await response.json()
      return data.voices.map((voice: any) => ({
        id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || "unknown",
      }))
    } catch (error) {
      console.error("[v0] Failed to fetch ElevenLabs voices:", error)
      return []
    }
  }

  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  clearCache() {
    this.cache.forEach((_, url) => {
      try {
        URL.revokeObjectURL(url)
      } catch (e) {
        // ignore
      }
    })
    this.cache.clear()
  }
}

export const elevenLabsService = new ElevenLabsService()
