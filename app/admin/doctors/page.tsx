'use client'

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDropzone, FileRejection } from 'react-dropzone'
import { iranlocations } from '@/data/iran-locations'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, fileToBase64, isDataUrl } from '@/lib/images'
import Image from 'next/image'

interface Doctor {
  id: string
  name: string
  specialty: string
  phone: string
  address: string
  province: string
  city: string
  description?: string
  mapUrl?: string
  latitude?: number
  longitude?: number
  photo?: string
  createdAt: string
}

interface SessionUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

const initialFormState = {
  name: '',
  specialty: '',
  phone: '',
  address: '',
  province: '',
  city: '',
  description: '',
  mapUrl: '',
  latitude: '',
  longitude: '',
  photo: '',
}

export default function AdminDoctorsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [form, setForm] = useState(initialFormState)
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [photoUrlInput, setPhotoUrlInput] = useState('')

  const fetchDoctors = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()
      setDoctors(data)
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError('خطا در دریافت لیست پزشکان')
    } finally {
      setLoadingList(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.user && data.user.role === 'admin') {
        setUser(data.user)
        fetchDoctors()
      } else {
        router.push('/admin/login')
      }
    } catch (err) {
      console.error('Auth check error:', err)
      router.push('/admin/login')
    }
  }, [fetchDoctors, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const cityOptions = useMemo(() => {
    if (!form.province) {
      return []
    }
    const provinceData = iranlocations.find(
      (location) => location.province === form.province
    )
    return provinceData ? provinceData.cities : []
  }, [form.province])

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'province' ? { city: '' } : {}),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)

    const payload = {
      ...form,
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    }

    try {
      const response = await fetch(
        editingDoctorId ? `/api/doctors/${editingDoctorId}` : '/api/doctors',
        {
          method: editingDoctorId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'خطا در ذخیره پزشک')
        return
      }

      setMessage(editingDoctorId ? 'پزشک با موفقیت ویرایش شد' : 'پزشک جدید با موفقیت افزوده شد')
      setForm(initialFormState)
      setEditingDoctorId(null)
      fetchDoctors()
    } catch (err) {
      console.error('Error saving doctor:', err)
      setError('خطا در ذخیره پزشک')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این پزشک مطمئن هستید؟')) {
      return
    }

    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (editingDoctorId === id) {
          setEditingDoctorId(null)
          setForm(initialFormState)
        }
        fetchDoctors()
      } else {
        setError('خطا در حذف پزشک')
      }
    } catch (err) {
      console.error('Error deleting doctor:', err)
      setError('خطا در حذف پزشک')
    }
  }

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id)
    setForm({
      name: doctor.name,
      specialty: doctor.specialty,
      phone: doctor.phone,
      address: doctor.address,
      province: doctor.province,
      city: doctor.city,
      description: doctor.description || '',
      mapUrl: doctor.mapUrl || '',
      latitude: doctor.latitude !== undefined ? String(doctor.latitude) : '',
      longitude: doctor.longitude !== undefined ? String(doctor.longitude) : '',
      photo: doctor.photo || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingDoctorId(null)
    setForm(initialFormState)
    setPhotoUrlInput('')
    setImageError(null)
  }

  useEffect(() => {
    if (!isDataUrl(form.photo)) {
      setPhotoUrlInput(form.photo || '')
    }
  }, [form.photo])

  const handleManualPhotoChange = (value: string) => {
    setPhotoUrlInput(value)
    setForm((prev) => ({
      ...prev,
      photo: value,
    }))
    setImageError(null)
  }

  const handleDoctorImage = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file)
      setForm((prev) => ({
        ...prev,
        photo: base64,
      }))
      setPhotoUrlInput('')
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
        await handleDoctorImage(acceptedFiles[0])
      }
    },
    [handleDoctorImage]
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
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">مدیریت پزشکان</h1>
          <p className="text-gray-500 mt-1">افزودن و مدیریت پزشکان جهت رزرو آنلاین</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            بازگشت به پنل
          </Link>
          <Link
            href="/doctors"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
          >
            مشاهده صفحه پزشکان
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded bg-green-100 px-4 py-3 text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingDoctorId ? 'ویرایش پزشک' : 'افزودن پزشک جدید'}
            </h2>
            {editingDoctorId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                لغو و افزودن پزشک جدید
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تخصص
              </label>
              <input
                type="text"
                name="specialty"
                value={form.specialty}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  استان
                </label>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                >
                  <option value="" disabled>
                    انتخاب استان
                  </option>
                  {iranlocations.map((location) => (
                    <option key={location.province} value={location.province}>
                      {location.province}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شهر
                </label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                  required
                  disabled={!form.province}
                >
                  <option value="" disabled>
                    {form.province ? 'انتخاب شهر' : 'ابتدا استان را انتخاب کنید'}
                  </option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                شماره تماس
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                آدرس کامل
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                توضیحات
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                لینک نقشه (Google Maps)
              </label>
              <input
                type="text"
                name="mapUrl"
                value={form.mapUrl}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مختصات عرض جغرافیایی
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: 35.6892"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مختصات طول جغرافیایی
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: 51.3890"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تصویر پزشک
              </label>
              <div
                {...getRootProps({
                  className: `border-2 border-dashed rounded-xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`,
                })}
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'رها کنید...' : 'برای آپلود تصویر اینجا کلیک کنید یا فایل را رها کنید'}
                </p>
                <p className="text-xs text-gray-400 mt-2">فرمت‌های مجاز: JPG, PNG, WEBP, GIF (حداکثر ۵ مگابایت)</p>
              </div>
              {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
              {form.photo && (
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                    <Image
                      src={form.photo}
                      alt="Doctor"
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={isDataUrl(form.photo)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, photo: '' }))
                      setPhotoUrlInput('')
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
                  value={photoUrlInput}
                  onChange={(e) => handleManualPhotoChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
              disabled={saving}
            >
              {saving
                ? 'در حال ذخیره...'
                : editingDoctorId
                  ? 'ذخیره تغییرات'
                  : 'ثبت پزشک جدید'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">راهنمای تکمیل اطلاعات</h2>
          <p className="text-gray-600 leading-7">
            لطفاً اطلاعات هر پزشک را به صورت دقیق وارد کنید تا کاربران بتوانند به سادگی
            پزشک مورد نظر را پیدا و رزرو کنند. لینک نقشه می‌تواند لینک مستقیم Google
            Maps باشد و مختصات برای نمایش دقیق موقعیت استفاده می‌شود. در صورت نداشتن
            تصویر، فیلد مربوطه را خالی بگذارید تا تصویر پیش‌فرض نمایش داده شود.
          </p>
          <div className="mt-6 rounded-lg border border-dashed border-blue-200 p-4 text-sm text-blue-700 bg-blue-50">
            برای ویرایش اطلاعات پزشکان در آینده، می‌توانید از تیم توسعه بخواهید که فرم
            ویرایش را اضافه کنند یا به صورت دستی داده‌ها را در پایگاه داده به‌روزرسانی
            کنید.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md mt-8 overflow-x-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">لیست پزشکان ثبت شده</h2>
          <p className="text-sm text-gray-500 mt-1">
            در این جدول می‌توانید اطلاعات پزشکان ثبت شده را مشاهده و در صورت نیاز حذف کنید.
          </p>
        </div>
        {loadingList ? (
          <div className="p-6 text-center text-gray-500">در حال بارگذاری...</div>
        ) : doctors.length === 0 ? (
          <div className="p-6 text-center text-gray-500">هیچ پزشکی ثبت نشده است.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  نام پزشک
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  شهر / استان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تخصص
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تلفن
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                    <div className="text-xs text-gray-500">{doctor.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.city} / {doctor.province}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.specialty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      ویرایش
                    </button>
                    {doctor.mapUrl && (
                      <a
                        href={doctor.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        مشاهده نقشه
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

