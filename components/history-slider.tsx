'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, Brain, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatHistory } from '@/lib/chat-history'
import { format } from 'date-fns'
import { useAuth } from '@/app/context/AuthContext'

interface HistoryItem {
  id: string
  title: string
  timestamp: Date
  question: string
  answer: string
  category?: 'today' | 'yesterday' | 'previous7Days' | 'previous30Days'
}

interface HistorySliderProps {
  onSelectChat: (question: string, answer: string) => void
}

export default function HistorySlider({ onSelectChat }: HistorySliderProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { messages, isLoading, error } = useChatHistory()
  const { user } = useAuth()

  const historyItems: HistoryItem[] = messages.map(msg => ({
    id: msg.id,
    title: msg.question.slice(0, 50) + (msg.question.length > 50 ? '...' : ''),
    timestamp: msg.timestamp,
    question: msg.question,
    answer: msg.answer
  }))

  const groupedHistory = historyItems.reduce((acc, item) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (item.timestamp >= today) {
      acc.today = acc.today || []
      acc.today.push(item)
    } else if (item.timestamp >= yesterday) {
      acc.yesterday = acc.yesterday || []
      acc.yesterday.push(item)
    } else if (item.timestamp >= new Date(today.setDate(today.getDate() - 7))) {
      acc.previous7Days = acc.previous7Days || []
      acc.previous7Days.push(item)
    } else {
      acc.previous30Days = acc.previous30Days || []
      acc.previous30Days.push(item)
    }
    return acc
  }, {} as Record<string, HistoryItem[]>)

  return (
    <div
      className={cn(
        "fixed left-0 top-0 h-full w-64 bg-gradient-to-br from-[#F8F1F8] via-[#FFF4F9] to-[#F8F1F8] text-[#4D4352] transition-transform duration-300 ease-in-out z-50 border-r border-[#E8E8E8]",
        !isOpen && "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#4D4352] flex items-center justify-center">
              <History className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-sm">Chat History</span>
          </div>
        </div>

        {/* History Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {!user ? (
            <div className="text-center text-sm text-[#6B6B6B] pt-4">
              Please sign in to view chat history
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              <div className="h-5 w-5 border-2 border-[#4D4352] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#6B6B6B] text-center px-4">
                {error || 'Loading chat history...'}
              </p>
            </div>
          ) : error && !isLoading ? (
            <div className="text-center text-sm text-red-500 pt-4 px-4">
              {error}
            </div>
          ) : Object.entries(groupedHistory).length > 0 ? (
            Object.entries(groupedHistory).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-sm font-medium px-2 text-[#6B6B6B] capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectChat(item.question, item.answer)}
                    className="w-full text-left px-2 py-2 rounded hover:bg-[#F8F1F8]/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-[#6B6B6B]">
                        {format(item.timestamp, 'h:mm a')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-[#6B6B6B] pt-4">
              No chat history yet
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-10 top-4 bg-[#4D4352] text-white hover:bg-[#4D4352]/90 rounded-l-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <History className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 