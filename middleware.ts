import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Get the token from session storage
  const isAuthenticated = request.cookies.get('authenticated')?.value

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password', '/', '/about', '/contact', '/features']
  
  // Protected paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/settings',
    '/homework',
    '/assignments',
    '/chat',
    '/admin'
  ]

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(protectedPath => 
    path.startsWith(protectedPath)
  )

  // If the user is not authenticated and trying to access a protected route
  if (!isAuthenticated && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If the user is authenticated and trying to access login page
  if (isAuthenticated && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Create the response
  const response = NextResponse.next()

  // Add CSP headers
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.googleusercontent.com;
    frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://accounts.google.com;
    connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com;
    font-src 'self';
  `.replace(/\s+/g, ' ').trim()

  // Set security headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 