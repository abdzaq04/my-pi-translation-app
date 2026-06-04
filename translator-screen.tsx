"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Play, Settings, ArrowLeftRight, Volume2, Send, Bookmark, BookmarkCheck, Wifi, WifiOff, Wand2, MessageCircle, Type, Languages, Lock, AlertCircle, Loader } from "lucide-react"
import { PolytalkMascot } from "./polytalk-mascot"
import { SubscriptionModal } from "./subscription-modal"
import { UsageLimitBanner } from "./usage-limit-banner"
import { WaveformVisualizer } from "./waveform-visualizer"
import PolytalkWebRecorder from "./polytalk-web-recorder"
import { getSubscription, canTranslate, incrementTranslationCount } from "@/lib/services/subscription"
import { audioRecordingService } from "@/lib/services/audio-recording"
import { whisperSTTService } from "@/lib/services/whisper-stt"
import { elevenLabsService } from "@/lib/services/elevenlabs-tts"
import { microphonePermissionManager } from "@/lib/services/microphone-permission"
import { MicrophonePermissionPrompt } from "./microphone-permission-prompt"
import { polytalkMonitoring } from "@/lib/polytalk-monitoring"
import { withRetry } from "@/lib/retry-system"
import { useTranslation } from "@/lib/hooks/use-translation"
import { TextInputArea } from "./text-input-area"

interface Language {
  code: string
  name: string
  flag: string
}

interface TranslatorScreenProps {
  languages: { from: Language; to: Language }
  onBackToLanguages: () => void
}

interface Message {
  id: string
  type: "spoken" | "translated"
  text: string
  language: Language
  timestamp: Date
  isSaved?: boolean
  tone?: string
}

type Tone = "formal" | "casual" | "business" | "travel"
type InputMode = "voice" | "text"

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "business", label: "Business" },
  { value: "travel", label: "Travel" },
]

