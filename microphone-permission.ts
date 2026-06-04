/**
 * Microphone Permission Manager
 * Handles requesting, checking, and managing microphone permissions
 * across iOS, Android, and Web platforms
 */

export type PermissionStatus = "granted" | "denied" | "prompt" | "unknown"

export interface PermissionResult {
  status: PermissionStatus
  message: string
  canRecord: boolean
}

class MicrophonePermissionManager {
  private permissionCache: PermissionStatus | null = null

  async requestPermission(): Promise<PermissionResult> {
    console.log("[v0] Microphone: Requesting permission")

    try {
      // Check if already granted
      const cached = await this.checkPermission()
      if (cached.status === "granted") {
        console.log("[v0] Microphone: Permission already granted")
        return cached
      }

      // Request permission
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
        video: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop())
      
      console.log("[v0] Microphone: Permission granted")
      this.permissionCache = "granted"

      return {
        status: "granted",
        message: "Microphone permission granted",
        canRecord: true,
      }
    } catch (error) {
      return this.handlePermissionError(error)
    }
  }

  async checkPermission(): Promise<PermissionResult> {
    if (this.permissionCache) {
      return this.statusToResult(this.permissionCache)
    }

    try {
      // Use Permissions API if available
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "microphone" })
        console.log("[v0] Microphone: Permission status:", result.state)
        this.permissionCache = result.state as PermissionStatus

        result.addEventListener("change", () => {
          this.permissionCache = result.state as PermissionStatus
        })

        return this.statusToResult(result.state as PermissionStatus)
      }

      // Fallback: try to access microphone
      const constraints: MediaStreamConstraints = {
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.getTracks().forEach((track) => track.stop())
      this.permissionCache = "granted"

      return this.statusToResult("granted")
    } catch (error) {
      return this.handlePermissionError(error)
    }
  }

  private handlePermissionError(error: any): PermissionResult {
    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          console.warn("[v0] Microphone: Permission denied by user")
          this.permissionCache = "denied"
          return {
            status: "denied",
            message:
              "Microphone permission was denied. Please enable it in your browser settings to use voice translation.",
            canRecord: false,
          }

        case "NotFoundError":
          console.warn("[v0] Microphone: No microphone device found")
          return {
            status: "denied",
            message: "No microphone device found on this device.",
            canRecord: false,
          }

        case "NotReadableError":
          console.warn("[v0] Microphone: Microphone is in use")
          return {
            status: "denied",
            message: "Microphone is already in use by another application.",
            canRecord: false,
          }

        case "SecurityError":
          console.warn("[v0] Microphone: Insecure context")
          return {
            status: "denied",
            message:
              "Microphone access requires a secure connection (HTTPS). Please use HTTPS or localhost.",
            canRecord: false,
          }

        default:
          console.warn("[v0] Microphone: Unknown error:", error.message)
          return {
            status: "unknown",
            message: `Microphone error: ${error.message}`,
            canRecord: false,
          }
      }
    }

    console.error("[v0] Microphone: Unexpected error:", error)
    return {
      status: "unknown",
      message: "An unexpected error occurred while accessing the microphone.",
      canRecord: false,
    }
  }

  private statusToResult(status: PermissionStatus): PermissionResult {
    switch (status) {
      case "granted":
        return {
          status: "granted",
          message: "Microphone permission is granted",
          canRecord: true,
        }
      case "denied":
        return {
          status: "denied",
          message:
            "Microphone permission is denied. Please enable it in your browser settings.",
          canRecord: false,
        }
      case "prompt":
        return {
          status: "prompt",
          message: "Microphone permission prompt will appear",
          canRecord: false,
        }
      default:
        return {
          status: "unknown",
          message: "Microphone permission status is unknown",
          canRecord: false,
        }
    }
  }

  clearCache() {
    this.permissionCache = null
  }
}

export const microphonePermissionManager = new MicrophonePermissionManager()
