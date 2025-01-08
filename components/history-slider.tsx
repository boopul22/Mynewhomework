'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, BookOpen, Users, Calendar, FileText, CheckCircle, PenTool, List, Clock, Plus, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import SubscriptionStatus from './subscription-status'
import { signOut } from 'firebase/auth'
import { auth } from '@/app/firebase/config'

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
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function HistorySlider({ onSelectChat, startNewChat, isOpen, setIsOpen }: HistorySliderProps) {
  const { messages, isLoading, error } = useChatHistory()
  const { user } = useAuth()
  const router = useRouter()

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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSignIn = () => {
    router.push('/login')
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
    <>
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-[300px] sm:w-[350px] bg-background/95 backdrop-blur-sm border-r border-border z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Toggle Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-8 w-8 bg-background border border-border shadow-sm rounded-full"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="sr-only">{isOpen ? 'Close' : 'Open'} sidebar</span>
        </Button>

        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                  <User className="h-4 w-4 mr-2" />
                  Sign in
                </Button>
              )}
            </div>
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
            {user && (
              <Button
                onClick={startNewChat}
                className="flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary text-secondary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full mt-3 shadow-sm hover:shadow backdrop-blur-sm"
              >
                <Plus className="h-4 w-4" />
                Ask one more
              </Button>
            )}
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

            {/* Subscription Status */}
            <div className="py-5 border-t border-border">
              <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">Subscription</h2>
              <div className="px-4">
                <SubscriptionStatus />
              </div>
            </div>

            {/* Chat History Section */}
            {Object.entries(groupedMessages).map(([category, msgs]) => (
              <div key={category} className="py-5 border-t border-border">
                <h2 className="px-7 text-[15px] font-semibold text-foreground mb-3">{category}</h2>
                <div className="space-y-1.5 px-4">
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => onSelectChat(msg.question, msg.answer, msg.chatId)}
                      className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-secondary/50 transition-colors font-medium text-left"
                    >
                      <span className="text-primary/90">
                        <Clock className="h-4 w-4" />
                      </span>
                      <span className="truncate">{msg.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
} 