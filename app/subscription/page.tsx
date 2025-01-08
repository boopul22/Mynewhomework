'use client'

import { useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import SubscriptionDisplay from '@/components/subscription-display'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Zap, Shield, Clock, Gift, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "24/7 AI Support",
    description: "Get instant help with your homework anytime, anywhere"
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Advanced AI Model",
    description: "Access to our most powerful AI for complex problems"
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Guaranteed Quality",
    description: "100% satisfaction guarantee with our premium plans"
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Flexible Usage",
    description: "Daily question limits that fit your study schedule"
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: "Special Features",
    description: "Essay assistance and advanced subject support"
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Priority Support",
    description: "Get help from subject matter experts when needed"
  }
]

const faqs = [
  {
    question: "What happens after my trial ends?",
    answer: "After your trial ends, you'll be automatically switched to the free plan unless you choose to upgrade. Your data and history will be preserved."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately."
  },
  {
    question: "How do the daily questions work?",
    answer: "Your question limit resets every 24 hours at midnight in your local timezone. Unused questions don't roll over."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and popular digital wallets for secure payments."
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with our premium features."
  },
  {
    question: "What's included in Premium support?",
    answer: "Premium support includes priority response times, advanced AI models, and expert human review when needed."
  }
]

export default function SubscriptionPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/95">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-secondary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                Choose Your Plan
              </h1>
              <p className="text-muted-foreground text-lg">
                Get the help you need with our flexible plans
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-16">
          {/* Subscription Plans */}
          <div>
            <SubscriptionDisplay />
          </div>

          {/* Features Grid */}
          <div className="py-12 border-y border-border/50">
            <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Excel</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <Card key={i} className="bg-secondary/50 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {faqs.map((faq, i) => (
                <div key={i} className={cn(
                  "p-6 rounded-xl transition-all duration-200",
                  "hover:bg-secondary/50"
                )}>
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl" />
            <div className="relative p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Our support team is here to help you get the most out of your subscription.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="default" size="lg" onClick={() => window.location.href = 'mailto:support@example.com'}>
                  Contact Support
                </Button>
                <Button variant="outline" size="lg" onClick={() => router.push('/faq')}>
                  View Help Center
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 