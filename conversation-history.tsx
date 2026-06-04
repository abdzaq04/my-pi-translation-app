"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Trash2, Download, Pin, Share2 } from "lucide-react"

interface HistoryItem {
  id: string
  date: Date
  languages: { from: string; to: string }
  messageCount: number
  preview: string
  pinned: boolean
}

export function ConversationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([
    {
      id: "1",
      date: new Date(Date.now() - 3600000),
      languages: { from: "English", to: "Spanish" },
      messageCount: 12,
      preview: "Hello, how are you today? → Hola, ¿cómo estás hoy?",
      pinned: true,
    },
    {
      id: "2",
      date: new Date(Date.now() - 86400000),
      languages: { from: "English", to: "Japanese" },
      messageCount: 8,
      preview: "Thank you for your help → ご協力ありがとうございます",
      pinned: false,
    },
    {
      id: "3",
      date: new Date(Date.now() - 172800000),
      languages: { from: "French", to: "Portuguese" },
      messageCount: 15,
      preview: "Bonjour, enchanté → Olá, encantado",
      pinned: false,
    },
  ])

  const [filter, setFilter] = useState("all")

  const pinnedItems = history.filter((item) => item.pinned)
  const recentItems = history.filter((item) => !item.pinned)

  const togglePin = (id: string) => {
    setHistory(history.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)))
  }

  const deleteItem = (id: string) => {
    setHistory(history.filter((item) => item.id !== id))
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Conversation History</h3>
        </div>
        <div className="flex gap-1 bg-secondary/30 rounded-lg p-1">
          {["all", "today", "week"].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "ghost"}
              onClick={() => setFilter(f)}
              className="text-xs capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Pinned</p>
          <div className="space-y-2">
            {pinnedItems.map((item) => (
              <HistoryItemCard key={item.id} item={item} onPin={togglePin} onDelete={deleteItem} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Recent</p>
          <div className="space-y-2">
            {recentItems.map((item) => (
              <HistoryItemCard key={item.id} item={item} onPin={togglePin} onDelete={deleteItem} />
            ))}
          </div>
        </div>
      )}

      {history.length === 0 && (
        <Card className="glassmorphic p-8 border-primary/20 text-center">
          <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No conversations yet. Start translating!</p>
        </Card>
      )}
    </div>
  )
}

interface HistoryItemCardProps {
  item: HistoryItem
  onPin: (id: string) => void
  onDelete: (id: string) => void
}

function HistoryItemCard({ item, onPin, onDelete }: HistoryItemCardProps) {
  return (
    <Card className="glassmorphic p-3 border-primary/20 group hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold truncate">
              {item.languages.from} → {item.languages.to}
            </span>
            {item.pinned && <Pin className="w-3 h-3 text-accent" />}
          </div>
          <p className="text-xs text-muted-foreground truncate mb-2">{item.preview}</p>
          <p className="text-xs text-muted-foreground/60">{item.messageCount} messages · {formatDate(item.date)}</p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onPin(item.id)}
            className="h-8 w-8 hover:bg-primary/10"
            title={item.pinned ? "Unpin" : "Pin"}
          >
            <Pin className={`w-3 h-3 ${item.pinned ? "text-accent fill-accent" : ""}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-primary/10"
            title="Share"
          >
            <Share2 className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(item.id)}
            className="h-8 w-8 hover:bg-red-500/10"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
