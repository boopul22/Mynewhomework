'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

export default function HomeworkInterface() {
  const [question, setQuestion] = useState("")
  const [subject, setSubject] = useState<string>("Mathematics")
  const [answer, setAnswer] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerContainerRef = useRef<HTMLDivElement>(null)

  const subjects = [
    { icon: Calculator, label: 'Mathematics' },
    { icon: Book, label: 'English' },
    { icon: Microscope, label: 'Science' },
    { icon: History, label: 'History' },
    { icon: Brain, label: 'Study Tips' },
  ]

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

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              setImageFile(base64String);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
  };

  const scrollToBottom = useCallback(() => {
    if (answerContainerRef.current) {
      const scrollContainer = answerContainerRef.current;
      const scrollHeight = scrollContainer.scrollHeight;
      const height = scrollContainer.clientHeight;
      const maxScroll = scrollHeight - height;
      scrollContainer.scrollTo({
        top: maxScroll,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    if (answer && isStreaming) {
      scrollToBottom();
    }
  }, [answer, isStreaming, scrollToBottom]);

  const handleSubmit = async () => {
    if (!question.trim()) return

    const formData = new FormData()
    formData.append('prompt', question)
    formData.append('userId', 'user-' + Math.random().toString(36).substr(2, 9))
    if (imageFile) {
      formData.append('image', imageFile)
    }
    formData.append('stream', 'true')

    setIsLoading(true)
    setIsStreaming(true)
    setAnswer("")

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        setAnswer(prev => prev + text)
        setTimeout(scrollToBottom, 0)
      }
    } catch (error: any) {
      setAnswer(`Sorry, I encountered an error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setTimeout(scrollToBottom, 100)
    }
  }

  const clearForm = () => {
    setQuestion("")
    setAnswer("")
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-[#F8F1F8] via-[#FFF4F9] to-[#F8F1F8]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#4D4352] flex items-center justify-center">
            <span className="text-white text-sm">SH</span>
          </div>
          <span className="text-sm font-medium text-[#4D4352]">SayHalo</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#4D4352] hover:bg-[#F8F1F8]/50 rounded-full">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Welcome Message */}
        {!answer && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-[280px] -translate-y-[10vh]">
              <div className="space-y-1.5">
                <h1 className="text-[15px] font-medium text-[#4D4352]">Hi there</h1>
                <p className="text-sm text-[#4D4352]">Can I help you with anything?</p>
                <p className="text-xs text-[#6B6B6B]">
                  Ready to assist with your questions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Answer Area */}
        {answer && (
          <div 
            ref={answerContainerRef} 
            className="absolute inset-0 overflow-y-auto overscroll-y-contain px-4 pb-32"
          >
            <div className={`space-y-4 max-w-2xl mx-auto pt-6 ${isStreaming ? 'animate-pulse' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[#4D4352] flex items-center justify-center">
                  <span className="text-white text-sm">AI</span>
                </div>
                <div className="flex-1 prose max-w-none text-[#4D4352] text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <SyntaxHighlighter
                            language={match[1]}
                            style={vscDarkPlus as any}
                            className="rounded-xl border border-[#E8E8E8] !bg-[#FAFAFA] !mt-3 !mb-3 text-xs"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-[#F8F1F8] text-[#4D4352] rounded-lg px-1.5 py-0.5 text-xs" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl">
        <div className="relative">
          <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-[#F8F1F8] to-transparent pointer-events-none"></div>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-[#E8E8E8] dark:border-gray-800 p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 shrink-0 rounded-full text-[#6B6B6B] hover:bg-[#F8F1F8] transition-all duration-200"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onPaste={handlePaste}
                placeholder="Ask your question here..."
                className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-[#6B6B6B] text-[#4D4352] text-sm py-1.5 min-h-[36px] max-h-[120px] overflow-y-auto transition-all duration-200"
                style={{ height: '36px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !question.trim()}
                className="h-8 w-8 shrink-0 rounded-full bg-[#E8927C] hover:bg-[#E88070] disabled:opacity-50 disabled:hover:bg-[#E8927C] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

