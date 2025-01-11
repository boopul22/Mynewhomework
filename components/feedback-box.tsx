'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from 'react'
import { MessageSquare, ThumbsUp, ThumbsDown, X, Check, Star } from 'lucide-react'
import { submitFeedback } from '@/lib/feedback-service'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const FEEDBACK_PRESETS = {
  accuracy: [
    { id: 'accurate', label: 'Accurate', subtext: 'The answer was correct', icon: Check, color: 'text-green-500' },
    { id: 'partially-accurate', label: 'Partially Accurate', subtext: 'Some parts were correct', icon: Star, color: 'text-yellow-500' },
    { id: 'inaccurate', label: 'Inaccurate', subtext: 'The answer was incorrect', icon: ThumbsDown, color: 'text-red-500' },
  ],
  specific: [
    { id: 'clear-explanation', label: 'Clear explanation', icon: MessageSquare },
    { id: 'step-by-step', label: 'Good step-by-step', icon: Check },
    { id: 'confusing', label: 'Confusing explanation', icon: ThumbsDown },
    { id: 'missing-steps', label: 'Missing steps', icon: Star },
    { id: 'wrong-approach', label: 'Wrong approach', icon: ThumbsDown },
    { id: 'formatting', label: 'Format issues', icon: MessageSquare },
  ]
}

export function FeedbackBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<string>('')
  const [comment, setComment] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const { user } = useAuth()

  // Show hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('feedbackHintSeen')
    if (!hasSeenHint) {
      setShowHint(true)
      setTimeout(() => {
        setShowHint(false)
        localStorage.setItem('feedbackHintSeen', 'true')
      }, 5000)
    }
  }, [])

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating && selectedPresets.length === 0) return

    setIsSubmitting(true)
    try {
      // Separate preset feedback and custom comment
      const presetFeedback = selectedPresets
        .map(id => {
          // Find the preset label from both accuracy and specific feedback
          const accuracyPreset = FEEDBACK_PRESETS.accuracy.find(p => p.id === id)
          const specificPreset = FEEDBACK_PRESETS.specific.find(p => p.id === id)
          return (accuracyPreset || specificPreset)?.label
        })
        .filter(Boolean)
        .join(", ")

      // Combine preset feedback and custom comment
      const feedbackText = [
        presetFeedback && `Selected options: ${presetFeedback}`,
        comment.trim() && `Additional comments: ${comment.trim()}`
      ].filter(Boolean).join("\n\n")

      await submitFeedback({
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        rating: selectedPresets.includes('accurate') ? 'helpful' : 
               selectedPresets.includes('inaccurate') ? 'not-helpful' : rating,
        comment: feedbackText || "No additional comments"
      })
      
      setIsSubmitted(true)
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the app for everyone.",
        duration: 3000,
      })

      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false)
        setRating('')
        setComment('')
        setSelectedPresets([])
        setIsOpen(false)
      }, 3000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.'
      toast({
        title: "Couldn't submit feedback",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
      setIsSubmitted(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 flex flex-col items-end z-50">
        {showHint && (
          <div className="bg-primary text-primary-foreground rounded-lg p-3 mb-2 text-sm animate-fade-in shadow-lg max-w-[200px]">
            Help us improve! Tap here to share your thoughts
            <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-primary rotate-45" />
          </div>
        )}
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 gap-2 w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
        >
          <MessageSquare className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="sm:hidden">Share Feedback</span>
          <span className="hidden sm:inline">Give Feedback</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <Card className="w-full sm:max-w-md relative overflow-hidden h-[100dvh] sm:h-auto rounded-none sm:rounded-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-10 w-10 sm:h-8 sm:w-8"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5 sm:h-4 sm:w-4" />
        </Button>

        <div className="h-full flex flex-col p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 sm:h-4 sm:w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">Share Your Feedback</h3>
              <p className="text-sm text-muted-foreground truncate">Help us improve your experience</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 sm:gap-6">
            {/* Accuracy Feedback */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">How accurate was the answer?</label>
              <div className="grid grid-cols-1 gap-2">
                {FEEDBACK_PRESETS.accuracy.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto py-2.5 px-3 flex items-center gap-3 justify-start w-full",
                      selectedPresets.includes(preset.id) && "border-primary bg-primary/5",
                      "hover:border-primary hover:bg-primary/5"
                    )}
                    onClick={() => {
                      setSelectedPresets(prev => 
                        [...prev.filter(id => !FEEDBACK_PRESETS.accuracy.find(p => p.id === id)), preset.id]
                      )
                    }}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full bg-background flex items-center justify-center shrink-0", 
                      selectedPresets.includes(preset.id) ? "bg-primary/10" : "bg-muted"
                    )}>
                      <preset.icon className={cn("h-4 w-4", preset.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{preset.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{preset.subtext}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Specific Feedback */}
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium block">What specific feedback do you have?</label>
                <p className="text-xs text-muted-foreground">Select all that apply</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_PRESETS.specific.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-auto min-h-[2.5rem] py-1.5 px-2 justify-start gap-2 w-full",
                      selectedPresets.includes(preset.id) && "border-primary bg-primary/5",
                      "hover:border-primary hover:bg-primary/5"
                    )}
                    onClick={() => togglePreset(preset.id)}
                  >
                    <preset.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{preset.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Additional Comments */}
            <div className="space-y-2">
              <div className="flex justify-between items-center gap-2">
                <label className="text-sm font-medium">Additional comments</label>
                <span className="text-xs text-muted-foreground shrink-0">Optional</span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any other thoughts or suggestions..."
                className="resize-none h-20 bg-muted/50 w-full text-sm"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-sm mt-auto"
              disabled={selectedPresets.length === 0 || isSubmitted || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  <span className="truncate">Submitting...</span>
                </span>
              ) : isSubmitted ? (
                <span className="flex items-center gap-2 justify-center">
                  <Check className="h-4 w-4 shrink-0" />
                  <span className="truncate">Thanks for your feedback!</span>
                </span>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
} 