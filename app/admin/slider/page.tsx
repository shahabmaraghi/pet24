'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useDropzone, FileRejection } from 'react-dropzone'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, fileToBase64, isDataUrl } from '@/lib/images'
import Image from 'next/image'

interface Slide {
  id: string
  title: string
  description: string
  accent: string
  image: string
  ctaLabel: string
  ctaLink: string
  order: number
  createdAt: string
}

interface SessionUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

const initialFormState = {
  title: '',
  description: '',
  accent: '',
  image: '',
  ctaLabel: '',
  ctaLink: '',
  order: '',
}

export default function SliderAdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [form, setForm] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')

  const fetchSlides = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/slides', { cache: 'no-store' })
      const data = await response.json()
      setSlides(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching slides:', err)
      setError('خطا در دریافت لیست اسلایدها')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.user && data.user.role === 'admin') {
        setUser(data.user)
        fetchSlides()
      } else {
        window.location.href = '/admin/login'
      }
    } catch (err) {
      console.error('Auth check error:', err)
      window.location.href = '/admin/login'
    }
  }, [fetchSlides])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    if (!form.image) {
      setError('افزودن تصویر برای اسلاید الزامی است')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      order: form.order ? Number(form.order) : undefined,
    }

    try {
      const response = await fetch(
        editingSlideId ? `/api/slides/${editingSlideId}` : '/api/slides',
        {
          method: editingSlideId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'خطا در ذخیره اسلاید')
        return
      }

      setMessage(editingSlideId ? 'اسلاید با موفقیت ویرایش شد' : 'اسلاید جدید اضافه شد')
      setForm(initialFormState)
      setEditingSlideId(null)
      fetchSlides()
    } catch (err) {
      console.error('Error saving slide:', err)
      setError('خطا در ذخیره اسلاید')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (slide: Slide) => {
    setEditingSlideId(slide.id)
    setForm({
      title: slide.title,
      description: slide.description,
      accent: slide.accent,
      image: slide.image,
      ctaLabel: slide.ctaLabel,
      ctaLink: slide.ctaLink,
      order: String(slide.order ?? ''),
    })
    if (!isDataUrl(slide.image)) {
      setImageUrlInput(slide.image)
    } else {
      setImageUrlInput('')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingSlideId(null)
    setForm(initialFormState)
    setMessage(null)
    setError(null)
    setImageError(null)
    setImageUrlInput('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این اسلاید مطمئن هستید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/slides/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        setError('خطا در حذف اسلاید')
        return
      }
      if (editingSlideId === id) {
        handleCancelEdit()
      }
      fetchSlides()
    } catch (err) {
      console.error('Error deleting slide:', err)
      setError('خطا در حذف اسلاید')
    }
  }

  useEffect(() => {
    if (!isDataUrl(form.image)) {
      setImageUrlInput(form.image || '')
    }
  }, [form.image])

  const handleManualImageChange = (value: string) => {
    setImageUrlInput(value)
    setForm((prev) => ({
      ...prev,
      image: value,
    }))
    setImageError(null)
  }

  const handleSlideImage = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file)
      setForm((prev) => ({
        ...prev,
        image: base64,
      }))
      setImageUrlInput('')
      setImageError(null)
    } catch (err) {
      console.error('Error reading file:', err)
      setImageError('بارگذاری تصویر با خطا مواجه شد')
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0]
        setImageError(firstError?.message || 'فایل انتخابی معتبر نیست')
      }
      if (acceptedFiles.length > 0) {
        await handleSlideImage(acceptedFiles[0])
      }
    },
    [handleSlideImage]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE_BYTES,
    multiple: false,
  })

  if (!user) {
    return <div className="text-center py-12">در حال بارگذاری...</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">مدیریت اسلایدر صفحه اصلی</h1>
          <p className="text-gray-500 mt-1">
            اسلایدهای نمایش داده شده در هدر صفحه اصلی را اضافه، ویرایش و حذف کنید.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            بازگشت به پنل
          </Link>
          <Link
            href="/"
            target="_blank"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            مشاهده صفحه اصلی
          </Link>
        </div>
      </div>

      {message && (
        <div className="bg-green-100 text-green-800 rounded-lg px-4 py-3">{message}</div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingSlideId ? 'ویرایش اسلاید' : 'افزودن اسلاید جدید'}
            </h2>
            {editingSlideId && (
              <button onClick={handleCancelEdit} className="text-sm text-blue-600 hover:text-blue-800">
                لغو و افزودن اسلاید جدید
              </button>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عنوان</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">متن کوچک (Accent)</label>
                <input
                  type="text"
                  name="accent"
                  value={form.accent}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">برچسب دکمه</label>
                <input
                  type="text"
                  name="ctaLabel"
                  value={form.ctaLabel}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">لینک دکمه</label>
                <input
                  type="text"
                  name="ctaLink"
                  value={form.ctaLink}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تصویر اسلاید</label>
              <div
                {...getRootProps({
                  className: `border-2 border-dashed rounded-2xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`,
                })}
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'فایل را رها کنید' : 'برای آپلود تصویر کلیک کنید یا فایل را اینجا بکشید'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  فرمت‌های مجاز: JPG, PNG, WEBP, GIF (حداکثر ۵ مگابایت)
                </p>
              </div>
              {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
              {form.image && (
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative w-32 h-20 rounded-xl overflow-hidden border">
                    <Image
                      src={form.image}
                      alt="Slide preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                      unoptimized={isDataUrl(form.image)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, image: '' }))
                      setImageUrlInput('')
                      setImageError(null)
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    حذف تصویر
                  </button>
                </div>
              )}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  یا وارد کردن لینک مستقیم
                </label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => handleManualImageChange(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ترتیب نمایش</label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  min={1}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: 1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'در حال ذخیره...' : editingSlideId ? 'ذخیره تغییرات' : 'افزودن اسلاید'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-xl font-semibold mb-4">پیش‌نمایش زنده</h3>
          <div className="rounded-2xl overflow-hidden bg-slate-900 text-white shadow-xl">
            {form.image ? (
              <div className="relative h-48">
                <Image
                  src={form.image}
                  alt={form.title || 'اسلاید'}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized={isDataUrl(form.image)}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/70 to-slate-900/30" />
              </div>
            ) : (
              <div className="h-48 bg-slate-800 flex items-center justify-center text-slate-400 text-sm">
                تصویر در پیش‌نمایش نمایش داده می‌شود
              </div>
            )}
            <div className="p-6 space-y-3">
              <p className="text-blue-200 text-sm font-semibold">{form.accent || 'متن برجسته اسلاید'}</p>
              <h4 className="text-2xl font-bold">{form.title || 'عنوان اسلاید'}</h4>
              <p className="text-sm text-white/80 leading-relaxed">
                {form.description || 'توضیحات اسلاید در این بخش نمایش داده می‌شود.'}
              </p>
              {form.ctaLabel && (
                <span className="inline-flex items-center gap-2 bg-white/90 text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold">
                  {form.ctaLabel}
                  <span>→</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            برای بهترین کیفیت تصویر از عکس‌های افقی با حداقل عرض ۱۴۰۰ پیکسل استفاده کنید.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">لیست اسلایدها</h2>
            <p className="text-sm text-gray-500 mt-1">ترتیب نمایش بر اساس عدد اولویت (Order) است.</p>
          </div>
          <button
            onClick={fetchSlides}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
          >
            بروزرسانی
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">در حال بارگذاری...</div>
        ) : slides.length === 0 ? (
          <div className="p-6 text-center text-gray-500">اسلایدی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عنوان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    متن کوچک
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    لینک
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ترتیب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {slides.map((slide) => (
                  <tr key={slide.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{slide.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{slide.description}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slide.accent}</td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium">{slide.ctaLink}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{slide.order}</td>
                    <td className="px-6 py-4 text-sm font-medium flex gap-4">
                      <button
                        onClick={() => handleEdit(slide)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(slide.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

