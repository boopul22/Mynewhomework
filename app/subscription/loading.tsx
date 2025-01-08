import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function SubscriptionLoading() {
  return (
    <div className="min-h-screen bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/95">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              disabled
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-6 w-80 mt-2" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-16">
          {/* Subscription Plans */}
          <div>
            <div className="text-center space-y-4 mb-8">
              <Skeleton className="h-8 w-48 mx-auto" />
              <Skeleton className="h-5 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="relative overflow-hidden">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-5 w-48" />
                      <div className="space-y-2">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="space-y-3">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="flex items-center gap-3">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 flex-1" />
                          </div>
                        ))}
                      </div>
                      <Skeleton className="h-10 w-full mt-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="py-12 border-y border-border/50">
            <Skeleton className="h-10 w-72 mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-secondary/50 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <Skeleton className="h-10 w-72 mx-auto mb-12" />
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-6 rounded-xl bg-secondary/20">
                  <Skeleton className="h-6 w-48 mb-3" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl" />
            <div className="relative p-12 text-center">
              <Skeleton className="h-10 w-48 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto mb-8" />
              <div className="flex gap-4 justify-center">
                <Skeleton className="h-11 w-32" />
                <Skeleton className="h-11 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 