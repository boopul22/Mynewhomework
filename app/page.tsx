"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const HomeworkInterface = dynamic(() => import("@/components/homework-interface"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
    </div>
  ),
})

const Calculator = dynamic(() => import("@/components/Calculator"), {
  ssr: false,
})

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col space-y-6 py-6">
      <Calculator />
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-background shadow-sm">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          }
        >
          <HomeworkInterface />
        </Suspense>
      </div>
    </div>
  )
}