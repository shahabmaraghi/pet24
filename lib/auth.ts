// Authentication utilities
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { User } from './users'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export function createToken(user: User): string {
  const payload: SessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  return await verifyToken(token);
}

export async function setSession(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // Ensure cookie is available for all paths
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  console.log('Cookie set with path: /')
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}

