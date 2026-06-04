"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Plus, Trash2, Volume2, Mic, Copy, Download } from "lucide-react"

interface GroupParticipant {
  id: string
  name: string
  language: string
  flag: string
  color: string
}

interface GroupMessage {
  id: string
  participantId: string
  participantName: string
  originalText: string
  translatedTexts: Record<string, string>
  timestamp: Date
}

export function GroupConversationMode() {
  const [participants, setParticipants] = useState<GroupParticipant[]>([
    { id: "1", name: "You", language: "English", flag: "🇺🇸", color: "from-blue-500" },
    { id: "2", name: "Sofia", language: "Spanish", flag: "🇪🇸", color: "from-purple-500" },
    { id: "3", name: "Yuki", language: "Japanese", flag: "🇯🇵", color: "from-pink-500" },
  ])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState("")

  const addParticipant = () => {
    if (!newParticipantName.trim()) return
    const newParticipant: GroupParticipant = {
      id: Date.now().toString(),
      name: newParticipantName,
      language: "Select Language",
      flag: "🌍",
      color: "from-green-500",
    }
    setParticipants([...participants, newParticipant])
    setNewParticipantName("")
    setShowAddParticipant(false)
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const downloadTranscript = () => {
    const transcript = messages
      .map((msg) => {
        const translations = Object.entries(msg.translatedTexts)
          .map(([lang, text]) => `${lang}: ${text}`)
          .join("\n")
        return `${msg.participantName} (${msg.timestamp.toLocaleTimeString()}):\n${msg.originalText}\n${translations}\n`
      })
      .join("\n---\n")

    const element = document.createElement("a")
    element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`)
    element.setAttribute("download", `group-translation-${Date.now()}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="space-y-4">
      {/* Participants List */}
      <Card className="glassmorphic p-4 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-semibold">Group ({participants.length})</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAddParticipant(!showAddParticipant)}
            className="hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {/* Add Participant Input */}
        {showAddParticipant && (
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={newParticipantName}
              onChange={(e) => setNewParticipantName(e.target.value)}
              placeholder="Participant name..."
              className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <Button
              size="sm"
              onClick={addParticipant}
              className="bg-primary hover:bg-primary/90"
            >
              Add
            </Button>
          </div>
        )}

        {/* Participants Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className={`bg-gradient-to-br ${participant.color} to-transparent rounded-lg p-3 relative group animate-slide-up`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm text-white">{participant.name}</p>
                  <p className="text-xs text-white/80">
                    {participant.flag} {participant.language}
                  </p>
                </div>
                {participant.id !== "1" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeParticipant(participant.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Group Chat Area */}
      {messages.length > 0 && (
        <Card className="glassmorphic p-4 border-primary/20 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="border-b border-border/30 pb-3 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">{participants.find((p) => p.id === msg.participantId)?.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary">{msg.participantName}</p>
                    <p className="text-sm text-foreground/80 break-words mb-2">{msg.originalText}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(msg.translatedTexts).map(([lang, text]) => (
                        <div key={lang} className="bg-secondary/30 p-2 rounded border border-border/20">
                          <p className="text-muted-foreground font-medium">{lang}</p>
                          <p className="text-foreground/90">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1 bg-primary hover:bg-primary/90 gap-2" disabled={messages.length === 0}>
          <Copy className="w-4 h-4" />
          Copy Transcript
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2 border-primary/30 hover:bg-primary/10"
          onClick={downloadTranscript}
          disabled={messages.length === 0}
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>
    </div>
  )
}
