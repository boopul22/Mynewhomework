import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscription | Homework Helper',
  description: 'Manage your Homework Helper subscription and billing',
}

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
} 