import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for the admin page
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isAuthenticated = request.cookies.get('admin_authenticated')?.value === 'true'
    
    // Allow access to login page and auth API endpoint
    if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/api/admin/auth') {
      return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 