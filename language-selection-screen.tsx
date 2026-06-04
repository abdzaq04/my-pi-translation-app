"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, ChevronDown, Star } from "lucide-react"

interface Language {
  code: string
  name: string
  flag: string
}

interface LanguageSelectionScreenProps {
  onConfirm: (languages: { from: Language; to: Language }) => void
  initialLanguages: { from: Language; to: Language }
}

const POPULAR_LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
]

export function LanguageSelectionScreen({ onConfirm, initialLanguages }: LanguageSelectionScreenProps) {
  const [fromLanguage, setFromLanguage] = useState<Language>(initialLanguages.from)
  const [toLanguage, setToLanguage] = useState<Language>(initialLanguages.to)
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)

  const handleConfirm = () => {
    onConfirm({ from: fromLanguage, to: toLanguage })
  }

  const swapLanguages = () => {
    const temp = fromLanguage
    setFromLanguage(toLanguage)
    setToLanguage(temp)
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4 text-balance">Choose Your Languages</h1>
        <p className="text-muted-foreground text-balance">Select the languages you want to translate between</p>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full space-y-6">
        {/* From Language */}
        <div className="relative">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">From</label>
          <Card
            className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors border-border"
            onClick={() => setShowFromDropdown(!showFromDropdown)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{fromLanguage.flag}</span>
                <span className="font-medium">{fromLanguage.name}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          {showFromDropdown && (
            <Card className="absolute top-full left-0 right-0 mt-2 p-2 z-10 max-h-60 overflow-y-auto border-border">
              {POPULAR_LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg cursor-pointer"
                  onClick={() => {
                    setFromLanguage(lang)
                    setShowFromDropdown(false)
                  }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swapLanguages}
            className="rounded-full w-12 h-12 border-border hover:bg-secondary/50 bg-transparent"
          >
            <ArrowRight className="w-5 h-5 rotate-90" />
          </Button>
        </div>

        {/* To Language */}
        <div className="relative">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">To</label>
          <Card
            className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors border-border"
            onClick={() => setShowToDropdown(!showToDropdown)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{toLanguage.flag}</span>
                <span className="font-medium">{toLanguage.name}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>

          {showToDropdown && (
            <Card className="absolute top-full left-0 right-0 mt-2 p-2 z-10 max-h-60 overflow-y-auto border-border">
              {POPULAR_LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg cursor-pointer"
                  onClick={() => {
                    setToLanguage(lang)
                    setShowToDropdown(false)
                  }}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        <Card className="p-4 border-border">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Favorite Languages</span>
          </div>
          <p className="text-sm text-muted-foreground">Save your most used language pairs for quick access</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">Features</span>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>✓ Real-time voice translation</div>
            <div>✓ Text input support</div>
            <div>✓ Tone & context awareness</div>
            <div>✓ Saved phrases library</div>
            <div>✓ Offline language packs</div>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Button
          onClick={handleConfirm}
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
