'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setShowUserMenu(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-xl sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 space-x-reverse text-2xl font-bold hover:text-blue-200 transition-colors"
          >
            <span className="text-3xl">🐾</span>
            <span>فروشگاه حیوانات خانگی</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-white text-blue-700 font-semibold' 
                  : 'hover:bg-blue-600 hover:text-white'
              }`}
            >
              خانه
            </Link>
            <Link 
              href="/blog" 
              className={`px-3 py-2 rounded-lg transition-all ${
                isActive('/blog') 
                  ? 'bg-white text-blue-700 font-semibold' 
                  : 'hover:bg-blue-600 hover:text-white'
              }`}
            >
              وبلاگ
            </Link>
            <Link 
              href="/shop" 
              className={`px-3 py-2 rounded-lg transition-all ${
                isActive('/shop') 
                  ? 'bg-white text-blue-700 font-semibold' 
                  : 'hover:bg-blue-600 hover:text-white'
              }`}
            >
              فروشگاه
            </Link>
            <Link 
              href="/doctors" 
              className={`px-3 py-2 rounded-lg transition-all ${
                isActive('/doctors') 
                  ? 'bg-white text-blue-700 font-semibold' 
                  : 'hover:bg-blue-600 hover:text-white'
              }`}
            >
              پزشکان
            </Link>

            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md"
                    >
                      <span className="text-lg">👤</span>
                      <span>{user.name}</span>
                      <span className="text-xs">▼</span>
                    </button>

                    {showUserMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowUserMenu(false)}
                        />
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-2xl py-2 z-20 border border-gray-200">
                          <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                            {user.role === 'admin' && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                                مدیر
                              </span>
                            )}
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setShowUserMenu(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                          >
                            <span className="ml-2">👤</span>
                            پروفایل من
                          </Link>
                          {user.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                              <span className="ml-2">⚙️</span>
                              پنل مدیریت
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link
                              href="/admin/doctors"
                              onClick={() => setShowUserMenu(false)}
                              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                              <span className="ml-2">🩺</span>
                              مدیریت پزشکان
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link
                              href="/admin/products"
                              onClick={() => setShowUserMenu(false)}
                              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                              <span className="ml-2">🛒</span>
                              مدیریت محصولات
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link
                              href="/admin/slider"
                              onClick={() => setShowUserMenu(false)}
                              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                              <span className="ml-2">🎞️</span>
                              مدیریت اسلایدر
                            </Link>
                          )}
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={handleLogout}
                            className="w-full text-right px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <span className="ml-2">🚪</span>
                            خروج
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <Link 
                      href="/login" 
                      className="px-4 py-2 rounded-lg hover:bg-blue-600 transition-all border border-blue-400"
                    >
                      ورود
                    </Link>
                    <Link 
                      href="/signup" 
                      className="px-4 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md"
                    >
                      ثبت نام
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-blue-600">
            <div className="flex flex-col gap-2">
              <Link 
                href="/" 
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/') 
                    ? 'bg-white text-blue-700 font-semibold' 
                    : 'hover:bg-blue-600'
                }`}
              >
                خانه
              </Link>
              <Link 
                href="/blog" 
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/blog') 
                    ? 'bg-white text-blue-700 font-semibold' 
                    : 'hover:bg-blue-600'
                }`}
              >
                وبلاگ
              </Link>
              <Link 
                href="/shop" 
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/shop') 
                    ? 'bg-white text-blue-700 font-semibold' 
                    : 'hover:bg-blue-600'
                }`}
              >
                فروشگاه
              </Link>
              <Link 
                href="/doctors" 
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isActive('/doctors') 
                    ? 'bg-white text-blue-700 font-semibold' 
                    : 'hover:bg-blue-600'
                }`}
              >
                پزشکان
              </Link>

              {!loading && (
                <>
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-t border-blue-600 mt-2 pt-2">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-blue-200">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowMobileMenu(false)}
                        className="px-4 py-2 rounded-lg hover:bg-blue-600"
                      >
                        پروفایل من
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setShowMobileMenu(false)}
                          className="px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          پنل مدیریت
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          href="/admin/doctors"
                          onClick={() => setShowMobileMenu(false)}
                          className="px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          مدیریت پزشکان
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          href="/admin/products"
                          onClick={() => setShowMobileMenu(false)}
                          className="px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          مدیریت محصولات
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          href="/admin/slider"
                          onClick={() => setShowMobileMenu(false)}
                          className="px-4 py-2 rounded-lg hover:bg-blue-600"
                        >
                          مدیریت اسلایدر
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          handleLogout()
                          setShowMobileMenu(false)
                        }}
                        className="px-4 py-2 rounded-lg hover:bg-red-600 text-right"
                      >
                        خروج
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/login" 
                        onClick={() => setShowMobileMenu(false)}
                        className="px-4 py-2 rounded-lg hover:bg-blue-600 border border-blue-400"
                      >
                        ورود
                      </Link>
                      <Link 
                        href="/signup" 
                        onClick={() => setShowMobileMenu(false)}
                        className="px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50"
                      >
                        ثبت نام
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
