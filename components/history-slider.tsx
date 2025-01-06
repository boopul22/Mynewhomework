'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, Brain, History, BookOpen, Users, Calendar, FileText, Target, CheckCircle, PenTool, List, LogOut, Clock, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { format } from 'date-fns'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'

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
        "fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-[#F8F1F8] via-[#FFF4F9] to-[#F8F1F8] text-[#4D4352] transition-transform duration-300 ease-in-out z-50 shadow-lg",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-7 border-b border-[#4D4352]/10">
          <h1 className="text-2xl font-bold text-[#4D4352]">
            {user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest'}
          </h1>
          <div className="flex items-center gap-3 mt-3 text-[#6B6B6B]">
            <div className="h-8 w-8 rounded-full bg-[#E8927C] flex items-center justify-center shadow-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <BookOpen className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="font-medium">Student</span>
          </div>
          <Button
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 bg-[#4D4352]/5 hover:bg-[#4D4352]/10 text-[#4D4352] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 w-full mt-6 shadow-sm hover:shadow"
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
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-[#4D4352]/5 transition-colors font-medium"
                >
                  <span className="text-[#E8927C]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Career Goals Section */}
          <div className="py-5 border-t border-[#4D4352]/10">
            <h2 className="px-7 text-[15px] font-semibold text-[#4D4352] mb-3">Career goals</h2>
            <div className="space-y-1.5 px-4">
              {careerItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-4 px-4 py-2.5 text-[15px] rounded-xl hover:bg-[#4D4352]/5 transition-colors font-medium"
                >
                  <span className="text-[#E8927C]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History Section */}
          <div className="py-5 border-t border-[#4D4352]/10">
            <h2 className="px-7 text-[15px] font-semibold text-[#4D4352] mb-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-[#E8927C]" />
                <span>Chat History</span>
              </div>
            </h2>
            <div className="space-y-5 px-4">
              {!user ? (
                <div className="text-center text-[15px] text-[#6B6B6B] px-4 py-3 bg-[#4D4352]/5 rounded-xl">
                  Please sign in to view history
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 border-2 border-[#E8927C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center text-[15px] text-red-500 px-4 py-3 bg-red-50 rounded-xl">
                  {error}
                </div>
              ) : Object.entries(groupedMessages).length > 0 ? (
                Object.entries(groupedMessages).map(([category, msgs]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-[13px] font-semibold text-[#4D4352]/70 px-4">
                      {category}
                    </h3>
                    {msgs.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => onSelectChat(msg.question, msg.answer, msg.chatId)}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#4D4352]/5 transition-colors"
                      >
                        <div className="space-y-2">
                          <p className="text-[15px] font-medium line-clamp-2 leading-snug">
                            {msg.question}
                          </p>
                          <p className="text-[13px] text-[#6B6B6B]">
                            {format(new Date(msg.timestamp), 'h:mm a')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center text-[15px] text-[#6B6B6B] px-4 py-3 bg-[#4D4352]/5 rounded-xl">
                  No chat history yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#4D4352]/10 mt-auto">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[15px] rounded-xl hover:bg-[#4D4352]/5 transition-colors font-medium">
            <LogOut className="h-4 w-4 text-[#E8927C]" />
            <span>Logout</span>
          </button>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-12 top-1/2 -translate-y-1/2 bg-[#E8927C] text-white hover:bg-[#E88070] rounded-l-none h-12 w-12 shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <History className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
} 