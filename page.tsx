"use client"

import { useState, useEffect, useCallback } from "react"
import { WelcomeScreen } from "@/components/welcome-screen"
import { LanguageSelectionScreen } from "@/components/language-selection-screen"
import { TranslatorScreen } from "@/components/translator-screen"
import { FeaturesOverlay } from "@/components/features-overlay"

type Screen = "welcome" | "language-selection" | "translator"

interface SelectedLanguages {
  from: { code: string; name: string; flag: string }
  to: { code: string; name: string; flag: string }
}

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome")
  const [showFeatures, setShowFeatures] = useState(false)
  const [selectedLanguages, setSelectedLanguages] = useState<SelectedLanguages>({
    from: { code: "en", name: "English", flag: "🇺🇸" },
    to: { code: "es", name: "Spanish", flag: "🇪🇸" },
  })
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize features only once
  useEffect(() => {
    if (isInitialized) return
    
    try {
      const hasSeenFeatures = typeof window !== "undefined" && localStorage?.getItem("polytalk-features-seen")
      if (!hasSeenFeatures) {
        setShowFeatures(true)
        localStorage?.setItem("polytalk-features-seen", "true")
      }
    } catch (error) {
      console.error("[v0] localStorage error:", error)
    }
    
    setIsInitialized(true)
  }, [isInitialized])

  const handleGetStarted = useCallback(() => {
    setShowFeatures(false)
    setCurrentScreen("language-selection")
  }, [])

  const handleLanguageConfirm = useCallback((languages: SelectedLanguages) => {
    setSelectedLanguages(languages)
    setCurrentScreen("translator")
  }, [])

  const handleBackToLanguages = useCallback(() => {
    setCurrentScreen("language-selection")
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {showFeatures && <FeaturesOverlay onDismiss={handleGetStarted} />}
      {currentScreen === "welcome" && <WelcomeScreen onGetStarted={handleGetStarted} />}
      {currentScreen === "language-selection" && (
        <LanguageSelectionScreen onConfirm={handleLanguageConfirm} initialLanguages={selectedLanguages} />
      )}
      {currentScreen === "translator" && (
        <TranslatorScreen languages={selectedLanguages} onBackToLanguages={handleBackToLanguages} />
      )}
    </div>
  )
}
