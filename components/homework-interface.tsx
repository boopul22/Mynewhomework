'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon, Plus, Coins, LogOut, User, Menu } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
import HistorySlider from './history-slider'
import { useChatHistory } from '@/lib/chat-history'
import { useAuth } from '@/app/context/AuthContext'
import { useQuestion } from '@/lib/subscription-service'
import { toast } from '@/components/ui/use-toast'
import { signOut } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter } from 'next/navigation'

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
  const [showCreditAlert, setShowCreditAlert] = useState(false)
  const router = useRouter()
  const [isHistoryOpen, setIsHistoryOpen] = useState(true)

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
    if (!question.trim()) return;

    const formData = new FormData();
    formData.append('prompt', question);
    formData.append('userId', user ? user.uid : 'anonymous');
    if (imageFile) {
      formData.append('image', imageFile);
    }

    // Clear previous state and prepare UI
    setIsLoading(true);
    setIsStreaming(true);
    setAnswer("");
    const currentQuestion = question; // Store question before clearing
    setQuestion("");
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }

    try {
      // Check if user has enough credits
      if (!user) {
        router.push('/login');
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const canAskQuestion = await useQuestion(user.uid);
      if (!canAskQuestion) {
        setIsLoading(false);
        setIsStreaming(false);
        toast({
          title: 'Daily Limit Reached',
          description: (
            <div className="space-y-2">
              <p>You've reached your daily question limit.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/subscription')}
                className="w-full mt-2"
              >
                Upgrade Plan to Ask More Questions
              </Button>
            </div>
          ),
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/gemini', {
        method: 'POST',
        body: formData,
      });

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-7xl mx-auto">
      {showCreditAlert && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100">Question Limit Reached</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {user 
                  ? "You've reached your daily question limit. Upgrade your plan to ask more questions."
                  : "Sign up to get more questions and unlock full access!"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(user ? '/subscription' : '/login')}
              className="text-amber-600 hover:text-amber-700 border-amber-300"
            >
              {user ? 'Upgrade Plan' : 'Sign Up Now'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreditAlert(false)}
              className="text-amber-600 hover:text-amber-700"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 relative h-[calc(100vh-2rem)]">
        <div className={`transition-all duration-300 ease-in-out ${isHistoryOpen ? 'w-64' : 'w-0'}`}>
          <HistorySlider onSelectChat={handleSelectChat} startNewChat={startNewChat} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
        </div>
        
        <div className={`flex-1 flex flex-col relative min-w-0 transition-all duration-300 ease-in-out ${isHistoryOpen ? 'ml-4' : ''}`}>
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          
          {/* Answer Area */}
          <div 
            ref={answerContainerRef} 
            className="flex-1 overflow-y-auto overscroll-y-contain px-4 pb-32 mt-16 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {(answer || isLoading) && (
              <div className="space-y-4 w-full max-w-2xl mx-auto pt-6">
                <div className="flex-1 prose dark:prose-invert max-w-none text-foreground text-sm">
                  {isLoading && !answer && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Thinking...</span>
                    </div>
                  )}
                  {isStreaming && answer && (
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
                            className="rounded-xl border border-border !bg-secondary/50 !mt-4 !mb-4 text-sm p-4 dark:!bg-secondary/30"
                            showLineNumbers={true}
                            wrapLines={true}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-secondary/50 dark:bg-secondary/30 text-foreground rounded-lg px-2 py-1 text-sm" {...props}>
                            {children}
                          </code>
                        )
                      },
                      h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-base leading-relaxed mb-4">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="text-base">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-muted-foreground">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border border-border rounded-lg">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border-b border-border bg-secondary/50 px-4 py-2 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-b border-border px-4 py-2">
                          {children}
                        </td>
                      ),
                    }}
                    className="prose-pre:my-0"
                  >
                    {answer}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="relative w-full max-w-3xl p-4 bg-background/80 backdrop-blur-sm border-t border-border transition-all duration-300 ease-in-out mx-auto">
            <div className="bg-background dark:bg-secondary/10 backdrop-blur-xl rounded-xl shadow-sm border border-border p-2 relative z-10">
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
                    if (e.target.value.includes('\n')) {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }
                  }}
                  onPaste={handlePaste}
                  placeholder="Ask me anything about your homework"
                  className="flex w-full resize-none bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ 
                    minHeight: '36px', 
                    maxHeight: '120px',
                    height: '36px',
                    lineHeight: '36px',
                    paddingTop: '0px',
                    paddingBottom: '0px'
                  }}
                  ref={textareaRef}
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
                  className="h-9 w-9 shrink-0 rounded-full bg-primary hover:bg-primary/90 dark:bg-primary/90 dark:hover:bg-primary disabled:opacity-50 disabled:hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="h-3.5 w-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

