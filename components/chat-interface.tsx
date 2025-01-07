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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

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
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 border-r bg-background">
        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your questions..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Subjects Navigation */}
          <nav className="space-y-1.5 mb-6">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-secondary transition-colors">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Mathematics</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-secondary transition-colors">
              <Book className="h-4 w-4 text-primary" />
              <span>English</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-secondary transition-colors">
              <Microscope className="h-4 w-4 text-primary" />
              <span>Science</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-secondary transition-colors">
              <History className="h-4 w-4 text-primary" />
              <span>History</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-secondary transition-colors">
              <Brain className="h-4 w-4 text-primary" />
              <span>Study Tips</span>
            </Button>
          </nav>

          {/* New Question Button */}
          <Button 
            onClick={startNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4 gap-2 h-11 rounded-xl shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Ask new question
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">Homework Helper</h1>
            <div className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">Smart Tutor</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
              <PenTool className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-secondary">
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div key={message.id} className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${index % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} rounded-2xl px-4 py-3`}>
                  <p className="text-sm">{index % 2 === 0 ? message.question : message.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="max-w-3xl mx-auto flex gap-4">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary">
              <Plus className="h-4 w-4" />
            </Button>
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-secondary rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button size="icon" className="h-10 w-10 rounded-xl">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}