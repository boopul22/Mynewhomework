import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeProvider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Student Dashboard',
    template: '%s | Student Dashboard'
  },
  description: 'A modern student dashboard for tracking progress and assignments',
  metadataBase: new URL('https://your-domain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Student Dashboard',
    description: 'A modern student dashboard for tracking progress and assignments',
    type: 'website',
    locale: 'en_US',
    siteName: 'Student Dashboard',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Student Dashboard - Track Your Academic Progress'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Dashboard',
    description: 'A modern student dashboard for tracking progress and assignments',
    creator: '@yourusername',
    images: ['/og-image.jpg']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code'
  },
  category: 'education'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
