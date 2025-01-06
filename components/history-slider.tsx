'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { MessageSquare, Brain, History } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HistoryItem {
  id: string
  title: string
  timestamp: Date
  category?: 'today' | 'yesterday' | 'previous7Days' | 'previous30Days'
}

export default function HistorySlider() {
  const [isOpen, setIsOpen] = useState(true)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])

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
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#4D4352] flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-sm">ChatGPT</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#4D4352] flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-sm">Prompt Engineer</span>
          </div>
        </div>

        {/* History Sections */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {Object.entries(groupedHistory).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-medium px-2 text-[#6B6B6B] capitalize">
                {category.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              {items.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-2 py-2 rounded hover:bg-[#F8F1F8]/50 transition-colors text-sm"
                >
                  {item.title}
                </button>
              ))}
            </div>
          ))}
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