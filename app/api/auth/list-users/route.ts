import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/users'

// Debug endpoint to list all users (remove in production or add admin auth)
export async function GET() {
  try {
    const allUsers = getAllUsers()
    return NextResponse.json({
      count: allUsers.length,
      users: allUsers,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error accessing users' }, { status: 500 })
  }
}

