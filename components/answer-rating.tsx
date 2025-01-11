'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { submitFeedback } from '@/lib/feedback-service'
import { useAuth } from '@/app/context/AuthContext'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface AnswerRatingProps {
  questionId: string
  question: string
  answer: string
}

export function AnswerRating({ questionId, question, answer }: AnswerRatingProps) {
  const [selectedRating, setSelectedRating] = useState<'helpful' | 'not-helpful' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleRating = async (rating: 'helpful' | 'not-helpful') => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      console.log('Submitting feedback:', {
        rating,
        questionId,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous'
      })

      // Set the rating immediately for better UX
      setSelectedRating(rating)

      const feedbackData = {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        rating,
        comment: `Selected options: ${rating === 'helpful' ? 'Accurate' : 'Inaccurate'}\n\nQuestion: ${question}\n\nAnswer: ${answer}`,
        questionId,
        question,
        answer,
      }

      const result = await submitFeedback(feedbackData)
      console.log('Feedback submitted successfully:', result)

      toast({
        title: "Thanks for your feedback!",
        description: "Your rating helps us improve our answers.",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.'
      toast({
        title: "Couldn't submit rating",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
      // Reset rating if submission failed
      setSelectedRating(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-4">
      <p className="text-sm text-muted-foreground mr-2">Is Final result correct?</p>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2",
          selectedRating === 'helpful' && "border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-500"
        )}
        onClick={() => handleRating('helpful')}
        disabled={isSubmitting || selectedRating !== null}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="sr-only">Yes, correct</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "gap-2",
          selectedRating === 'not-helpful' && "border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500"
        )}
        onClick={() => handleRating('not-helpful')}
        disabled={isSubmitting || selectedRating !== null}
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="sr-only">No, incorrect</span>
      </Button>
    </div>
  )
} 