'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon, Plus } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import HistorySlider from './history-slider'
import ProfileButton from '@/app/components/ProfileButton'
import { useChatHistory } from '@/lib/chat-history'
import { useAuth } from '@/app/context/AuthContext'
import { Header } from '@/components/ui/header'

export default function HomeworkInterface() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const answerContainerRef = useRef<HTMLDivElement>(null)
  const { addMessage, loadMessages, messages, createNewChat } = useChatHistory()
  const { user } = useAuth()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    let hasHandledItem = false;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            hasHandledItem = true;
            break;
          }
        }
      }

      // If no image was found, try to get text
      if (!hasHandledItem) {
        const text = event.clipboardData.getData('text');
        if (text) {
          setQuestion(prev => prev + text);
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
          }
        }
      }
    }
  };

  const clearImagePreview = () => {
    setImagePreview(null);
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

  useEffect(() => {
    if (user) {
      console.log('User authenticated, loading messages...');
      loadMessages().then(() => {
        console.log('Messages loaded successfully');
        // Create a new chat session if there isn't one
        if (!currentChatId) {
          setCurrentChatId(createNewChat());
        }
      }).catch(error => {
        console.error('Error loading messages:', error);
      });
    } else {
      console.log('No authenticated user');
      // Create a new chat session for anonymous users
      if (!currentChatId) {
        setCurrentChatId(createNewChat());
      }
    }
  }, [user, loadMessages, currentChatId, createNewChat]);

  const handleSubmit = async () => {
    if (!question.trim()) return

    const formData = new FormData()
    formData.append('prompt', question)
    formData.append('userId', user ? user.uid : 'anonymous')
    if (imageFile) {
      formData.append('image', imageFile)
    }

    // Clear previous state and prepare UI
    setIsLoading(true)
    setIsStreaming(true)
    setAnswer("")
    const currentQuestion = question // Store question before clearing
    setQuestion("")
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px'
    }

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
      let fullResponse = ''

      // Process the stream
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setAnswer(prev => prev + chunk)
        scrollToBottom()
      }

      // Add to chat history after getting full response
      if (currentChatId) {
        await addMessage(currentQuestion, fullResponse, currentChatId)
      } else {
        const newChatId = createNewChat()
        setCurrentChatId(newChatId)
        await addMessage(currentQuestion, fullResponse, newChatId)
      }
      
    } catch (error: any) {
      setAnswer(`Sorry, I encountered an error: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      scrollToBottom()
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

  const handleSelectChat = useCallback((selectedQuestion: string, selectedAnswer: string, chatId: string) => {
    setQuestion(selectedQuestion)
    setAnswer(selectedAnswer)
    setCurrentChatId(chatId)
    setTimeout(scrollToBottom, 100)
  }, [])

  const startNewChat = () => {
    setQuestion("")
    setAnswer("")
    setImageFile(null)
    const newChatId = createNewChat()
    setCurrentChatId(newChatId)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Update the type of onSelectChat prop in HistorySlider component
  interface HistorySliderProps {
    onSelectChat: (question: string, answer: string, chatId: string) => void;
    startNewChat: () => void;
  }

  return (
    <>
      <HistorySlider onSelectChat={handleSelectChat} startNewChat={startNewChat} />
      <div className="fixed inset-0 flex flex-col bg-background dark:bg-gradient-to-br dark:from-[#0F0F18] dark:via-[#121220] dark:to-[#0F0F18] transition-colors duration-300">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Answer Area */}
          {answer && (
            <div 
              ref={answerContainerRef} 
              className="absolute inset-0 overflow-y-auto overscroll-y-contain px-4 pb-32 max-h-[calc(100vh-8rem)]"
            >
              <div className="space-y-4 max-w-2xl mx-auto pt-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-sm">AI</span>
                  </div>
                  <div className="flex-1 prose dark:prose-invert max-w-none text-foreground text-sm">
                    {isStreaming && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return match ? (
                            <SyntaxHighlighter
                              language={match[1]}
                              style={vscDarkPlus as any}
                              className="rounded-xl border border-border !bg-secondary/50 !mt-3 !mb-3 text-xs dark:!bg-secondary/30"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-secondary/50 dark:bg-secondary/30 text-foreground rounded-lg px-1.5 py-0.5 text-xs" {...props}>
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
            <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-t from-background dark:from-[#0F0F18] to-transparent pointer-events-none"></div>
            <div className="bg-background dark:bg-secondary/10 backdrop-blur-xl rounded-xl shadow-lg border border-border p-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 shrink-0 rounded-full hover:bg-secondary transition-all duration-200"
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    try {
                      const clipboardContent = await navigator.clipboard.readText();
                      if (clipboardContent) {
                        setQuestion(prev => prev + clipboardContent);
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                        }
                      }
                    } catch (err) {
                      console.error('Failed to read clipboard:', err);
                    }
                  }}
                  className="h-8 w-8 shrink-0 rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-200"
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
                {imagePreview && (
                  <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      onClick={clearImagePreview}
                      className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-background/50 hover:bg-background/70 text-foreground transition-colors"
                    >
                      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <textarea
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onPaste={handlePaste}
                  placeholder="Ask your question here..."
                  className="flex-1 resize-none bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground text-foreground text-sm py-1.5 min-h-[36px] max-h-[120px] overflow-y-auto transition-all duration-200"
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
                  className="h-8 w-8 shrink-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <div className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

