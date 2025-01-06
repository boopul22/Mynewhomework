'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, Brain, History, BookOpen, Users, Calendar, FileText, Target, CheckCircle, PenTool, List, LogOut, Clock, PlusCircle } from 'lucide-react'
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
}

export default function HistorySlider({ onSelectChat }: HistorySliderProps) {
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

  const handleNewQuestion = () => {
    router.push('/chat')
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
        "fixed left-0 top-0 h-full w-64 bg-white text-gray-700 transition-transform duration-300 ease-in-out z-50 shadow-sm",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold">
            {user ? (user.displayName || user.email?.split('@')[0] || 'User') : 'Guest'}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <BookOpen className="h-3 w-3 text-white" />
              )}
            </div>
            <span>Student</span>
          </div>
        </div>

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Items */}
          <div className="py-4">
            <div className="space-y-1 px-3">
              {/* Ask New Question Button */}
              <button
                onClick={handleNewQuestion}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-2"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Ask New Question</span>
              </button>

              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Career Goals Section */}
          <div className="py-4 border-t">
            <h2 className="px-6 text-sm font-medium text-gray-400 mb-2">Career goals</h2>
            <div className="space-y-1 px-3">
              {careerItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat History Section */}
          <div className="py-4 border-t">
            <h2 className="px-6 text-sm font-medium text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Chat History</span>
              </div>
            </h2>
            <div className="space-y-4 px-3">
              {!user ? (
                <div className="text-center text-sm text-gray-500 px-3">
                  Please sign in to view history
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : error ? (
                <div className="text-center text-sm text-red-500 px-3">
                  {error}
                </div>
              ) : Object.entries(groupedMessages).length > 0 ? (
                Object.entries(groupedMessages).map(([category, msgs]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="text-xs font-medium text-gray-400 px-3">
                      {category}
                    </h3>
                    {msgs.map((msg) => (
                      <button
                        key={msg.id}
                        onClick={() => onSelectChat(msg.question, msg.answer, msg.chatId)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {msg.question}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(msg.timestamp), 'h:mm a')}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 px-3">
                  No chat history yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t mt-auto">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-10 top-1/2 -translate-y-1/2 bg-gray-800 text-white hover:bg-gray-700 rounded-l-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 