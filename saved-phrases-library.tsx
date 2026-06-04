"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { BookmarkCheck, Trash2, Copy } from "lucide-react"

interface SavedPhrase {
  id: string
  original: string
  translated: string
  language: { code: string; name: string; flag: string }
  tone?: string
  usageCount?: number
}

interface SavedPhrasesLibraryProps {
  phrases: SavedPhrase[]
  onUsePhrase: (phrase: SavedPhrase) => void
  onDeletePhrase: (id: string) => void
  onCopyPhrase: (text: string) => void
}

export function SavedPhrasesLibrary({
  phrases,
  onUsePhrase,
  onDeletePhrase,
  onCopyPhrase,
}: SavedPhrasesLibraryProps) {
  if (phrases.length === 0) {
    return (
      <div className="text-center py-8">
        <BookmarkCheck className="w-12 h-12 mx-auto opacity-20 mb-3" />
        <p className="text-muted-foreground text-sm">No saved phrases yet</p>
        <p className="text-xs text-muted-foreground mt-1">Bookmark translations to save them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <BookmarkCheck className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Saved Phrases ({phrases.length})</h3>
      </div>

      {phrases.map((phrase) => (
        <Card key={phrase.id} className="p-4 border-border hover:border-primary/30 transition-colors">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">Original</p>
              <p className="text-sm">{phrase.original}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">
                {phrase.language.flag} {phrase.language.name}
                {phrase.tone && ` (${phrase.tone})`}
              </p>
              <p className="text-sm text-primary">{phrase.translated}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUsePhrase(phrase)}
                className="flex-1 h-8 text-xs"
              >
                Use Again
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopyPhrase(phrase.translated)}
                className="h-8 w-8"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeletePhrase(phrase.id)}
                className="h-8 w-8 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
