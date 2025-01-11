'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Calculator, Book, Microscope, History, Brain, Upload, Image as ImageIcon, Plus, Coins, LogOut, User, X, Loader2, Atom, Beaker, PenTool, BookOpen, GraduationCap, Menu } from 'lucide-react'
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
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/app/firebase/config'
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter } from 'next/navigation'
import { createUserProfile } from '@/lib/user-service'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

const subjects = [
  { id: 'math', name: 'Mathematics', icon: Calculator, promptTemplate: 'math' },
  { id: 'physics', name: 'Physics', icon: Atom, promptTemplate: 'physics' },
  { id: 'chemistry', name: 'Chemistry', icon: Beaker, promptTemplate: 'chemistry' },
  { id: 'writing', name: 'Writing', icon: PenTool, promptTemplate: 'essay' },
  { id: 'literature', name: 'Literature', icon: BookOpen, promptTemplate: 'essay' },
  { id: 'science', name: 'Science', icon: Microscope, promptTemplate: 'general' }
]

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            break;
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
    if (!question.trim() && !imagePreview) return;

    const formData = new FormData();
    formData.append('userId', user ? user.uid : 'anonymous');
    // Add subject to the form data
    const selectedSubject = subjects.find(s => s.id === activeSubject);
    formData.append('subject', selectedSubject?.promptTemplate || 'general');

    // Clear previous state and prepare UI
    setIsLoading(true);
    setIsStreaming(true);
    setAnswer("");
    // Set currentQuestionText for both image and text cases
    setCurrentQuestionText(imagePreview ? "Image Question" : question);
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

      let response;
      let fullResponse = '';

      // If image is present, add it to formData
      if (imagePreview) {
        formData.append('image', imagePreview);
      }
      
      // Add the text prompt if it exists
      if (question.trim()) {
        formData.append('prompt', question);
      }

      // Use the unified Groq endpoint that handles both image and text
      response = await fetch('/api/groq', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();

      // Process the stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        setAnswer(prev => prev + chunk);
        scrollToBottom();
      }

      // Add to chat history after getting full response
      if (currentChatId) {
        await addMessage(currentQuestionText, fullResponse, currentChatId);
      } else {
        const newChatId = createNewChat();
        setCurrentChatId(newChatId);
        await addMessage(currentQuestionText, fullResponse, newChatId);
      }
      
      // Clear image preview after processing
      if (imagePreview) {
        clearImagePreview();
      }
      
    } catch (error: any) {
      setAnswer(`Sorry, I encountered an error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      scrollToBottom();
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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsHistoryOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[100] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
          "w-full max-w-[85%] sm:max-w-[380px] border-r border-border transition-transform duration-300 ease-out",
          "lg:w-[320px] lg:relative lg:translate-x-0 lg:shrink-0",
          isHistoryOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
        )}
      >
        <HistorySlider
          onSelectChat={handleSelectChat}
          startNewChat={startNewChat}
          isOpen={isHistoryOpen}
          setIsOpen={setIsHistoryOpen}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50">
          <div className="flex items-center justify-between p-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu - Now in header */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsHistoryOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                <h1 className="text-lg font-semibold sm:text-xl">Homework Helper</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              {user ? (
                <Button variant="ghost" onClick={handleSignOut} className="hidden sm:flex">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Button variant="default" onClick={handleSignIn} className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
              {/* Mobile-only buttons */}
              {user ? (
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="sm:hidden">
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="default" size="icon" onClick={handleSignIn} className="sm:hidden">
                  <User className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Subject Selection - Scrollable on mobile */}
        <div className="border-b border-border bg-background/95 overflow-x-auto scrollbar-none touch-pan-x">
          <div className="flex gap-1.5 p-2 sm:p-4 sm:gap-2 max-w-3xl mx-auto min-w-max w-full justify-center">
            {subjects.map((subject) => (
              <Button
                key={subject.id}
                variant={activeSubject === subject.id ? "default" : "ghost"}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-8 sm:h-10"
                onClick={() => setActiveSubject(subject.id)}
              >
                <subject.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-sm sm:text-base">{subject.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-muted/30 touch-pan-y">
          <div className="min-h-full flex flex-col max-w-5xl mx-auto p-3 sm:p-6 w-full">
            {/* Question Input Area */}
            <Card className="shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {activeSubject ? (
                        <div className="text-primary">
                          {(() => {
                            const SubjectIcon = subjects.find(s => s.id === activeSubject)?.icon || Brain;
                            return <SubjectIcon className="h-4 w-4" />;
                          })()}
                        </div>
                      ) : (
                        <Brain className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-medium">
                        {activeSubject 
                          ? `${subjects.find(s => s.id === activeSubject)?.name} Question`
                          : 'Ask Your Question'}
                      </h2>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value)
                      e.target.style.height = '36px'
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                    }}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                    placeholder={`Type your ${activeSubject ? subjects.find(s => s.id === activeSubject)?.name.toLowerCase() : 'homework'} question here...`}
                    className="w-full resize-none bg-muted/50 rounded-lg px-3 py-2 text-sm sm:text-base min-h-[80px] max-h-[160px] focus:outline-none focus:ring-1 focus:ring-primary/20"
                    style={{ fontSize: '16px' }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
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
                        disabled={isLoading}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Image
                      </Button>
                    </div>
                    <Button
                      onClick={handleSubmit}
                      disabled={(!question.trim() && !imagePreview) || isLoading}
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Get Answer'
                      )}
                    </Button>
                  </div>
                  {imagePreview && (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-sm border border-border"
                        onClick={clearImagePreview}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Answer Area */}
            <div className="flex-1 mt-3 sm:mt-4">
              <div className="space-y-3 sm:space-y-4">
                {!currentQuestionText && !answer && !imagePreview ? (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Welcome to Homework Helper</h2>
                    <p className="text-muted-foreground max-w-md">
                      Select a subject and ask any question. Our AI tutor will help you understand and learn better.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 pb-4">
                    {currentQuestionText && (
                      <Card className="overflow-hidden border-0 sm:border bg-transparent sm:bg-background">
                        <div className="p-3 sm:p-4 bg-muted/30 sm:bg-muted/50 border-b">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">Your Question</p>
                              <div className="text-sm break-words">{currentQuestionText}</div>
                            </div>
                          </div>
                        </div>
                        {answer && (
                          <div className="p-3 sm:p-4 bg-transparent sm:bg-background">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Brain className="h-3 w-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground mb-1">Answer</p>
                                <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 sm:prose-p:my-2 sm:prose-ul:my-2 sm:prose-li:my-1 [&_.katex-display]:my-4 [&_.katex]:leading-normal [&_.katex-html]:overflow-x-auto [&_.katex-html]:overflow-y-hidden">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      h1: ({ children }) => <h1 className="text-lg sm:text-xl font-bold mt-4 mb-2 sm:mt-6 sm:mb-3">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-base sm:text-lg font-semibold mt-3 mb-1.5 sm:mt-5 sm:mb-2">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-sm sm:text-base font-medium mt-2 mb-1 sm:mt-4 sm:mb-2">{children}</h3>,
                                      p: ({ children }) => {
                                        const processLatexInText = (text: string) => {
                                          // Replace any remaining asterisks with \times before processing
                                          text = text.replace(/\*/g, '\\times')
                                            .replace(/(\d+)\s*x\s*(\d+)/g, '$1\\times$2')
                                            .replace(/(\d+)\s*×\s*(\d+)/g, '$1\\times$2');

                                          // First, check if the text contains LaTeX \text{} commands without delimiters
                                          if (text.includes('\\text{') && !text.includes('$')) {
                                            // Wrap the entire text in display math delimiters
                                            return [<BlockMath key={0} math={text} />];
                                          }
                                          
                                          // Otherwise, process normal inline and block math delimiters
                                          const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
                                          return parts.map((part, index) => {
                                            if (part.startsWith('$$') && part.endsWith('$$')) {
                                              const math = part.slice(2, -2);
                                              return <BlockMath key={index} math={math} />;
                                            } else if (part.startsWith('$') && part.endsWith('$')) {
                                              const math = part.slice(1, -1);
                                              return <InlineMath key={index} math={math} />;
                                            }
                                            return part;
                                          });
                                        };
                                        
                                        if (typeof children === 'string') {
                                          return <p className="text-sm leading-relaxed">{processLatexInText(children)}</p>;
                                        }
                                        return <p className="text-sm leading-relaxed">{children}</p>;
                                      },
                                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5 sm:my-2">{children}</ul>,
                                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                                      code: ({ className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const language = match ? match[1] : '';
                                        
                                        if (language === 'math') {
                                          return <BlockMath math={String(children).trim()} />;
                                        }
                                        
                                        return language ? (
                                          <div className="rounded-lg overflow-hidden my-2 sm:my-3 bg-muted">
                                            <SyntaxHighlighter
                                              style={vscDarkPlus}
                                              language={language}
                                              PreTag="div"
                                              customStyle={{
                                                margin: 0,
                                                padding: '0.75rem',
                                                fontSize: '0.875rem',
                                                borderRadius: '0.5rem',
                                                background: 'transparent'
                                              }}
                                            >
                                              {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                          </div>
                                        ) : (
                                          <code className={cn("bg-muted px-1.5 py-0.5 rounded text-sm", className)} {...props}>
                                            {children}
                                          </code>
                                        );
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
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

