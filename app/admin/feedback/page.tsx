'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { getAllFeedback, type Feedback } from '@/lib/feedback-service'
import { ThumbsUp, ThumbsDown, MessageSquare, Star, AlertCircle, HelpCircle, BarChart3, ListFilter, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FeedbackStats {
  total: number
  helpful: number
  notHelpful: number
  withComments: number
  accuracyBreakdown: {
    accurate: number
    partiallyAccurate: number
    inaccurate: number
  }
  specificFeedback: {
    [key: string]: number
  }
  questionFeedback: {
    [questionId: string]: {
      question: string
      helpful: number
      notHelpful: number
      total: number
    }
  }
}

type TabType = 'overview' | 'questions' | 'recent'

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<FeedbackStats>({
    total: 0,
    helpful: 0,
    notHelpful: 0,
    withComments: 0,
    accuracyBreakdown: {
      accurate: 0,
      partiallyAccurate: 0,
      inaccurate: 0
    },
    specificFeedback: {},
    questionFeedback: {}
  })

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const feedbackData = await getAllFeedback()
        setFeedback(feedbackData)
        
        // Calculate stats
        const newStats: FeedbackStats = {
          total: feedbackData.length,
          helpful: feedbackData.filter(f => f.rating === 'helpful').length,
          notHelpful: feedbackData.filter(f => f.rating === 'not-helpful').length,
          withComments: feedbackData.filter(f => f.comment?.includes('Additional comments:')).length,
          accuracyBreakdown: {
            accurate: 0,
            partiallyAccurate: 0,
            inaccurate: 0
          },
          specificFeedback: {},
          questionFeedback: {}
        }

        // Process feedback details
        feedbackData.forEach(f => {
          // Process question feedback
          if (f.questionId && f.question) {
            if (!newStats.questionFeedback[f.questionId]) {
              newStats.questionFeedback[f.questionId] = {
                question: f.question,
                helpful: 0,
                notHelpful: 0,
                total: 0
              }
            }
            newStats.questionFeedback[f.questionId].total++
            if (f.rating === 'helpful') {
              newStats.questionFeedback[f.questionId].helpful++
            } else {
              newStats.questionFeedback[f.questionId].notHelpful++
            }
          }

          if (f.comment?.includes('Selected options:')) {
            const options = f.comment
              .split('\n\n')[0]
              .replace('Selected options:', '')
              .split(',')
              .map(o => o.trim())

            options.forEach(option => {
              // Count accuracy feedback
              if (option === 'Accurate') newStats.accuracyBreakdown.accurate++
              if (option === 'Partially Accurate') newStats.accuracyBreakdown.partiallyAccurate++
              if (option === 'Inaccurate') newStats.accuracyBreakdown.inaccurate++

              // Count specific feedback
              if (!['Accurate', 'Partially Accurate', 'Inaccurate'].includes(option)) {
                newStats.specificFeedback[option] = (newStats.specificFeedback[option] || 0) + 1
              }
            })
          }
        })

        setStats(newStats)
      } catch (error) {
        console.error('Error loading feedback:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeedback()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary border-r-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const TabButton = ({ tab, icon: Icon, label }: { tab: TabType; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        activeTab === tab
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Feedback Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and analyze user feedback to improve the app experience.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-muted/50 rounded-lg w-fit">
        <TabButton tab="overview" icon={BarChart3} label="Overview" />
        <TabButton tab="questions" icon={ListFilter} label="Questions" />
        <TabButton tab="recent" icon={Clock} label="Recent" />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Total Feedback</h3>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4 border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                <h3 className="font-medium">Helpful</h3>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.helpful}</p>
                <span className="text-sm text-muted-foreground">
                  ({Math.round((stats.helpful / stats.total) * 100)}%)
                </span>
              </div>
            </Card>
            <Card className="p-4 border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="h-4 w-4 text-red-500" />
                <h3 className="font-medium">Not Helpful</h3>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.notHelpful}</p>
                <span className="text-sm text-muted-foreground">
                  ({Math.round((stats.notHelpful / stats.total) * 100)}%)
                </span>
              </div>
            </Card>
            <Card className="p-4 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-medium">With Comments</h3>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats.withComments}</p>
                <span className="text-sm text-muted-foreground">
                  ({Math.round((stats.withComments / stats.total) * 100)}%)
                </span>
              </div>
            </Card>
          </div>

          {/* Accuracy Breakdown */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Accuracy Breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <h3 className="font-medium">Accurate</h3>
                </div>
                <p className="text-2xl font-bold">{stats.accuracyBreakdown.accurate}</p>
              </Card>
              <Card className="p-4 border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h3 className="font-medium">Partially Accurate</h3>
                </div>
                <p className="text-2xl font-bold">{stats.accuracyBreakdown.partiallyAccurate}</p>
              </Card>
              <Card className="p-4 border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <h3 className="font-medium">Inaccurate</h3>
                </div>
                <p className="text-2xl font-bold">{stats.accuracyBreakdown.inaccurate}</p>
              </Card>
            </div>
          </div>

          {/* Specific Feedback Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Feedback Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.specificFeedback).map(([category, count]) => (
                <Card key={category} className="p-4 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">{category}</h3>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Question-specific Feedback</h2>
          {Object.entries(stats.questionFeedback).map(([questionId, data]) => (
            <Card key={questionId} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm mb-2">{data.question}</h3>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm">
                          {data.helpful} ({Math.round((data.helpful / data.total) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span className="text-sm">
                          {data.notHelpful} ({Math.round((data.notHelpful / data.total) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="text-sm">
                          {data.total} total ratings
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {Object.keys(stats.questionFeedback).length === 0 && (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No question-specific feedback yet.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
          {feedback.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {item.rating === 'helpful' ? (
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <ThumbsDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {item.rating === 'helpful' ? 'Helpful' : 'Not Helpful'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {item.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(item.createdAt.toDate(), 'PPp')}
                    </p>
                  </div>
                </div>
                
                {item.question && (
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{item.question}</p>
                  </div>
                )}
                
                {item.comment && (
                  <div className="space-y-2">
                    {item.comment.split('\n\n').map((section, index) => (
                      <div key={index} className="text-sm">
                        {section.startsWith('Selected options:') ? (
                          <div className="flex items-start gap-2">
                            <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p>{section.replace('Selected options:', '').trim()}</p>
                          </div>
                        ) : section.startsWith('Additional comments:') ? (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p>{section.replace('Additional comments:', '').trim()}</p>
                          </div>
                        ) : section.startsWith('Question:') ? null : section.startsWith('Answer:') ? null : (
                          <p className="text-muted-foreground">{section}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {feedback.length === 0 && (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No feedback received yet.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 