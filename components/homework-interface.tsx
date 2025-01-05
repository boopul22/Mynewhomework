'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Plus, Settings, Square, Maximize2, Send, Search, Book, Calculator, PenTool, Microscope, History, Brain } from 'lucide-react'
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

export default function HomeworkInterface() {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImageFile(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async () => {
    if (!question.trim()) return
    console.log("Sending message with question:", question);

    const formData = new FormData()
    formData.append('prompt', question)
    
    // Add image if present
    if (imageFile) {
      formData.append('image', imageFile)
    }
    
    formData.append('stream', 'false');

    const newMessage: Message = {
      role: 'user',
      content: question + (imageFile ? ' [Image attached]' : '')
    }

    setMessages(prev => [...prev, newMessage])
    setQuestion("")
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsLoading(true)
    scrollToBottom()

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        body: formData,
      })
      console.log("API Response:", response);

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error Response:', errorData)
        throw new Error(
          `API request failed with status ${response.status}: ${errorData}`
        )
      }

      const responseText = await response.text()
      console.log("API Response Text:", responseText);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText
      }])
    } catch (error: any) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error while processing your request: ${error.message || 'Unknown error'}`
      }])
    } finally {
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const startNewChat = () => {
    setMessages([])
    setQuestion("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.focus()
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSendMessage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [question]);

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-[#f5f5f0]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 shadow-lg transition-all duration-200 ease-in-out">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-serif font-bold hover:bg-blue-700 transition-colors">
                H
              </div>
              <span className="font-serif font-semibold text-xl">HomeworkHelper</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile with better hover state */}
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer">
            <Avatar className="h-8 w-8 ring-2 ring-offset-2 ring-blue-500">
              <AvatarImage src="/placeholder-user.jpg" alt="Student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">Student</span>
          </div>

          {/* Enhanced Search */}
          <div className="relative mb-4 group">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search your questions..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Search questions"
            />
          </div>

          {/* Subjects Navigation with improved hover states */}
          <nav className="space-y-1 mb-4">
            {[
              { icon: Calculator, label: 'Mathematics' },
              { icon: Book, label: 'English' },
              { icon: Microscope, label: 'Science' },
              { icon: History, label: 'History' },
              { icon: Brain, label: 'Study Tips' },
            ].map(({ icon: Icon, label }) => (
              <Button
                key={label}
                variant="ghost"
                className="w-full justify-start gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            ))}
          </nav>

          {/* Enhanced New Question Button */}
          <Button 
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 gap-2 transform hover:scale-[1.02] transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Ask new question
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#f5f5f0] dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-lg font-semibold">Homework Helper</h1>
            <div className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
              Smart Tutor
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 font-serif hover:bg-blue-50"
            >
              <PenTool className="h-4 w-4" />
              Notes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 font-serif hover:bg-blue-50"
            >
              <Calculator className="h-4 w-4" />
              Calculator
            </Button>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          className="flex-1 overflow-auto p-6 space-y-6 scrollbar-hide" 
          role="log"
          aria-live="polite"
        >
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg",
                  message.role === "user"
                    ? "bg-white shadow-md ml-auto max-w-[80%] border border-gray-100"
                    : "bg-blue-50 mr-auto max-w-[80%] border border-blue-100 font-serif"
                )}
              >
                <div className="flex items-start gap-3">
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/teacher-avatar.png" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">T</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1">
                    <div className="text-sm mb-1 text-gray-500">
                      {message.role === "user" ? "You" : "Teacher"}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="p-8 bg-white rounded-xl shadow-md border border-gray-100">
                <h2 className="font-serif text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Welcome to HomeworkHelper! 📚</h2>
                <p className="text-sm mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                  I'm your personal homework assistant. Feel free to ask any questions about your studies!
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Calculator, label: 'Math Problems' },
                    { icon: Book, label: 'Essay Help' },
                    { icon: Microscope, label: 'Science Questions' },
                    { icon: Brain, label: 'Study Tips' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-4">
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value)
                    adjustTextareaHeight()
                  }}
                  placeholder="Type your question here..."
                  className="w-full bg-transparent border-0 focus:ring-0 resize-none text-sm min-h-[40px] max-h-[200px] font-serif"
                  style={{ height: 'auto' }}
                />
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Image
                  </Button>
                  {imageFile && <span className="text-xs text-blue-600">Image attached</span>}
                </div>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!question.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Press Ctrl + Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

