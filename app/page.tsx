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
    <main className="flex min-h-screen flex-col">
      <WelcomePopup />
      <Suspense fallback={null}>
        <Calculator />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <Suspense
          fallback={
            <div className="animate-pulse h-full bg-muted" />
          }
        >
          <HomeworkInterface />
        </Suspense>
      </div>
    </main>
  )
}