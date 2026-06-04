"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Users, Briefcase, Users2, Radio, Zap } from "lucide-react"

interface UserSegmentProps {
  onSelectSegment: (segment: string) => void
}

const segments = [
  {
    id: "gen-z",
    icon: Sparkles,
    label: "Gen Z",
    description: "Content creators & social fans",
    features: ["TikTok-style UI", "Real-time streams", "Social sharing"],
    color: "from-pink-500",
  },
  {
    id: "travelers",
    icon: Zap,
    label: "Travelers",
    description: "Explore the world fearlessly",
    features: ["Offline mode", "Quick phrases", "Local tips"],
    color: "from-blue-500",
  },
  {
    id: "business",
    icon: Briefcase,
    label: "Business",
    description: "Global team collaboration",
    features: ["Meeting mode", "Transcripts", "API access"],
    color: "from-purple-500",
  },
  {
    id: "students",
    icon: Users2,
    label: "Students",
    description: "Learn & practice languages",
    features: ["Grammar hints", "Cultural notes", "Accent training"],
    color: "from-green-500",
  },
  {
    id: "communities",
    icon: Users,
    label: "Communities",
    description: "African & multilingual",
    features: ["100+ languages", "Local dialects", "Regional support"],
    color: "from-orange-500",
  },
  {
    id: "creators",
    icon: Radio,
    label: "Creators",
    description: "Streamers & podcasters",
    features: ["Live streaming", "Voice cloning", "HD export"],
    color: "from-cyan-500",
  },
]

export function UserSegmentSelector({ onSelectSegment }: UserSegmentProps) {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  const handleSelect = (segmentId: string) => {
    setSelectedSegment(segmentId)
    setTimeout(() => onSelectSegment(segmentId), 300)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-neon-blue bg-clip-text text-transparent">
            Who are you?
          </h1>
          <p className="text-foreground/60 text-sm sm:text-base">Choose your role to get started with Polytalk</p>
        </div>

        {/* Segments Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {segments.map((segment, idx) => {
            const Icon = segment.icon
            return (
              <button
                key={segment.id}
                onClick={() => handleSelect(segment.id)}
                className={`glassmorphic p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 animate-slide-up hover:shadow-lg ${
                  selectedSegment === segment.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${segment.color} to-transparent flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-1">{segment.label}</h3>
                <p className="text-xs text-muted-foreground mb-3">{segment.description}</p>
                <div className="space-y-1">
                  {segment.features.map((feature, i) => (
                    <p key={i} className="text-xs text-foreground/60 flex items-start gap-1">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{feature}</span>
                    </p>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Call to Action */}
        {selectedSegment && (
          <div className="text-center animate-slide-up">
            <p className="text-sm text-muted-foreground mb-2">Continue as</p>
            <p className="text-lg font-semibold text-primary capitalize mb-4">
              {segments.find((s) => s.id === selectedSegment)?.label}
            </p>
            <p className="text-xs text-muted-foreground">Tailored experience incoming...</p>
          </div>
        )}
      </div>
    </div>
  )
}
