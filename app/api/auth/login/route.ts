import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, getUserByEmail } from '@/lib/users'
import { createToken, setSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      )
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim()

    console.log('Login attempt:', { email: normalizedEmail, passwordLength: password.length })
    
    const user = await verifyPassword(normalizedEmail, password)
    if (!user) {
      const userExists = await getUserByEmail(normalizedEmail)
      console.error('Login failed:', { 
        email: normalizedEmail, 
        userExists: !!userExists
      })
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      )
    }

    console.log('Login successful for user:', user.email)

    const token = createToken(user)
    
    // Create response first
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    // Set cookie in the response
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log('Session token created and cookie set for user:', user.email)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'خطا در ورود به سیستم' },
      { status: 500 }
    )
  }
}

