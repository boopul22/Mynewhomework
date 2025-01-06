import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Student Dashboard',
  description: 'A modern student dashboard for tracking progress and assignments',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
