'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon, Plus, Coins, LogOut, User, X, Loader2 } from 'lucide-react'
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
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/app/firebase/config';
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter } from 'next/navigation'
import { createUserProfile } from '@/lib/user-service'

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
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'groq'>('gemini')

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
    const currentQuestion = question;
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

      // Use selected model's endpoint
      const response = await fetch(`/api/${selectedModel}`, {
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

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const { uid, email, displayName, photoURL } = result.user;
        
        if (!email) {
          throw new Error('No email provided from Google Auth');
        }
        
        try {
          // Create user profile
          await createUserProfile(uid, {
            uid,
            email,
            displayName: displayName || email.split('@')[0],
            photoURL: photoURL || '',
          });
        } catch (error) {
          console.error('Error creating user profile:', error);
          toast({
            title: 'Error',
            description: 'Failed to create user profile. Please try again.',
            variant: 'destructive',
          });
          await auth.signOut();
        }
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Please enable popups for this site to sign in with Google.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 border-b gap-2 sm:gap-0">
        <div className="flex items-center justify-center w-full sm:w-auto sm:flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'gemini' | 'groq')}
              className="bg-background text-foreground border rounded px-2 py-1 text-sm w-full sm:w-auto min-w-[120px]"
            >
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
            </select>
            {imageFile && selectedModel === 'groq' && (
              <div className="text-yellow-500 text-xs text-center sm:text-left">
                Note: Image input is only supported with Gemini
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <ThemeToggle />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="p-2">
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 text-sm"
              onClick={handleSignIn}
            >
              <User className="h-3 w-3" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </div>
      
      {showCreditAlert && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3 rounded-lg mx-2 my-1 sm:m-4">
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Question Limit Reached</h4>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {user 
                  ? "You've reached your daily question limit. Upgrade your plan to ask more questions."
                  : "Sign up to get more questions and unlock full access!"}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(user ? '/subscription' : '/login')}
              className="text-amber-600 hover:text-amber-700 border-amber-300 w-full"
            >
              {user ? 'Upgrade Plan' : 'Sign Up Now'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreditAlert(false)}
              className="text-amber-600 hover:text-amber-700 w-full"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 relative h-[calc(100vh-4rem)] sm:h-[calc(100vh-2rem)]">
        <div className={`absolute sm:relative transition-all duration-300 ease-in-out h-full ${isHistoryOpen ? 'w-full sm:w-64 z-30' : 'w-0'}`}>
          <HistorySlider onSelectChat={handleSelectChat} startNewChat={startNewChat} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
        </div>
        
        <div className={`flex-1 flex flex-col relative min-w-0 transition-all duration-300 ease-in-out ${isHistoryOpen ? 'sm:ml-4' : ''}`}>
          {/* Answer Area */}
          <div 
            ref={answerContainerRef} 
            className="flex-1 overflow-y-auto overscroll-y-contain px-2 sm:px-4 pb-32 mt-4 sm:mt-16 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {(answer || isLoading) && (
              <div className="space-y-4 w-full max-w-[calc(100vw-1rem)] sm:max-w-2xl mx-auto pt-2 sm:pt-6 pb-24">
                <div className="prose dark:prose-invert max-w-none text-foreground text-sm sm:text-base">
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
                            className="rounded-xl border border-border !bg-secondary/50 !mt-4 !mb-4 text-xs sm:text-sm p-2 sm:p-4 dark:!bg-secondary/30 overflow-x-auto"
                            showLineNumbers={true}
                            wrapLines={true}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-secondary/50 dark:bg-secondary/30 text-foreground rounded-lg px-1.5 py-0.5 text-sm" {...props}>
                            {children}
                          </code>
                        )
                      },
                      h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold mt-4 sm:mt-6 mb-3 sm:mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold mt-4 sm:mt-5 mb-2 sm:mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold mt-3 sm:mt-4 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 sm:pl-6 mb-3 sm:mb-4 space-y-1 sm:space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 sm:pl-6 mb-3 sm:mb-4 space-y-1 sm:space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="text-sm sm:text-base">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary/50 pl-3 sm:pl-4 italic my-3 sm:my-4 text-muted-foreground text-sm sm:text-base">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 sm:my-4 -mx-2 sm:mx-0">
                          <table className="min-w-full border border-border rounded-lg text-sm">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border-b border-border bg-secondary/50 px-3 py-1.5 sm:px-4 sm:py-2 text-left font-semibold text-sm">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border-b border-border px-3 py-1.5 sm:px-4 sm:py-2 text-sm">
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
          <div className={`fixed bottom-0 w-full max-w-full sm:max-w-3xl p-2 sm:p-4 bg-background/80 backdrop-blur-sm border-t border-border transition-all duration-300 ease-in-out ${isHistoryOpen ? 'sm:left-[calc(16rem+1rem)]' : 'left-0'}`} style={{ right: '0', margin: '0 auto' }}>
            <div className="bg-background dark:bg-secondary/10 backdrop-blur-xl rounded-xl shadow-sm border border-border p-2 relative z-10">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
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
                
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value)
                    e.target.style.height = '36px'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  onPaste={handlePaste}
                  placeholder="Ask your homework question..."
                  className="flex-1 bg-transparent border-0 outline-none resize-none text-sm p-2 h-9 min-h-[36px] max-h-[120px] placeholder:text-muted-foreground w-full"
                  disabled={isLoading}
                />
                
                <div className="flex items-center gap-2 shrink-0">
                  {imagePreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearImagePreview}
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!question.trim() || isLoading}
                    className="rounded-full px-3 h-8 text-xs font-medium whitespace-nowrap"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Processing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3 w-3" />
                        <span>Send</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

