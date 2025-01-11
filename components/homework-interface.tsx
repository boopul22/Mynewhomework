'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon, Plus, Coins, LogOut, User, X, Loader2, Atom, Beaker, PenTool } from 'lucide-react'
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
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

export default function HomeworkInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [answer, setAnswer] = useState('');
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { user } = useAuth();
  const { createNewChat, addMessage, loadMessages } = useChatHistory();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState("");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCreditAlert, setShowCreditAlert] = useState(false);
  const router = useRouter();
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string>('');

  // Error handler type
  const handleError = (error: Error) => {
    console.error('Error:', error);
    setAnswer(`Sorry, I encountered an error: ${error.message || 'Unknown error'}`);
  };

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
    if (answerRef.current) {
      const scrollContainer = answerRef.current;
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
    setCurrentQuestionText(question);
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

      // Use Groq endpoint
      const response = await fetch('/api/groq', {
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
        await addMessage(currentQuestionText, fullResponse, currentChatId)
      } else {
        const newChatId = createNewChat()
        setCurrentChatId(newChatId)
        await addMessage(currentQuestionText, fullResponse, newChatId)
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
    setCurrentQuestionText(selectedQuestion)
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
        <HistorySlider onSelectChat={handleSelectChat} startNewChat={startNewChat} isOpen={isHistoryOpen} setIsOpen={setIsHistoryOpen} />
        
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Answer Area */}
          <div 
            ref={answerRef} 
            className="flex-1 overflow-y-auto overscroll-y-contain px-4 pb-32 mt-4 sm:mt-16 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative"
            style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          >
            {(answer || isLoading) && (
              <div className="space-y-4 w-full max-w-2xl mx-auto pt-2 sm:pt-6 pb-24">
                {/* User's Question Display */}
                <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Your Question:</span>
                  </div>
                  <p className="text-sm text-foreground">{currentQuestionText || "Loading..."}</p>
                </div>
                
                {/* AI's Answer Display */}
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
                        if (match && match[1] === 'math') {
                          return <BlockMath math={String(children).replace(/\n$/, '')} />
                        }
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
                      p: ({ children }) => {
                        const childArray = React.Children.toArray(children)
                        
                        // Enhanced math detection for both inline and block math
                        const hasInlineMath = childArray.some(child => 
                          typeof child === 'string' && child.includes('$') && !child.includes('$$')
                        )
                        const hasBlockMath = childArray.some(child =>
                          typeof child === 'string' && child.includes('$$')
                        )
                        
                        if (!hasInlineMath && !hasBlockMath) {
                          return <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">{children}</p>
                        }

                        return (
                          <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4">
                            {childArray.map((child, index) => {
                              if (typeof child !== 'string') return child
                              
                              // Handle block math first ($$...$$)
                              const blockParts = child.split(/(\$\$[^\$]+\$\$)/g)
                              return blockParts.map((part, i) => {
                                if (part.startsWith('$$') && part.endsWith('$$')) {
                                  const math = part.slice(2, -2)
                                  return (
                                    <div key={`${index}-block-${i}`} className="my-4 flex justify-center">
                                      <BlockMath math={math} />
                                    </div>
                                  )
                                }
                                
                                // Then handle inline math ($...$)
                                const inlineParts = part.split(/(\$[^\$]+\$)/g)
                                return inlineParts.map((inlinePart, j) => {
                                  if (inlinePart.startsWith('$') && inlinePart.endsWith('$')) {
                                    const math = inlinePart.slice(1, -1)
                                    return <InlineMath key={`${index}-inline-${i}-${j}`} math={math} />
                                  }
                                  return inlinePart
                                })
                              })
                            })}
                          </p>
                        )
                      },
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

          {/* Input Area - Centered */}
          <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm border-t border-border">
            <div className="relative max-w-2xl mx-auto px-4 pb-4">
              <div className="bg-background dark:bg-secondary/10 backdrop-blur-xl rounded-lg sm:rounded-xl shadow-sm border border-border p-2 sm:p-3 relative z-10">
                {/* Subject Selection */}
                <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1">
                  {[
                    { id: 'math', icon: Calculator, label: 'Math', prefix: 'Math Problem:' },
                    { id: 'physics', icon: Atom, label: 'Physics', prefix: 'Physics Problem:' },
                    { id: 'chemistry', icon: Beaker, label: 'Chemistry', prefix: 'Chemistry Problem:' },
                    { id: 'essay', icon: PenTool, label: 'Essay', prefix: 'Essay Help:' },
                    { id: 'general', icon: Book, label: 'General', prefix: 'General Question:' }
                  ].map(({ id, icon: Icon, label, prefix }) => (
                    <Button
                      key={id}
                      variant={activeSubject === id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveSubject(id);
                        if (question.trim()) {
                          setQuestion(`${prefix}\n${question.trim()}`);
                        }
                      }}
                      className={`h-7 px-2 whitespace-nowrap text-xs font-medium transition-all duration-200 ${
                        activeSubject === id 
                          ? 'shadow-sm' 
                          : question.toLowerCase().startsWith(prefix.toLowerCase()) 
                            ? 'bg-primary/10 border-primary' 
                            : ''
                      }`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {label}
                    </Button>
                  ))}
                </div>

                {/* Teacher indicator */}
                {activeSubject && (
                  <div className="px-1.5 pb-1.5 flex items-center gap-1.5">
                    <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {activeSubject === 'math' && 'Math Teacher'}
                      {activeSubject === 'physics' && 'Physics Teacher'}
                      {activeSubject === 'chemistry' && 'Chemistry Teacher'}
                      {activeSubject === 'essay' && 'Writing Teacher'}
                      {activeSubject === 'general' && 'General Teacher'}
                      <span className="text-primary/60">is ready to help</span>
                    </span>
                  </div>
                )}

                <div className="flex items-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 shrink-0 rounded-lg hover:bg-secondary transition-all duration-200"
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
                  
                  <div className="flex-1 relative">
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
                      placeholder="Type your question here, then select a subject above..."
                      className="flex-1 bg-secondary/20 hover:bg-secondary/30 focus:bg-secondary/40 rounded-lg px-3 py-2 outline-none resize-none text-sm min-h-[36px] max-h-[120px] placeholder:text-muted-foreground w-full transition-colors duration-200"
                      disabled={isLoading}
                    />
                    {imagePreview && (
                      <div className="absolute -top-[68px] left-0">
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={clearImagePreview}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background border border-border hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={!question.trim() || isLoading}
                    className="rounded-lg px-3 h-8 text-xs font-medium whitespace-nowrap"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="hidden sm:inline">Processing</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Send className="h-3 w-3" />
                        <span className="hidden sm:inline">Send</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

