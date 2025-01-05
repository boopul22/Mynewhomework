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
  const [currentChat, setCurrentChat] = useState<string[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const { messages, addMessage, clearHistory } = useChatHistory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // Here you would typically send the question to your AI backend
    // For now, let's just add a mock response
    const mockResponse = "This is a mock response to your question. In a real application, this would be the AI's response."
    
    // Add the question and answer to history
    addMessage(question, mockResponse)
    
    // Add to current chat
    setCurrentChat(prev => [...prev, question, mockResponse])
    
    // Clear the input
    setQuestion("")
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white/95 dark:bg-gray-900/95 border-r backdrop-blur-sm transition-all duration-200 ease-in-out">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-600/20">
                H
              </div>
              <span className="font-semibold text-lg">HomeworkHelper</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 cursor-pointer">
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
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-gray-100/80 dark:bg-gray-800/80 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* Subjects Navigation */}
          <nav className="space-y-1.5 mb-6">
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span>Mathematics</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Book className="h-4 w-4 text-green-600" />
              <span>English</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Microscope className="h-4 w-4 text-purple-600" />
              <span>Science</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <History className="h-4 w-4 text-orange-600" />
              <span>History</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50">
        <header className="flex items-center justify-between px-6 py-4 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">Homework Helper</h1>
            <div className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">Smart Tutor</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
              <PenTool className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
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
                    <div className="h-8 w-8 rounded-lg bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                      <Calculator className="h-4 w-4" />
                    </div>
                    Solving math problems step by step
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-green-100/50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                      <PenTool className="h-4 w-4" />
                    </div>
                    Writing and editing essays
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-purple-100/50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                      <Microscope className="h-4 w-4" />
                    </div>
                    Understanding scientific concepts
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-orange-100/50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                      <History className="h-4 w-4" />
                    </div>
                    Historical analysis and research
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <div className="h-8 w-8 rounded-lg bg-pink-100/50 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
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
                      ? "bg-blue-50/50 dark:bg-blue-900/20" // User message
                      : "bg-gray-50/50 dark:bg-gray-900/20" // AI response
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
        <div className="p-6 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Plus className="h-4 w-4" />
              Upload File
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <PenTool className="h-4 w-4" />
              Draw
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <Calculator className="h-4 w-4" />
              Formula
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <textarea
              ref={textareaRef}
              placeholder="Type your homework question here..."
              className={cn(
                "flex-1 resize-none outline-none text-sm bg-transparent",
                "min-h-[40px] max-h-[200px] py-2",
                "placeholder:text-muted-foreground"
              )}
              rows={1}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value)
                adjustTextareaHeight()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button 
              type="submit"
              disabled={!question.trim()}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white h-10 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200"
              size="icon"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send question</span>
            </Button>
          </form>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              📚 Subject Guides
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              📝 Practice Problems
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              🎯 Study Tools
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}