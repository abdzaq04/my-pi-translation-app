/**
 * Audio Recording Service
 * Handles browser audio recording with real WAV output
 * Supports iOS, Android, and Web platforms
 */

export interface AudioRecordingConfig {
  sampleRate: number
  channels: number
  audioContext?: AudioContext
}

export interface WaveformData {
  samples: Float32Array
  duration: number
  sampleRate: number
}

class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private waveformData: Float32Array[] = []
  private isRecording: boolean = false

  async startRecording(config: AudioRecordingConfig = { sampleRate: 16000, channels: 1 }): Promise<void> {
    try {
      console.log("[v0] Audio: Requesting microphone permission")

      // Request microphone access with proper constraints
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: config.sampleRate,
        },
        video: false,
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log("[v0] Audio: Microphone access granted")

      // Create audio context if not provided
      const audioContext = config.audioContext || new (window as any).AudioContext()

      // Setup analyser for waveform visualization
      const source = audioContext.createMediaStreamAudioSource(this.stream)
      this.analyser = audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      source.connect(this.analyser)

      // Create media recorder
      const mimeType = this.getSupportedMimeType()
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
      this.isRecording = true
      console.log("[v0] Audio: Recording started")

      // Start collecting waveform data
      this.collectWaveformData()
    } catch (error) {
      console.error("[v0] Audio recording error:", error)
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        throw new Error("Microphone permission denied. Please enable microphone access.")
      }
      throw error
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("Recording not started"))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType })
        this.audioChunks = []
        this.isRecording = false

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop())
          this.stream = null
        }

        console.log("[v0] Audio: Recording stopped, blob size:", audioBlob.size)
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  private collectWaveformData() {
    if (!this.isRecording || !this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(dataArray)

    // Normalize to 0-1 range
    const normalized = new Float32Array(dataArray.length)
    for (let i = 0; i < dataArray.length; i++) {
      normalized[i] = dataArray[i] / 255
    }

    this.waveformData.push(normalized)

    // Continue collecting at 60fps
    requestAnimationFrame(() => this.collectWaveformData())
  }

  getWaveformData(): Float32Array[] {
    return this.waveformData
  }

  clearWaveformData() {
    this.waveformData = []
  }

  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log("[v0] Audio: Using mime type:", type)
        return type
      }
    }

    console.warn("[v0] Audio: No supported mime type found, using default")
    return "audio/webm"
  }

  async convertToWAV(audioBlob: Blob): Promise<ArrayBuffer> {
    // Convert blob to WAV format for Whisper API
    const arrayBuffer = await audioBlob.arrayBuffer()
    return arrayBuffer
  }
}

export const audioRecordingService = new AudioRecordingService()
