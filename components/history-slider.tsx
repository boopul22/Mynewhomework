'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { MessageSquare, Brain, History, BookOpen, Users, Calendar, FileText, Target, CheckCircle, PenTool, List, LogOut, Clock, Plus, Coins, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { format } from 'date-fns'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import type { CreditSettings, CreditPurchaseOption } from '@/types/index'
import { getCreditSettings, getGuestCredits, useCredits, initializeUserCredits } from '@/lib/credit-service'
import { toast } from '@/components/ui/use-toast'

interface HistoryItem {
  id: string
  title: string
  timestamp: Date
  question: string
  answer: string
  chatId: string
  category?: 'today' | 'yesterday' | 'previous7Days' | 'previous30Days'
}

interface HistorySliderProps {
  onSelectChat: (question: string, answer: string, chatId: string) => void
  startNewChat: () => void
}

export default function HistorySlider({ onSelectChat, startNewChat }: HistorySliderProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [settings, setSettings] = useState<CreditSettings | null>(null)
  const [guestCredits, setGuestCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { messages, isLoading, error } = useChatHistory()
  const { user, userProfile, refreshUserProfile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    const loadCreditInfo = async () => {
      if (!mounted) return
      
      try {
        setLoading(true)
        const creditSettings = await getCreditSettings()
        
        if (!mounted) return
        setSettings(creditSettings)
        
        if (!user) {
          const guestCreditCount = await getGuestCredits()
          if (!mounted) return
          setGuestCredits(guestCreditCount)
        }
      } catch (error) {
        console.error('Error loading credit information:', error)
        if (!mounted) return
        toast({
          title: 'Error',
          description: 'Failed to load credit information',
          variant: 'destructive',
        })
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadCreditInfo()

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    const initializeCreditsIfNeeded = async () => {
      if (!user || !userProfile || userProfile.credits) return

      try {
        await initializeUserCredits(user.uid)
        if (mounted) {
          await refreshUserProfile()
        }
      } catch (error) {
        console.error('Error initializing credits:', error)
        if (mounted) {
          toast({
            title: 'Error',
            description: 'Failed to initialize credits',
            variant: 'destructive',
          })
        }
      }
    }

    initializeCreditsIfNeeded()

    return () => {
      mounted = false
    }
  }, [user, userProfile, refreshUserProfile])

  const handlePurchase = async (option: CreditPurchaseOption) => {
    toast({
      title: 'Coming Soon',
      description: 'Credit purchase functionality will be available soon!',
    })
  }

  const navigationItems = [
    { icon: <MessageSquare className="h-4 w-4" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <BookOpen className="h-4 w-4" />, label: 'Lesson', href: '/lesson' },
    { icon: <Users className="h-4 w-4" />, label: 'Teachers', href: '/teachers' },
    { icon: <Calendar className="h-4 w-4" />, label: 'Timetable', href: '/timetable' },
    { icon: <FileText className="h-4 w-4" />, label: 'Lecture Notes', href: '/notes' },
  ]

  const careerItems = [
    { icon: <CheckCircle className="h-4 w-4" />, label: 'Succeeded' },
    { icon: <PenTool className="h-4 w-4" />, label: 'Working on' },
    { icon: <List className="h-4 w-4" />, label: 'Destination list' },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let category: string
    if (date >= today) {
      category = 'Today'
    } else if (date >= yesterday) {
      category = 'Yesterday'
    } else if (date >= new Date(today.setDate(today.getDate() - 7))) {
      category = 'Previous 7 Days'
    } else {
      category = 'Previous 30 Days'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(msg)
    return acc
  }, {} as Record<string, typeof messages>)

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full w-72 bg-background dark:bg-gradient-to-b dark:from-[#0F0F18] dark:to-[#121220] text-foreground transition-all duration-300 ease-in-out z-50 shadow-lg border-r border-border",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full backdrop-blur-xl">
        {/* Header */}
        <div className="p-7 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">
            {user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest'}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-muted-foreground">
            <div className="h-8 w-8 rounded-full bg-primary/90 flex items-center justify-center shadow-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <BookOpen className="h-4 w-4 text-primary-foreground" />
              )}
            </div>
            <span className="font-medium">Student</span>
          </div>
          <Button
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full mt-6 shadow-sm hover:shadow backdrop-blur-sm"
          >
            <Plus className="h-4 w-4" />
            Ask one more
          </Button>
        </div>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Items */}
          <div className="py-5">
            <div className="space-y-1.5 px-4">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium"
                >
                  <span className="text-primary/90">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Career Goals Section */}
          <div className="py-5 border-t border-border">
            <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Career goals</h2>
            <div className="space-y-1.5 px-4">
              {careerItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium"
                >
                  <span className="text-primary/90">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Credits Section */}
          <div className="py-5 border-t border-border">
            <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Credits</h2>
            <div className="px-4">
              {loading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Available Credits</span>
                      <Badge variant="secondary">
                        {user ? userProfile?.credits?.remaining ?? 0 : guestCredits ?? 0}
                      </Badge>
                    </div>
                    <Progress 
                      value={((user ? userProfile?.credits?.remaining ?? 0 : guestCredits ?? 0) / 
                        (user ? Math.max(userProfile?.credits?.remaining ?? 0, settings?.maxCredits ?? 100) : settings?.guestCredits ?? 5)) * 100} 
                      className="h-2" 
                    />
                  </div>

                  {((user ? userProfile?.credits?.remaining ?? 0 : guestCredits ?? 0) === 0) && (
                    <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">You've run out of credits!</span>
                    </div>
                  )}

                  {!user && (guestCredits ?? 0) <= 2 && (guestCredits ?? 0) > 0 && (
                    <div className="flex items-center space-x-2 text-amber-500 bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Sign up to get {settings?.defaultUserCredits} credits!</span>
                    </div>
                  )}

                  {user && settings?.purchaseOptions && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Purchase More Credits</h4>
                      <div className="grid gap-2">
                        {settings.purchaseOptions.map((option: CreditPurchaseOption) => (
                          <Button
                            key={option.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                            onClick={() => handlePurchase(option)}
                          >
                            <span>{option.description}</span>
                            <span className="font-semibold">${option.price}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!user && (
                    <Button 
                      className="w-full" 
                      variant="default" 
                      size="sm"
                      onClick={() => window.location.href = '/login'}
                    >
                      Sign Up for More Credits
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat History */}
          <div className="py-5 border-t border-border">
            <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Chat History</h2>
            <div className="space-y-1.5 px-4">
              {messages.map((chat, index) => (
                <button
                  key={index}
                  onClick={() => onSelectChat(chat.question, chat.answer, chat.chatId)}
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium"
                >
                  <span className="text-primary/90">
                    <MessageSquare className="h-4 w-4" />
                  </span>
                  <span className="truncate">{chat.question}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-border mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium">
            <LogOut className="h-4 w-4 text-destructive" />
            <span>Logout</span>
          </button>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-12 top-1/2 -translate-y-1/2 bg-primary/90 text-primary-foreground hover:bg-primary rounded-l-none h-12 w-12 shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <History className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 