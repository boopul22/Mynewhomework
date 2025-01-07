import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeProvider'
import Script from 'next/script'

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-restore" strategy="beforeInteractive">
          {`
            try {
              let theme = localStorage.getItem('theme')
              if (!theme) {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                theme = isDark ? 'dark' : 'light'
              }
              document.documentElement.classList.add(theme)
            } catch (e) {}
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <main className="min-h-screen bg-background">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
