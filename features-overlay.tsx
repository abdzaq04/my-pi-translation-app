"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MessageCircle, Bookmark, Download, Wand2, Globe } from "lucide-react"

interface FeaturesOverlayProps {
  onDismiss: () => void
}

export function FeaturesOverlay({ onDismiss }: FeaturesOverlayProps) {
  const features = [
    {
      icon: Mic,
      title: "Voice-First Translation",
      description: "Real-time speech-to-speech translation with automatic language detection and two-way conversation mode",
    },
    {
      icon: MessageCircle,
      title: "Conversational UI",
      description: "Chat-style interface with message bubbles showing translations in real-time as you speak or type",
    },
    {
      icon: Wand2,
      title: "Tone & Context",
      description: "Choose between Formal, Casual, Business, or Travel modes for context-aware translations",
    },
    {
      icon: Bookmark,
      title: "Saved Phrases",
      description: "Bookmark frequently used translations for quick access in repeated conversations",
    },
    {
      icon: Download,
      title: "Offline Mode",
      description: "Download language packs to enable basic translation without internet connection",
    },
    {
      icon: Globe,
      title: "All Languages",
      description: "Support for 100+ world languages with cultural nuance and idiom translation",
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <Card className="w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Polytalk Features</h2>
            <p className="text-muted-foreground text-sm">Powerful tools for global communication</p>
          </div>

          <div className="grid gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Button onClick={onDismiss} size="lg" className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12">
            Get Started
          </Button>
        </div>
      </Card>
    </div>
  )
}
