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
    
    // Add history to the form data
    const history = messages.map(message => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }]
    }));
    formData.append('history', JSON.stringify(history));
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

      const data = await response.json()
      console.log("API Data:", data);
      
      if (!data || !data.response) {
        throw new Error('Invalid response format from API')
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }])
    } catch (error: any) {
      console.error('Error:', error)
      console.error('Full error object:', error)
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

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-900 border-r">
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-semibold">
                H
              </div>
              <span className="font-semibold">HomeworkHelper</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="Student" />
              <AvatarFallback>ST</AvatarFallback>
            </Avatar>
            <span className="text-sm">Student</span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search your questions..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 focus:outline-none"
            />
          </div>

          {/* Subjects Navigation */}
          <nav className="space-y-1 mb-4">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Calculator className="h-4 w-4" />
              <span>Mathematics</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Book className="h-4 w-4" />
              <span>English</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Microscope className="h-4 w-4" />
              <span>Science</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Brain className="h-4 w-4" />
              <span>Study Tips</span>
            </Button>
          </nav>

          {/* New Question Button */}
          <Button 
            onClick={startNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Ask new question
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-950">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold">Homework Helper</h1>
            <div className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Smart Tutor</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <PenTool className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Question and Answer Area */}
        <div className="flex-1 overflow-auto p-4 space-y-6" role="log">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Welcome to HomeworkHelper! 📚</h2>
                <p className="text-sm mb-4">
                  I'm your personal homework assistant. I can help you with:
                </p>
                <ul className="list-disc list-inside text-sm space-y-2 mb-4">
                  <li>Solving math problems step by step</li>
                  <li>Writing and editing essays</li>
                  <li>Understanding scientific concepts</li>
                  <li>Historical analysis and research</li>
                  <li>Study techniques and organization</li>
                </ul>
                <p className="text-sm">
                  Select a subject from the sidebar or ask your question below to get started!
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "p-6 rounded-lg",
                  message.role === 'user' 
                    ? "bg-blue-50/50 dark:bg-blue-950/30" 
                    : "bg-gray-50/50 dark:bg-gray-900/30"
                )}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={message.role === 'user' ? "/placeholder-user.jpg" : "/ai-avatar.png"} 
                      alt={message.role === 'user' ? "User" : "AI"} 
                    />
                    <AvatarFallback>{message.role === 'user' ? 'U' : 'AI'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/ai-avatar.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Question Input */}
        <div className="p-4 border-t bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex flex-col gap-4">
            {imageFile && (
              <div className="relative w-32 h-32">
                <img 
                  src={imageFile} 
                  alt="Uploaded preview" 
                  className="w-full h-full object-cover rounded-lg"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/70 text-white rounded-full"
                  onClick={() => setImageFile(null)}
                >
                  ×
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Ask your question..."
                className="flex-1 resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!question.trim() || isLoading}
                className="h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

