import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Just check if token exists - actual verification happens in the page
    // This avoids Edge runtime issues with jsonwebtoken
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Profile page handles its own auth check client-side
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

