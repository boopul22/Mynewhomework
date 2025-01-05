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
    <div className="flex h-full bg-[#f5f5f0]">
      {/* Subject Selection Sidebar */}
      <div className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-serif font-bold">
              H
            </div>
            <span className="font-serif font-semibold text-xl">HomeworkHelper</span>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-4">Select Subject</h2>
        <div className="space-y-2">
          {subjects.map(({ icon: Icon, label }) => (
            <Button
              key={label}
              variant={subject === label ? "default" : "ghost"}
              className="w-full justify-start gap-3 text-left"
              onClick={() => setSubject(label)}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold mb-2">Ask Your Question</h1>
          <p className="text-muted-foreground mb-6">Currently helping with: {subject}</p>
          
          <div className="space-y-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your homework question here..."
              className="w-full h-32 p-4 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Attach Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {imageFile && <span className="text-sm text-muted-foreground">Image attached</span>}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={clearForm}>
                Clear
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} className="gap-2">
                {isLoading ? 'Processing...' : 'Get Help'}
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {answer && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Solution</h2>
            <div className={`prose dark:prose-invert max-w-none ${isStreaming ? 'animate-pulse' : ''}`}>
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

