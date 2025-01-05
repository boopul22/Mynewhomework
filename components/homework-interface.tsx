'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, Send, Calculator, Book, Microscope, History, Brain, Upload } from 'lucide-react'
import { useState, useRef } from "react"
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

  const handleSubmit = async () => {
    if (!question.trim()) return

    const formData = new FormData()
    formData.append('prompt', question)
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
      }
    } catch (error: any) {
      setAnswer(`Sorry, I encountered an error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
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
    <div className="flex h-full bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Subject Selection Sidebar */}
      <div className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 p-8 shadow-md">
        <div className="flex items-center mb-12">
          <div className="flex items-center gap-3 w-full">
            <div className="shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-serif font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:shadow-indigo-500/10">
              H
            </div>
            <span className="font-serif font-semibold text-2xl truncate bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              HomeworkHelper
            </span>
          </div>
        </div>

        <h2 className="text-lg font-medium mb-6 text-gray-700 dark:text-gray-300">Select Subject</h2>
        <div className="space-y-3">
          {subjects.map(({ icon: Icon, label }) => (
            <Button
              key={label}
              variant={subject === label ? "default" : "ghost"}
              className={`w-full justify-start gap-3 text-left transition-all duration-300 ${
                subject === label 
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white shadow-sm scale-105'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:scale-102 hover:shadow-sm'
              }`}
              onClick={() => setSubject(label)}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto scrollbar-hide">
        <Card className="p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-md hover:shadow-lg transition-all duration-300 group">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Ask Your Question
          </h1>
          <p className="text-muted-foreground mb-8">
            Currently helping with: {" "}
            <span className="font-medium text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-400/10 px-3 py-1.5 rounded-full">
              {subject}
            </span>
          </p>
          
          <div className="space-y-6">
            <div className="relative group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onPaste={handlePaste}
                placeholder="Type your homework question here..."
                className="w-full h-40 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all duration-300 placeholder:text-gray-400 text-lg group-hover:shadow-sm"
              />
              {question && (
                <div className="absolute bottom-4 right-4 text-sm text-gray-400">
                  {question.length} characters
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2 border-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300 group"
              >
                <Upload className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                Attach Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {imageFile && (
                <span className="text-sm text-indigo-500 dark:text-indigo-400 flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-400/10 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse"></div>
                  Image attached
                </span>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={clearForm}
                className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-300"
              >
                Clear
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                className="gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Get Help
                    <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {answer && (
          <Card className={`p-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-md hover:shadow-lg transition-all duration-300 ${
            isStreaming ? 'animate-pulse' : ''
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-all duration-300">
                <Brain className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 dark:from-white dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                Solution
              </h2>
            </div>
            <div className="prose dark:prose-invert max-w-none prose-pre:bg-gray-900/95 prose-pre:shadow-sm prose-pre:border prose-pre:border-gray-800/50">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl !bg-gray-900 shadow-lg my-6"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {answer}
              </ReactMarkdown>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

