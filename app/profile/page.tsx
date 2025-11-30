'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async () => {
    try {
      console.log('Profile page: Starting auth check...')
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      if (!response.ok) {
        console.error('Profile page: Session API error:', response.status)
        router.push('/login')
        return
      }

      const data = await response.json()
      console.log('Profile page: Session data received:', data)

      if (data.user) {
        console.log('Profile page: User found, setting user data')
        setUser(data.user)
      } else {
        console.log('Profile page: No user in session, redirecting to login')
        router.push('/login')
      }
    } catch (error) {
      console.error('Profile page: Auth check error:', error)
      // Don't redirect on network errors, just show error
      setError('خطا در بررسی احراز هویت')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p>در حال بارگذاری...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p>در حال هدایت به صفحه ورود...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">پروفایل کاربری</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            خروج
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">اطلاعات شخصی</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">نام</label>
                <p className="mt-1 text-lg">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ایمیل</label>
                <p className="mt-1 text-lg">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">نوع حساب</label>
                <p className="mt-1 text-lg">
                  {user.role === 'admin' ? 'مدیر' : 'کاربر عادی'}
                </p>
              </div>
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">دسترسی‌های مدیریتی</h2>
              <Link
                href="/admin"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                ورود به پنل مدیریت
              </Link>
            </div>
          )}

          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">عملیات</h2>
            <div className="flex gap-4">
              <Link
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                بازگشت به صفحه اصلی
              </Link>
              <Link
                href="/blog"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                مشاهده وبلاگ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

