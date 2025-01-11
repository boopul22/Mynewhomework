'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { 
  MessageSquare, BookOpen, Users, Calendar, FileText, 
  CheckCircle, PenTool, List, Clock, Plus, LogOut, 
  User, ChevronLeft, ChevronRight, History, Home,
  Settings, HelpCircle, Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import SubscriptionStatus from './subscription-status'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ScrollArea } from './ui/scroll-area'
import { format } from 'date-fns'

interface HistorySliderProps {
  onSelectChat: (question: string, answer: string, chatId: string) => void
  startNewChat: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function HistorySlider({ onSelectChat, startNewChat, isOpen, setIsOpen }: HistorySliderProps) {
  const { messages, isLoading } = useChatHistory()
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'chats' | 'menu'>('chats')

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: BookOpen, label: 'My Lessons', href: '/lessons' },
    { icon: Users, label: 'Teachers', href: '/teachers' },
    { icon: Calendar, label: 'Schedule', href: '/schedule' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', href: '/support' },
  ]

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = new Date(msg.timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let category: string
    if (date.toDateString() === today.toDateString()) {
      category = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      category = 'Yesterday'
    } else if (date >= new Date(today.setDate(today.getDate() - 7))) {
      category = 'This Week'
    } else {
      category = 'Earlier'
    }
    
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(msg)
    return acc
  }, {} as Record<string, typeof messages>)

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-primary/10">
              <AvatarImage 
                src={user?.photoURL || ''} 
                alt={user?.displayName || 'Profile'} 
              />
              <AvatarFallback>
                {user?.displayName?.[0].toUpperCase() || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {user?.displayName || 'Guest User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email || 'Sign in to save progress'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={activeTab === 'chats' ? 'default' : 'ghost'}
            size="sm"
            className="w-full"
            onClick={() => setActiveTab('chats')}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button
            variant={activeTab === 'menu' ? 'default' : 'ghost'}
            size="sm"
            className="w-full"
            onClick={() => setActiveTab('menu')}
          >
            <List className="h-4 w-4 mr-2" />
            Menu
          </Button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-4 sm:px-6 py-3">
        <Button
          onClick={startNewChat}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Main Content Area */}
      <ScrollArea className="flex-1">
        {activeTab === 'chats' ? (
          // Chat History
          <div className="pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-48 bg-muted rounded-lg" />
                  ))}
                </div>
              </div>
            ) : Object.entries(groupedMessages).map(([category, msgs]) => (
              <div key={category} className="py-3">
                <h3 className="px-4 sm:px-6 text-xs font-medium text-muted-foreground mb-2">
                  {category}
                </h3>
                <div className="space-y-0.5">
                  {msgs.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => {
                        onSelectChat(msg.question, msg.answer, msg.chatId)
                        setIsOpen(false) // Close sidebar on mobile after selection
                      }}
                      className="w-full px-4 sm:px-6 py-2 hover:bg-muted/50 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {msg.question.length > 50 
                              ? msg.question.substring(0, 50) + '...' 
                              : msg.question}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(msg.timestamp), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Navigation Menu
          <div className="py-2">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  router.push(item.href)
                  setIsOpen(false) // Close sidebar on mobile after navigation
                }}
                className="w-full px-3 py-2.5 hover:bg-muted/50 text-left transition-colors flex items-center gap-2.5 text-sm"
              >
                <item.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Subscription Status */}
      <div className="mt-auto border-t border-border p-3">
        <SubscriptionStatus />
      </div>
    </div>
  )
} 