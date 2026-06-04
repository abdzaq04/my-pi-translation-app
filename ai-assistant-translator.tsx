"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Volume2, Copy } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  currentLanguagePair?: { from: string; to: string }
}

const suggestedQuestions = [
  "How do I say hello in all these languages?",
  "What are common phrases for travelers?",
  "Explain this phrase in context",
  "Help me understand cultural differences",
  "What's the most natural way to say this?",
]

export function AIAssistantTranslator({ currentLanguagePair }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hey! I'm Poly, your AI translator assistant. I can help you understand nuances, cultural context, slang, idioms, and so much more. Ask me anything about languages!`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `That's a great question! In translation, context is everything. The phrase "${input}" can have multiple meanings depending on...
        
• Formality level (formal vs casual)
• Regional variations
• Cultural nuances
• Tone of voice

Let me break it down for you with examples and help you understand the best way to express this idea across languages.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold">Poly - AI Translator</p>
          <p className="text-xs text-muted-foreground">Always learning & helping</p>
        </div>
      </div>

      {/* Messages */}
      <Card className="glassmorphic p-4 border-primary/20 max-h-96 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-primary/20 border border-primary/30 text-foreground"
                  : "bg-secondary/50 border border-primary/20 text-foreground/90"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className="text-xs text-muted-foreground mt-1">{msg.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 border border-primary/20 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
          <div className="grid grid-cols-1 gap-2">
            {suggestedQuestions.slice(0, 3).map((question, idx) => (
              <button
                key={idx}
                onClick={() => setInput(question)}
                className="text-left px-3 py-2 rounded-lg bg-secondary/30 border border-border/30 hover:border-primary/50 hover:bg-secondary/50 transition-colors text-sm text-foreground/80 hover:text-foreground"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Ask me anything about languages..."
          className="flex-1 px-4 py-2 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim()}
          size="icon"
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
