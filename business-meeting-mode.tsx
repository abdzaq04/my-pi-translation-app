"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Briefcase, Play, Pause, Record, Download, Users } from "lucide-react"

interface MeetingParticipant {
  id: string
  name: string
  role: "participant" | "speaker"
  language: string
}

interface MeetingSpeaker {
  participantId: string
  timestamp: string
  duration: number
  originalText: string
  translations: Record<string, string>
}

export function BusinessMeetingMode() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speakers, setSpeakers] = useState<MeetingSpeaker[]>([
    {
      participantId: "1",
      timestamp: "00:15",
      duration: 45,
      originalText:
        "I&apos;d like to discuss our Q3 strategy and how we can improve our market position in Southeast Asia.",
      translations: {
        Spanish: "Me gustaría discutir nuestra estrategia de Q3 y cómo podemos mejorar nuestra posición de mercado...",
        German: "Ich möchte unsere Q3-Strategie besprechen und wie wir unsere Marktposition in Südostasien verbessern können...",
      },
    },
  ])
  const [participants] = useState<MeetingParticipant[]>([
    { id: "1", name: "John (CEO)", role: "speaker", language: "English" },
    { id: "2", name: "Maria (Manager)", role: "participant", language: "Spanish" },
    { id: "3", name: "Klaus (Director)", role: "participant", language: "German" },
  ])

  const downloadMeetingTranscript = () => {
    const transcript = speakers
      .map((speaker) => {
        const participant = participants.find((p) => p.id === speaker.participantId)
        const translations = Object.entries(speaker.translations)
          .map(([lang, text]) => `\n[${lang}] ${text}`)
          .join("")
        return `[${speaker.timestamp}] ${participant?.name}:\n${speaker.originalText}${translations}\n`
      })
      .join("\n")

    const element = document.createElement("a")
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`)
    element.setAttribute("download", `meeting-transcript-${Date.now()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-4">
      {/* Meeting Header */}
      <Card className="glassmorphic p-4 border-accent/30 bg-gradient-to-r from-accent/10 to-primary/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Business Meeting Translation</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Recording Time</p>
            <p className="text-lg font-mono font-bold text-accent">02:34</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex-1 gap-2 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"}`}
          >
            {isRecording ? (
              <>
                <Pause className="w-4 h-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Record className="w-4 h-4" />
                Start Recording
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="gap-2 border-primary/30 hover:bg-primary/10"
            onClick={downloadMeetingTranscript}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </Card>

      {/* Participants */}
      <Card className="glassmorphic p-4 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Participants ({participants.length})</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/20"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold">
                {participant.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{participant.name}</p>
                <p className="text-xs text-muted-foreground">{participant.language}</p>
              </div>
              {participant.role === "speaker" && <Record className="w-3 h-3 text-red-500 animate-pulse" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Meeting Transcript */}
      {speakers.length > 0 && (
        <Card className="glassmorphic p-4 border-primary/20">
          <h4 className="text-sm font-semibold mb-3">Transcript</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {speakers.map((speaker, idx) => {
              const participant = participants.find((p) => p.id === speaker.participantId)
              return (
                <div key={idx} className="border-b border-border/20 pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-primary">{participant?.name}</p>
                      <p className="text-xs text-muted-foreground">{speaker.timestamp}</p>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                      {speaker.duration}s
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 mb-2">{speaker.originalText}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(speaker.translations).map(([lang, text]) => (
                      <div key={lang} className="text-xs bg-secondary/40 p-2 rounded border border-border/20">
                        <p className="font-medium text-primary/80">{lang}</p>
                        <p className="text-foreground/80">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
