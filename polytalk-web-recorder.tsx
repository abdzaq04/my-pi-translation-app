import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, Loader, AlertCircle, Volume2, Check } from 'lucide-react'

/**
 * Production-Grade Web Recording Component
 * Handles: MediaRecorder API, permission management, error handling, retry logic
 */

interface WebRecordingConfig {
  baseUrl: string
  apiKey: string
  sourceLanguage: string
  targetLanguage: string
  tone?: 'formal' | 'casual' | 'business' | 'travel'
  onTranslationComplete: (result: any) => void
  onError: (error: string) => void
  onRecordingStateChange?: (isRecording: boolean) => void
}

class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioContext: AudioContext | null = null
  private audioChunks: Blob[] = []
  private isRecording = false
  private stream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private waveformData: Uint8Array | null = null

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      })

      console.log('[v0] Web: Microphone permission granted')
      this.stream = stream
      return true
    } catch (error) {
      if ((error as any).name === 'NotAllowedError') {
        throw new Error('Microphone permission denied')
      } else if ((error as any).name === 'NotFoundError') {
        throw new Error('No microphone found')
      } else if ((error as any).name === 'NotSupportedError') {
        throw new Error('Microphone not supported in your browser')
      }
      throw error
    }
  }

  async startRecording(): Promise<void> {
    try {
      if (this.isRecording) return

      // Ensure we have permission
      if (!this.stream) {
        const hasPermission = await this.requestPermission()
        if (!hasPermission) throw new Error('Permission denied')
      }

      // Initialize MediaRecorder
      this.audioChunks = []
      this.mediaRecorder = new MediaRecorder(this.stream!, {
        mimeType: 'audio/webm;codecs=opus',
      })

      // Setup waveform visualization
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
      const source = this.audioContext.createMediaStreamSource(this.stream!)
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      source.connect(this.analyser)
      this.waveformData = new Uint8Array(this.analyser.frequencyBinCount)

      // Handle data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
      this.isRecording = true

      console.log('[v0] Web: Recording started')
    } catch (error) {
      console.error('[v0] Web: Recording error:', error)
      throw error
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm;codecs=opus',
        })

        this.isRecording = false
        this.cleanup()

        console.log('[v0] Web: Recording stopped. Size:', audioBlob.size)
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event.error}`))
      }

      this.mediaRecorder.stop()
    })
  }

  getWaveformData(): Uint8Array | null {
    if (this.analyser && this.waveformData) {
      this.analyser.getByteFrequencyData(this.waveformData)
      return this.waveformData
    }
    return null
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  dispose() {
    this.cleanup()
  }

  get isRecordingNow(): boolean {
    return this.isRecording
  }
}

const PolytalkWebRecorder: React.FC<WebRecordingConfig> = ({
  baseUrl,
  apiKey,
  sourceLanguage,
  targetLanguage,
  tone = 'casual',
  onTranslationComplete,
  onError,
  onRecordingStateChange,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const recorderRef = useRef<WebAudioRecorder>(new WebAudioRecorder())
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Waveform visualization
  useEffect(() => {
    if (!isRecording) return

    const drawWaveform = () => {
      const canvas = waveformCanvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const waveData = recorderRef.current.getWaveformData()
      if (!waveData) {
        animationRef.current = requestAnimationFrame(drawWaveform)
        return
      }

      ctx.fillStyle = 'rgb(15, 23, 42)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = 'rgb(112, 179, 255)'
      ctx.lineWidth = 2
      ctx.beginPath()

      const barWidth = canvas.width / waveData.length
      let x = 0

      for (let i = 0; i < waveData.length; i++) {
        const barHeight = (waveData[i] / 255) * canvas.height
        ctx.moveTo(x, canvas.height - barHeight)
        ctx.lineTo(x, canvas.height)
        x += barWidth
      }

      ctx.stroke()
      animationRef.current = requestAnimationFrame(drawWaveform)
    }

    animationRef.current = requestAnimationFrame(drawWaveform)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording])

  const handleRecording = async () => {
    try {
      setError(null)
      setSuccess(false)

      if (!isRecording) {
        // Start recording
        setIsProcessing(true)
        await recorderRef.current.startRecording()
        setIsRecording(true)
        onRecordingStateChange?.(true)
        setIsProcessing(false)
      } else {
        // Stop recording
        setIsRecording(false)
        onRecordingStateChange?.(false)
        setIsProcessing(true)

        const audioBlob = await recorderRef.current.stopRecording()
        if (!audioBlob || audioBlob.size === 0) {
          throw new Error('No audio recorded')
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1]

            // Call backend with retry logic
            const result = await callApiWithRetry({
              url: `${baseUrl}/api/record-audio`,
              data: {
                audioBlob: base64Audio,
                mimeType: audioBlob.type,
                duration: audioBlob.size,
                sourceLanguage,
                targetLanguage,
                tone,
              },
              apiKey,
              maxRetries: 3,
            })

            onTranslationComplete(result)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
          } catch (err) {
            const errorMsg =
              err instanceof Error ? err.message : 'Processing failed'
            setError(errorMsg)
            onError(errorMsg)
          } finally {
            setIsProcessing(false)
          }
        }
        reader.readAsDataURL(audioBlob)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      onError(errorMsg)
      setIsRecording(false)
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Waveform Visualization */}
      {isRecording && (
        <canvas
          ref={waveformCanvasRef}
          width={280}
          height={60}
          className="w-full max-w-sm border border-primary/30 rounded-lg bg-background/50"
        />
      )}

      {/* Recording Button */}
      <Button
        onClick={handleRecording}
        disabled={isProcessing}
        className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 pulse-glow'
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isProcessing ? (
          <Loader className="w-10 h-10 animate-spin" />
        ) : success ? (
          <Check className="w-10 h-10" />
        ) : (
          <Mic className={`w-10 h-10 ${isRecording ? 'animate-pulse' : ''}`} />
        )}
      </Button>

      {/* Status Text */}
      <p className="text-sm text-muted-foreground text-center">
        {isRecording
          ? 'Listening... Click to stop'
          : isProcessing
            ? 'Processing...'
            : success
              ? 'Translation complete!'
              : 'Click to record'}
      </p>

      {/* Error Display */}
      {error && (
        <Card className="p-3 bg-red-500/10 border-red-500/30 flex items-start gap-2 w-full max-w-sm">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{error}</p>
        </Card>
      )}
    </div>
  )
}

async function callApiWithRetry({
  url,
  data,
  apiKey,
  maxRetries,
}: {
  url: string
  data: any
  apiKey: string
  maxRetries: number
}): Promise<any> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error
      console.log(`[v0] Web: Attempt ${attempt + 1}/${maxRetries + 1} failed`)

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('API call failed after retries')
}

export default PolytalkWebRecorder
export { WebAudioRecorder }
