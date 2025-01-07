import { useRef, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Calculator,
  Book,
  Microscope,
  History,
  Brain,
  PenTool,
  Plus,
  Search,
  Send,
  Settings,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useChatHistory } from "@/lib/chat-history"
import { format } from "date-fns"

export default function ChatInterface() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentChat, setCurrentChat] = useState<string[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const { messages, addMessage, clearHistory } = useChatHistory()
  const MAX_CHARS = 1000
  const [isFocused, setIsFocused] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Debounce the textarea height adjustment
  const debouncedAdjustHeight = useRef<NodeJS.Timeout>()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return
    if (question.length > MAX_CHARS) return

    setIsLoading(true)
    try {
      // Store the question for potential retry
      const currentQuestion = question.trim()
      
      // Clear input early for better UX
      setQuestion("")
      adjustTextareaHeight()

      // Here you would typically send the question to your AI backend
      const mockResponse = "This is a mock response to your question. In a real application, this would be the AI's response."
      
      // Add the question and answer to history
      addMessage(currentQuestion, mockResponse)
      
      // Add to current chat
      setCurrentChat(prev => [...prev, currentQuestion, mockResponse])

      // Scroll to bottom with a small delay to ensure content is rendered
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Error submitting question:', error)
      // Restore the question if submission failed
      setQuestion(question)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as any)
      return
    }
    
    // Handle Tab key for better accessibility
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      setQuestion(prev => 
        prev.substring(0, start) + '    ' + prev.substring(end)
      )
      // Set cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4
        }
      }, 0)
    }
  }

  const adjustTextareaHeight = () => {
    // Clear any pending adjustment
    if (debouncedAdjustHeight.current) {
      clearTimeout(debouncedAdjustHeight.current)
    }

    // Debounce the height adjustment
    debouncedAdjustHeight.current = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "56px"
        const scrollHeight = textareaRef.current.scrollHeight
        textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`
      }
    }, 10)
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault()
    const items = e.clipboardData?.items
    let hasHandledItem = false

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
              setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            hasHandledItem = true
            break
          }
        }
      }

      // If no image was found, try to get text
      if (!hasHandledItem) {
        const text = e.clipboardData.getData('text')
        if (text && text.length + question.length <= MAX_CHARS) {
          setQuestion(prev => prev + text)
          adjustTextareaHeight()
        }
      }
    }
  }

  const clearImagePreview = () => {
    setImagePreview(null)
  }

  const startNewChat = () => {
    setCurrentChat([]) // Clear current chat
    setQuestion("") // Clear input
    setSelectedChatId(null) // Clear selected chat
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.focus()
    }
  }

  const loadChat = (chatId: string) => {
    const chat = messages.find(m => m.id === chatId)
    if (chat) {
      setSelectedChatId(chatId)
      setCurrentChat([chat.question, chat.answer])
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-background border-r backdrop-blur-sm transition-all duration-200 ease-in-out">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-600/20">
                H
              </div>
              <span className="font-semibold text-lg">HomeworkHelper</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted transition-colors">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl hover:bg-muted transition-all duration-200 cursor-pointer">
            <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-blue-600/20">
              <AvatarImage src="/placeholder-user.jpg" alt="Student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">Student</span>
              <span className="text-xs text-muted-foreground">Free Plan</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your questions..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Subjects Navigation */}
          <nav className="space-y-1.5 mb-6">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-muted transition-colors">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span>Mathematics</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-muted transition-colors">
              <Book className="h-4 w-4 text-green-600" />
              <span>English</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-muted transition-colors">
              <Microscope className="h-4 w-4 text-purple-600" />
              <span>Science</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-muted transition-colors">
              <History className="h-4 w-4 text-orange-600" />
              <span>History</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-muted transition-colors">
              <Brain className="h-4 w-4 text-pink-600" />
              <span>Study Tips</span>
            </Button>
          </nav>

          {/* New Question Button */}
          <Button 
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 gap-2 h-11 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Ask new question
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Homework Helper</h1>
            <div className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">Smart Tutor</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
              <PenTool className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Question and Answer Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6" role="log">
          <div className="space-y-6">
            {currentChat.length === 0 ? (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Welcome to HomeworkHelper! 📚</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  I'm your personal homework assistant. I can help you with:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600">
                      <Calculator className="h-4 w-4" />
                    </div>
                    Solving math problems step by step
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-green-100/50 flex items-center justify-center text-green-600">
                      <PenTool className="h-4 w-4" />
                    </div>
                    Writing and editing essays
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-purple-100/50 flex items-center justify-center text-purple-600">
                      <Microscope className="h-4 w-4" />
                    </div>
                    Understanding scientific concepts
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-orange-100/50 flex items-center justify-center text-orange-600">
                      <History className="h-4 w-4" />
                    </div>
                    Historical analysis and research
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-pink-100/50 flex items-center justify-center text-pink-600">
                      <Brain className="h-4 w-4" />
                    </div>
                    Study techniques and organization
                  </li>
                </ul>
              </div>
            ) : (
              currentChat.map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-lg",
                    index % 2 === 0 
                      ? "bg-blue-50/50" // User message
                      : "bg-muted/50" // AI response
                  )}
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-8 w-8">
                      {index % 2 === 0 ? (
                        <AvatarFallback>U</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">{message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Question Input */}
        <div className="p-6 border-t bg-background/50 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => {
                const newValue = e.target.value
                if (newValue.length <= MAX_CHARS) {
                  setQuestion(newValue)
                  adjustTextareaHeight()
                }
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask your question here... (Cmd/Ctrl + Enter to submit)"
              aria-label="Question input"
              className={cn(
                "w-full min-h-[56px] max-h-[200px] p-4 pr-24 rounded-xl",
                "border bg-background",
                "placeholder:text-sm placeholder:text-gray-400 placeholder:align-middle",
                imagePreview ? "pb-28" : ""
              )}
              disabled={isLoading}
            />
            {imagePreview && (
              <div className="absolute left-4 bottom-4 flex items-center gap-2">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="Pasted" className="w-full h-full object-cover" />
                  <button
                    onClick={clearImagePreview}
                    className="absolute top-1 right-1 p-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <div className="absolute right-4 bottom-4 flex items-center gap-3">
              <span className={cn(
                "text-xs transition-colors",
                question.length > MAX_CHARS ? "text-red-500" : 
                question.length > MAX_CHARS * 0.9 ? "text-yellow-500" : 
                "text-muted-foreground"
              )}>
                {question.length}/{MAX_CHARS}
              </span>
              <Button 
                type="button"
                size="icon"
                onClick={async () => {
                  try {
                    // Try to get clipboard content
                    const clipboardContent = await navigator.clipboard.readText();
                    if (clipboardContent && clipboardContent.length + question.length <= MAX_CHARS) {
                      setQuestion(prev => prev + clipboardContent);
                      adjustTextareaHeight();
                    }
                  } catch (err) {
                    console.error('Failed to read clipboard:', err);
                  }
                }}
                className={cn(
                  "h-8 w-8 rounded-lg transition-all duration-200",
                  "bg-muted hover:bg-muted/80",
                  "border border-border",
                  "text-muted-foreground"
                )}
                aria-label="Paste from clipboard"
              >
                <svg 
                  className="h-4 w-4"
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </Button>
              <Button 
                type="submit" 
                size="icon"
                disabled={isLoading || !question.trim() || question.length > MAX_CHARS}
                className={cn(
                  "h-8 w-8 rounded-lg transition-all",
                  isLoading ? "opacity-50 cursor-not-allowed" : 
                  question.trim() && question.length <= MAX_CHARS 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "hover:bg-muted hover:bg-muted/80"
                )}
                aria-label="Send message"
              >
                <Send className={cn(
                  "h-4 w-4 transition-all",
                  isLoading ? "animate-pulse" : ""
                )} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}