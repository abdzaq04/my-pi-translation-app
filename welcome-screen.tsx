"use client"

import { Button } from "@/components/ui/button"
import { Globe, Waves } from "lucide-react"

interface WelcomeScreenProps {
  onGetStarted: () => void
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card opacity-50" />

      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-sm mx-auto">
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 pulse-glow" />
            <div className="absolute inset-2 rounded-full bg-card border border-primary/30 flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary" />
            </div>
            {/* Sound waves */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2">
              <Waves className="w-6 h-6 text-primary/60" />
            </div>
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 rotate-180">
              <Waves className="w-6 h-6 text-primary/60" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-4 text-balance">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Polytalk</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-12 text-balance leading-relaxed">
          Speak Freely. Understand Instantly.
        </p>

        <div className="space-y-4">
          <Button
            onClick={onGetStarted}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            Get Started
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg border-border hover:bg-secondary/50 rounded-xl bg-transparent"
          >
            Sign In
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8 text-pretty">
          Break language barriers with AI-powered real-time translation
        </p>
      </div>
    </div>
  )
}
