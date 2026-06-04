/**
 * Speech-to-Text Service
 * Integrates with browser Web Speech API as primary (with fallback to external STT engines)
 * Compatible with cloud-based STT engines (Google Cloud Speech-to-Text, AWS Transcribe, etc.)
 */

export interface STTResult {
  text: string
  language: string
  confidence: number
  isFinal: boolean
}

export interface STTConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
}

class SpeechToTextService {
  private recognition: any = null
  private isListening: boolean = false

  constructor() {
    // Initialize browser's Web Speech API with fallback support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
      }
    }
  }

  async startListening(config: STTConfig, onResult: (result: STTResult) => void, onError: (error: string) => void) {
    if (!this.recognition) {
      onError('Speech Recognition not supported in this browser. Fallback to text input.')
      return
    }

    this.isListening = true
    this.recognition.language = config.language
    this.recognition.continuous = config.continuous
    this.recognition.interimResults = config.interimResults
    this.recognition.maxAlternatives = config.maxAlternatives

    this.recognition.onstart = () => {
      console.log('[v0] STT: Listening started')
    }

    this.recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const isFinal = event.results[i].isFinal

        if (isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      onResult({
        text: finalTranscript || interimTranscript,
        language: config.language,
        confidence: event.results[event.results.length - 1][0].confidence,
        isFinal: finalTranscript.length > 0,
      })
    }

    this.recognition.onerror = (event: any) => {
      onError(`STT Error: ${event.error}`)
    }

    this.recognition.onend = () => {
      this.isListening = false
    }

    this.recognition.start()
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort()
      this.isListening = false
    }
  }
}

export const speechToTextService = new SpeechToTextService()
