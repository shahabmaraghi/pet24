'use client'

import Image, { ImageLoader } from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [previewError, setPreviewError] = useState(false)
  const passthroughLoader: ImageLoader = ({ src }) => src

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.user && data.user.role === 'admin') {
        setUser(data.user)
      } else {
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/admin/login')
    } finally {
      setCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    setPreviewError(false)
  }, [image])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, published, image: image || undefined }),
      })
      
      if (response.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        alert('خطا در ایجاد پست')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      alert('خطا در ایجاد پست')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth || !user) {
    return <div className="text-center py-12">در حال بارگذاری...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/admin"
        className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
      >
        ← بازگشت به پنل مدیریت
      </Link>

      <h1 className="text-3xl font-bold mb-6">ایجاد پست جدید</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            عنوان
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="عنوان پست را وارد کنید"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            آدرس تصویر (URL) - اختیاری
          </label>
          <input
            type="url"
            id="image"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg یا خالی بگذارید برای تصویر خودکار"
          />
          {image && !previewError && (
            <div className="mt-2 relative w-48 h-32">
              <Image
                src={image}
                alt="پیش‌نمایش"
                fill
                className="object-cover rounded border"
                sizes="192px"
                unoptimized
                loader={passthroughLoader}
                onError={() => setPreviewError(true)}
              />
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            اگر خالی بگذارید، تصویر به صورت خودکار بر اساس عنوان پست از Unsplash انتخاب می‌شود
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            محتوا
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="محتوای پست را وارد کنید"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="ml-2"
            />
            <span className="text-sm text-gray-700">منتشر شود</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
          <Link
            href="/admin"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-center"
          >
            لغو
          </Link>
        </div>
      </form>
    </div>
  )
}

