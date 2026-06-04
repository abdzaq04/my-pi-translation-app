import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Mic, Settings } from "lucide-react"
import { microphonePermissionManager } from "@/lib/services/microphone-permission"

interface MicrophonePermissionPromptProps {
  onPermissionGranted: () => void
  onPermissionDenied: () => void
  isOpen: boolean
}

export function MicrophonePermissionPrompt({
  onPermissionGranted,
  onPermissionDenied,
  isOpen,
}: MicrophonePermissionPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequestPermission = async () => {
    setIsLoading(true)
    setError(null)

    const result = await microphonePermissionManager.requestPermission()

    if (result.canRecord) {
      console.log("[v0] Microphone permission granted")
      onPermissionGranted()
    } else {
      console.log("[v0] Microphone permission denied:", result.message)
      setError(result.message)
      onPermissionDenied()
    }

    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="mx-4 w-full max-w-sm p-6 glassmorphic border-primary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/20">
            <Mic className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Microphone Access</h2>
            <p className="text-xs text-muted-foreground">Required for voice translation</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Polytalk needs permission to access your microphone so you can use voice translation. Your audio is processed
          in real-time and never stored on our servers.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? "Requesting..." : "Allow Microphone Access"}
          </Button>

          <Button
            variant="outline"
            onClick={onPermissionDenied}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            Not Now
          </Button>
        </div>

        <div className="mt-4 p-3 bg-secondary/50 rounded-lg flex items-start gap-2">
          <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            You can change this in your browser settings at any time.
          </p>
        </div>
      </Card>
    </div>
  )
}