export function TranslatorScreen({ languages, onBackToLanguages }: TranslatorScreenProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedTone, setSelectedTone] = useState<Tone>("casual")
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [inputMode, setInputMode] = useState<InputMode>("voice")
  const [isOnline, setIsOnline] = useState(true)
  const [showToneSelector, setShowToneSelector] = useState(false)
  const [savedPhrases, setSavedPhrases] = useState<Message[]>([])
  const [showSavedPhrases, setShowSavedPhrases] = useState(false)
  const [conversationMode, setConversationMode] = useState(false)
  const [mascotMessage, setMascotMessage] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscription, setSubscription] = useState(getSubscription())
  const [error, setError] = useState<string | null>(null)
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)
  const [selectedTranslationProvider, setSelectedTranslationProvider] = useState<"google" | "deepl" | "openai">("deepl")

  // Use translation hook for non-blocking translation
  const {
    performTranslation,
    debouncedTranslate,
    isTranslating,
    error: translationError,
    cancel: cancelTranslation,
  } = useTranslation({
    debounceMs: 500,
    onTranslationStart: () => {
      setMascotMessage("Translating...")
    },
    onTranslationComplete: (result) => {
      if (result?.translatedText) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          type: "translated",
          text: result.translatedText,
          language: languages.to,
          timestamp: new Date(),
          tone: selectedTone,
        }])
        incrementTranslationCount()
        setMascotMessage("Translation complete!")
      }
    },
    onTranslationError: (err) => {
      setError(err.message)
      setMascotMessage("Translation error: " + err.message)
    },
  })

  const handleMicPress = useCallback(async () => {
    // Check subscription quota before recording
    if (!canTranslate()) {
      setMascotMessage("Daily limit reached! Upgrade to Premium")
      setShowSubscriptionModal(true)
      return
    }

    if (isRecording) {
      // Stop recording mode
      try {
        setIsRecording(false)
        setMascotMessage("Processing...")
        
        const audioBlob = await withRetry(
          () => audioRecordingService.stopRecording(),
          { maxAttempts: 2 }
        )

        if (!audioBlob || audioBlob.size === 0) {
          setError("No audio recorded")
          setMascotMessage("Recording failed")
          return
        }

        setIsProcessing(true)

        // Transcribe with retry
        const transcription = await withRetry(
          () => whisperSTTService.transcribeAudio(audioBlob, languages.from.code),
          { maxAttempts: 2 }
        )

        if (!transcription?.text?.trim()) {
          setError("Could not transcribe audio")
          return
        }

        setMessages((prev) => [...prev, {
          id: Date.now().toString(),
          type: "spoken",
          text: transcription.text,
          language: languages.from,
          timestamp: new Date(),
          tone: selectedTone,
        }])

        // Translate with retry
        setMascotMessage("Translating...")
        const translation = await withRetry(
          () => multiProviderTranslationService.translate({
            text: transcription.text,
            sourceLanguage: languages.from.name,
            targetLanguage: languages.to.name,
            tone: selectedTone,
            provider: selectedTranslationProvider,
          }),
          { maxAttempts: 3 }
        )

        if (!translation?.translatedText?.trim()) {
          setError("Translation failed")
          return
        }

        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          type: "translated",
          text: translation.translatedText,
          language: languages.to,
          timestamp: new Date(),
          tone: selectedTone,
        }])

        // TTS with retry
        setMascotMessage("Playing response...")
        await withRetry(
          () => elevenLabsService.speak(translation.translatedText, {
            language: languages.to.code,
            voice_gender: "female",
          }),
          { maxAttempts: 2 }
        )

        incrementTranslationCount()
        setMascotMessage("Done!")
        setIsProcessing(false)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        polytalkMonitoring.reportCrash("handleMicPress", err, { mode: "stop" })
        setError(errorMsg)
        setMascotMessage("Error: " + errorMsg)
        setIsProcessing(false)
      }
    } else {
      // Start recording mode
      try {
        setError(null)
        setIsRecording(true)
        setMascotMessage("Listening...")
        
        const permissionResult = await microphonePermissionManager.checkPermission()
        if (!permissionResult.canRecord) {
          setShowPermissionPrompt(true)
          setIsRecording(false)
          return
        }

        await audioRecordingService.startRecording({
          sampleRate: 16000,
          channels: 1,
        })
      } catch (err) {
        polytalkMonitoring.reportCrash("handleMicPress", err, { mode: "start" })
        const errorMsg = err instanceof Error ? err.message : "Recording failed"
        setError(errorMsg)
        setMascotMessage("Error: " + errorMsg)
        setIsRecording(false)
      }
    }
  }, [isRecording, languages, selectedTone, selectedTranslationProvider])

  const handleSendText = useCallback(async (text: string) => {
    if (!text.trim()) return

    if (!canTranslate()) {
      setMascotMessage("Daily limit reached! Upgrade to Premium")
      setShowSubscriptionModal(true)
      return
    }

    try {
      setError(null)
      setInputMode("text")

      // Add original message immediately (non-blocking)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: "spoken",
        text: text,
        language: languages.from,
        timestamp: new Date(),
        tone: selectedTone,
      }])

      // Perform translation asynchronously without blocking UI
      performTranslation(
        text,
        languages.from.name,
        languages.to.name,
        selectedTone,
        selectedTranslationProvider
      )
    } catch (err) {
      polytalkMonitoring.reportCrash("handleSendText", err, { mode: "text" })
      const errorMsg = err instanceof Error ? err.message : "Translation failed"
      setError(errorMsg)
      setMascotMessage("Error: " + errorMsg)
    }
  }, [languages, selectedTone, selectedTranslationProvider, performTranslation])

  const handlePlayTranslation = (messageId: string) => {
    setIsPlaying(messageId)
    setTimeout(() => {
      setIsPlaying(null)
    }, 2000)
  }

  const toggleSavePhrase = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId)
    if (!message) return

    const isAlreadySaved = savedPhrases.some((p) => p.id === messageId)

    if (isAlreadySaved) {
      setSavedPhrases((prev) => prev.filter((p) => p.id !== messageId))
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isSaved: false } : m))
      )
    } else {
      setSavedPhrases((prev) => [...prev, { ...message, isSaved: true }])
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isSaved: true } : m))
      )
    }
  }

  const useSavedPhrase = (phrase: Message) => {
    const translatedMsg: Message = {
      id: (Date.now() + 1).toString(),
      type: "translated",
      text: `Saved: ${phrase.text}`,
      language: languages.to,
      timestamp: new Date(),
      isSaved: true,
    }

    setMessages((prev) => [...prev, phrase, translatedMsg])
    setShowSavedPhrases(false)
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 bg-background">
      {/* Microphone Permission Prompt */}
      <MicrophonePermissionPrompt
        isOpen={showPermissionPrompt}
        onPermissionGranted={() => {
          setShowPermissionPrompt(false)
          handleMicPress()
        }}
        onPermissionDenied={() => setShowPermissionPrompt(false)}
      />

      {/* Usage Limit Banner - Only show for free tier */}
      {subscription.tier === 'free' && <UsageLimitBanner onUpgradeClick={() => setShowSubscriptionModal(true)} isFreeTier={true} />}

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onUpgradeSuccess={(transactionId) => {
          setSubscription(getSubscription())
          setMascotMessage("🎉 Welcome to Premium!")
        }}
      />
      {/* Header with Language Pair and Premium Badge */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onBackToLanguages} className="rounded-full hover:bg-secondary/50">
          <Settings className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onBackToLanguages}
            className="flex items-center gap-2 px-3 py-2 rounded-full border-primary/30 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-1">
              <span className="text-lg">{languages.from.flag}</span>
              <span className="font-medium text-xs sm:text-sm">{languages.from.name}</span>
            </div>
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <div className="flex items-center gap-1">
              <span className="text-lg">{languages.to.flag}</span>
              <span className="font-medium text-xs sm:text-sm">{languages.to.name}</span>
            </div>
          </Button>
          
          {/* Premium Badge */}
          {subscription.tier === 'premium' && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/30 rounded-full">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Premium</span>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOnline(!isOnline)}
          className="rounded-full hover:bg-secondary/50"
          title={isOnline ? "Online Mode" : "Offline Mode"}
        >
          {isOnline ? (
            <Wifi className="w-5 h-5 text-primary" />
          ) : (
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Mascot Guide */}
      <div className="flex justify-center mb-4">
        <PolytalkMascot message={mascotMessage} isListening={isRecording} isProcessing={isProcessing || isTranslating} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-500">Error</p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Waveform Visualizer - Only show when recording */}
      {isRecording && inputMode === "voice" && (
        <div className="mb-4 animate-fade-in">
          <WaveformVisualizer isRecording={isRecording} height={60} barCount={30} />
        </div>
      )}

      {/* Input Mode & Settings Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button
          variant={inputMode === "voice" ? "default" : "outline"}
          onClick={() => setInputMode("voice")}
          className={`flex flex-col items-center justify-center gap-1 h-auto py-3 rounded-xl transition-all ${
            inputMode === "voice" ? "bg-primary hover:bg-primary/90" : "hover:bg-secondary/50"
          }`}
        >
          <Mic className="w-5 h-5" />
          <span className="text-xs font-medium">Speak</span>
        </Button>

        <Button
          variant={inputMode === "text" ? "default" : "outline"}
          onClick={() => setInputMode("text")}
          className={`flex flex-col items-center justify-center gap-1 h-auto py-3 rounded-xl transition-all ${
            inputMode === "text" ? "bg-primary hover:bg-primary/90" : "hover:bg-secondary/50"
          }`}
        >
          <Type className="w-5 h-5" />
          <span className="text-xs font-medium">Type</span>
        </Button>

        <Button
          variant={showToneSelector ? "default" : "outline"}
          onClick={() => setShowToneSelector(!showToneSelector)}
          className={`flex flex-col items-center justify-center gap-1 h-auto py-3 rounded-xl transition-all ${
            showToneSelector ? "bg-primary hover:bg-primary/90" : "hover:bg-secondary/50"
          }`}
        >
          <Wand2 className="w-5 h-5" />
          <span className="text-xs font-medium">Tone</span>
        </Button>
      </div>

      {/* Tone Selector Dropdown */}
      {showToneSelector && (
        <Card className="mb-4 p-3 border-primary/30 bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Choose Tone:</p>
          <div className="grid grid-cols-2 gap-2">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.value}
                onClick={() => {
                  setSelectedTone(tone.value)
                  setShowToneSelector(false)
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedTone === tone.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 hover:bg-secondary text-foreground"
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Translation Provider Selector */}
      <Card className="mb-4 p-3 border-primary/20 bg-card/50 glassmorphic rounded-xl">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Translation Engine:</p>
        <div className="grid grid-cols-3 gap-2">
          {(['deepl', 'google', 'openai'] as const).map((provider) => (
            <button
              key={provider}
              onClick={() => setSelectedTranslationProvider(provider)}
              className={`px-2 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                selectedTranslationProvider === provider
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 hover:bg-secondary text-foreground"
              }`}
            >
              {provider === 'deepl' ? 'DeepL' : provider === 'google' ? 'Google' : 'OpenAI'}
            </button>
          ))}
        </div>
      </Card>

      {/* Saved Phrases & Conversation Mode */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={showSavedPhrases ? "default" : "outline"}
          size="sm"
          onClick={() => setShowSavedPhrases(!showSavedPhrases)}
          className="flex items-center gap-1 text-xs rounded-lg"
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Saved ({savedPhrases.length})</span>
        </Button>

        <Button
          variant={conversationMode ? "default" : "outline"}
          size="sm"
          onClick={() => setConversationMode(!conversationMode)}
          className="flex items-center gap-1 text-xs rounded-lg ml-auto"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Conversation</span>
        </Button>
      </div>

      {/* Saved Phrases Panel */}
      {showSavedPhrases && savedPhrases.length > 0 && (
        <Card className="mb-4 p-3 border-primary/20 bg-primary/5 max-h-32 overflow-y-auto rounded-xl animate-in fade-in duration-200">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Quick Access</p>
          <div className="space-y-1">
            {savedPhrases.map((phrase) => (
              <button
                key={phrase.id}
                onClick={() => useSavedPhrase(phrase)}
                className="w-full text-left p-2 bg-card/50 hover:bg-primary/10 rounded-lg text-xs truncate transition-colors duration-150"
              >
                {phrase.text}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Messages Area - Chat Style */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 px-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Languages className="w-12 h-12 text-primary/30 mb-3" />
            <p className="text-muted-foreground text-sm font-medium mb-1">
              Ready to translate!
            </p>
            <p className="text-muted-foreground text-xs px-4">
              {inputMode === "voice"
                ? "Press the Speak button and say something to get started"
                : "Type a message to see it instantly translated"}
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex ${message.type === "spoken" ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <Card
                className={`max-w-xs p-4 rounded-2xl shadow-sm transition-all duration-200 ${
                  message.type === "spoken"
                    ? "bg-card border-border hover:border-primary/30"
                    : "bg-primary/15 border-primary/30 hover:bg-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <span>{message.language.flag}</span>
                      <span>{message.language.name}</span>
                      {message.tone && (
                        <span className="ml-1 px-2 py-0.5 bg-secondary/50 rounded-full text-xs">
                          {message.tone}
                        </span>
                      )}
                    </p>
                    <p className="text-sm break-words leading-relaxed text-foreground/90">{message.text}</p>
                  </div>
                  <div className="flex gap-2 ml-3 flex-shrink-0">
                    {message.type === "translated" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePlayTranslation(message.id)}
                        disabled={isPlaying === message.id}
                        className="h-8 w-8 hover:bg-primary/10 transition-colors"
                        title="Play Translation"
                      >
                        {isPlaying === message.id ? (
                          <Volume2 className="w-4 h-4 animate-pulse text-primary" />
                        ) : (
                          <Play className="w-4 h-4 text-primary" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSavePhrase(message.id)}
                      className="h-8 w-8 hover:bg-primary/10 transition-colors"
                      title={message.isSaved ? "Remove Bookmark" : "Save Phrase"}
                    >
                      {message.isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-primary" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            ))}
            
            {/* Loading Indicator - Show while translating */}
            {isTranslating && (
              <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="bg-primary/15 border-primary/30 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-primary font-medium">Translating...</span>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Text Input Area */}
      {inputMode === "text" && (
        <TextInputArea
          onSendText={handleSendText}
          isTranslating={isTranslating}
        />
      )}

      {/* Microphone Button Area */}
      {inputMode === "voice" && (
        <div className="flex flex-col items-center gap-3 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            size="lg"
            onClick={handleMicPress}
            disabled={isProcessing || isTranslating}
            className={`w-28 h-28 rounded-full transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl ${
              isRecording
                ? "bg-red-500 hover:bg-red-600 pulse-glow scale-110"
                : "bg-primary hover:bg-primary/90 hover:scale-105"
            } ${(isProcessing || isTranslating) ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isRecording ? "Release to send" : "Press to speak"}
          >
            {isProcessing || isTranslating ? (
              <Loader className="w-10 h-10 animate-spin" />
            ) : (
              <Mic className={`w-10 h-10 ${isRecording ? "animate-pulse" : ""}`} />
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center px-2">
            {isProcessing || isTranslating ? (
              <span className="font-medium text-primary flex items-center justify-center gap-1">
                <Loader className="w-3 h-3 animate-spin" />
                {isTranslating ? "Translating..." : "Processing..."}
              </span>
            ) : isRecording ? (
              <span className="font-medium text-primary flex items-center justify-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Listening... Speak clearly
              </span>
            ) : (
              "Press & hold to speak"
            )}
          </p>

          {!isOnline && (
            <p className="text-xs text-yellow-600 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
              Using offline language pack
            </p>
          )}
        </div>
      )}
    </div>
  )
