"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { WelcomePopup } from '@/components/welcome-popup'

// Preload the main interface
const HomeworkInterface = dynamic(() => import("@/components/homework-interface"), {
  ssr: false,
  // Add priority loading for main interface
  loading: () => <div className="animate-pulse h-screen bg-muted" />,
})

// Lazy load calculator as it's not immediately needed
const Calculator = dynamic(() => import("@/components/Calculator"), {
  ssr: false,
  loading: () => null,
})

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col space-y-6 py-6">
      <WelcomePopup />
      <Suspense fallback={null}>
        <Calculator />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
        <Suspense
          fallback={
            <div className="animate-pulse h-full bg-muted" />
          }
        >
          <HomeworkInterface />
        </Suspense>
      </div>
    </div>
  )
}