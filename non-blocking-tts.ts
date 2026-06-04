import { elevenLabsService } from "./elevenlabs-tts"

class NonBlockingTTSService {
  private audioQueue: Array<{
    text: string
    language: string
    gender: string
  }> = []
  private isPlaying = false
  private abortController: AbortController | null = null

  async speakAsync(
    text: string,
    options: { language?: string; voice_gender?: string }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioQueue.push({
        text,
        language: options.language || "en",
        gender: options.voice_gender || "female",
      })

      this.processQueue().catch(reject)
      resolve() // Resolve immediately without blocking
    })
  }

  private async processQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return

    this.isPlaying = true
    this.abortController = new AbortController()

    while (this.audioQueue.length > 0) {
      const item = this.audioQueue.shift()
      if (!item) break

      try {
        if (this.abortController.signal.aborted) break

        await Promise.race([
          elevenLabsService.speak(item.text, {
            language: item.language,
            voice_gender: item.gender as "male" | "female",
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("TTS timeout")), 10000)
          ),
        ])
      } catch (error) {
        console.error("[v0] TTS error:", error)
        // Continue to next item
      }
    }

    this.isPlaying = false
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.audioQueue = []
    this.isPlaying = false
  }

  getQueueLength(): number {
    return this.audioQueue.length + (this.isPlaying ? 1 : 0)
  }
}

export const nonBlockingTTSService = new NonBlockingTTSService()
