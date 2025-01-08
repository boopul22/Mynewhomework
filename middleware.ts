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

  return NextResponse.next()
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