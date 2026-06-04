import { memo, useCallback, useRef, useState } from "react"
import { Loader, Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TextInputAreaProps {
  onSendText: (text: string) => void
  isTranslating: boolean
}

/**
 * Isolated Text Input Component - ZERO parent re-renders
 * - Manages own state internally
 * - Never triggers parent updates during typing
 * - Only notifies parent on Enter/Send
 */
export const TextInputArea = memo(function TextInputArea({
  onSendText,
  isTranslating,
}: TextInputAreaProps) {
  const [textInput, setTextInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Pure onChange - NO parent callbacks, NO expensive operations
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value)
  }, [])

  // Handle Enter key - ONLY callback to parent on Send
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isTranslating) {
      const value = (e.target as HTMLInputElement).value.trim()
      if (value) {
        e.preventDefault()
        onSendText(value)
        setTextInput("") // Clear input after sending
      }
    }
  }, [onSendText, isTranslating])

  // Handle Send button click
  const handleSendClick = useCallback(() => {
    const value = textInput.trim()
    if (value && !isTranslating) {
      onSendText(value)
      setTextInput("")
    }
  }, [onSendText, isTranslating])

  return (
    <div className="flex gap-2 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <input
        ref={inputRef}
        type="text"
        value={textInput}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="Type something..."
        className="flex-1 px-4 py-3 rounded-full bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all placeholder:text-muted-foreground/60"
        autoComplete="off"
        spellCheck="false"
        disabled={isTranslating}
      />
      <Button
        onClick={handleSendClick}
        disabled={!textInput.trim() || isTranslating}
        size="icon"
        className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        title="Send Translation"
      >
        {isTranslating ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </Button>
    </div>
  )
})

TextInputArea.displayName = "TextInputArea"
