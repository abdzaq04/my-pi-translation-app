"use client"

import { useEffect, useState } from "react"

interface PolytalkMascotProps {
  message?: string
  isListening?: boolean
  isProcessing?: boolean
}

export function PolytalkMascot({ message, isListening, isProcessing }: PolytalkMascotProps) {
  const [displayMessage, setDisplayMessage] = useState(message)

  useEffect(() => {
    setDisplayMessage(message)
  }, [message])

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Mascot SVG - Friendly speaking character */}
      <div className="relative w-16 h-16 mb-2">
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full animate-bounce"
          style={{ animationDuration: isListening ? "1s" : "2s" }}
        >
          {/* Face */}
          <circle cx="32" cy="32" r="28" fill="url(#gradient)" stroke="currentColor" strokeWidth="2" className="text-primary/80" />

          {/* Eyes */}
          <circle cx="22" cy="26" r="3" fill="white" />
          <circle cx="42" cy="26" r="3" fill="white" />

          {/* Pupils - looking toward audio */}
          <circle cx="23" cy="26" r="1.5" fill="currentColor" className="text-primary" />
          <circle cx="43" cy="26" r="1.5" fill="currentColor" className="text-primary" />

          {/* Smile */}
          <path
            d="M 20 35 Q 32 42 44 35"
            stroke="white"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Sound wave - shows when listening */}
          {isListening && (
            <>
              <path
                d="M 32 48 Q 35 50 38 48"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                className="text-primary/60 animate-pulse"
              />
              <path
                d="M 28 48 Q 25 50 22 48"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                className="text-primary/60 animate-pulse"
              />
            </>
          )}

          {/* Gradient Definition */}
          <defs>
            <radialGradient id="gradient" cx="35%" cy="35%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.1)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.05)" />
            </radialGradient>
          </defs>
        </svg>

        {/* Thinking indicator - shows when processing */}
        {isProcessing && (
          <div className="absolute -top-2 -right-2">
            <div className="relative w-4 h-4">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
              <div className="absolute inset-1 bg-primary rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Helper Message */}
      {displayMessage && (
        <p className="text-xs text-center text-muted-foreground px-2 py-1 bg-secondary/50 rounded-full whitespace-nowrap animate-fade-in">
          {displayMessage}
        </p>
      )}
    </div>
  )
}
