import { NextResponse } from 'next/server'
import { getUserByEmail } from '@/lib/users'

// This is a debug endpoint - remove in production or add authentication
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (email) {
    const user = await getUserByEmail(email)
    if (user) {
      return NextResponse.json({
        found: true,
        email: user.email,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
      })
    } else {
      return NextResponse.json({
        found: false,
        message: 'User not found',
      })
    }
  }

  return NextResponse.json({
    message: 'Provide email query parameter',
    example: '/api/auth/debug?email=user@example.com',
  })
}

