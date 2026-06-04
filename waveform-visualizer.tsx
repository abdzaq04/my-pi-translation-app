import { useEffect, useRef } from "react"

interface WaveformVisualizerProps {
  isRecording: boolean
  height?: number
  barCount?: number
  barColor?: string
}

export function WaveformVisualizer({
  isRecording,
  height = 40,
  barCount = 40,
  barColor = "rgb(112, 179, 255)",
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = "rgba(15, 23, 42, 0.5)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (!isRecording) {
        // Idle state - subtle animation
        const time = Date.now() / 1000
        ctx.fillStyle = barColor
        ctx.globalAlpha = 0.3

        for (let i = 0; i < barCount; i++) {
          const x = (i / barCount) * canvas.width
          const waveHeight = Math.sin(time + i * 0.3) * (height * 0.4) + height * 0.5
          ctx.fillRect(x, height / 2 - waveHeight / 2, canvas.width / barCount * 0.8, waveHeight)
        }

        ctx.globalAlpha = 1
      } else {
        // Recording state - active animation
        ctx.fillStyle = barColor
        ctx.globalAlpha = 0.8

        for (let i = 0; i < barCount; i++) {
          const x = (i / barCount) * canvas.width
          const randomHeight = Math.random() * height
          ctx.fillRect(x, height / 2 - randomHeight / 2, canvas.width / barCount * 0.8, randomHeight)
        }

        ctx.globalAlpha = 1
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    animationRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording, height, barCount, barColor])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full rounded-lg bg-card/50 border border-primary/20"
    />
  )
}
