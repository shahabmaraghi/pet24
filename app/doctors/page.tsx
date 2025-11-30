'use client'

import Image from 'next/image'
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { isDataUrl } from '@/lib/images'
import { iranlocations } from '@/data/iran-locations'

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
}

type ReservationFeedback = {
  type: 'success' | 'error'
  message: string
}

const reservationInitialState = {
  patientName: '',
  phone: '',
  preferredDate: '',
  preferredTime: '',
  note: '',
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [reservationForm, setReservationForm] = useState(reservationInitialState)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [reservationFeedback, setReservationFeedback] =
    useState<ReservationFeedback | null>(null)

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/doctors')
      const data = await response.json()
      setDoctors(data)
    } catch (err) {
      console.error('Error fetching doctors:', err)
      setError('خطا در دریافت اطلاعات پزشکان. لطفاً مجدداً تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const provinces = useMemo(
    () => iranlocations.map((location) => location.province),
    []
  )

  const cities = useMemo(() => {
    if (!selectedProvince) {
      return []
    }
    const provinceData = iranlocations.find(
      (location) => location.province === selectedProvince
    )
    return provinceData ? provinceData.cities : []
  }, [selectedProvince])

  const filteredDoctors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return doctors.filter((doctor) => {
      const matchesProvince = selectedProvince ? doctor.province === selectedProvince : true
      const matchesCity = selectedCity ? doctor.city === selectedCity : true
      const matchesSearch = normalizedSearch
        ? doctor.name.toLowerCase().includes(normalizedSearch) ||
          doctor.specialty.toLowerCase().includes(normalizedSearch) ||
          doctor.city.toLowerCase().includes(normalizedSearch)
        : true
      return matchesProvince && matchesCity && matchesSearch
    })
  }, [doctors, selectedProvince, selectedCity, searchTerm])

  const resetFilters = () => {
    setSelectedProvince('')
    setSelectedCity('')
    setSearchTerm('')
  }

  const handleReservationChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setReservationForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const closeReservationModal = () => {
    setSelectedDoctor(null)
    setReservationForm(reservationInitialState)
    setReservationFeedback(null)
  }

  const handleReservationSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedDoctor) return

    setReservationLoading(true)
    setReservationFeedback(null)

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          ...reservationForm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setReservationFeedback({
          type: 'error',
          message: data.error || 'خطایی در ثبت رزرو رخ داد.',
        })
        return
      }

      setReservationFeedback({
        type: 'success',
        message: 'درخواست شما ثبت شد. به‌زودی با شما تماس گرفته می‌شود.',
      })
      setReservationForm(reservationInitialState)
    } catch (err) {
      console.error('Reservation error:', err)
      setReservationFeedback({
        type: 'error',
        message: 'خطا در ثبت رزرو. لطفاً مجدداً تلاش کنید.',
      })
    } finally {
      setReservationLoading(false)
    }
  }

  const getMapLink = (doctor: Doctor) => {
    if (doctor.mapUrl) {
      return doctor.mapUrl
    }
    if (
      typeof doctor.latitude === 'number' &&
      typeof doctor.longitude === 'number'
    ) {
      return `https://maps.google.com/?q=${doctor.latitude},${doctor.longitude}`
    }
    return null
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-blue-600 font-semibold mb-2">سیستم رزرو نوبت</p>
        <h1 className="text-4xl font-bold mb-4">پزشکان همکار فروشگاه</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          پزشکان مجرب حاضر هستند تا حیوان خانگی شما را ویزیت کنند. با استفاده از فیلترهای
          زیر، پزشک مناسب را بر اساس استان و شهر پیدا کرده و تنها با چند کلیک درخواست
          رزرو خود را ثبت کنید.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              استان
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value)
                setSelectedCity('')
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">همه استان‌ها</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              شهر
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedProvince}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {selectedProvince ? 'همه شهرها' : 'ابتدا استان را انتخاب کنید'}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              جستجو
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="نام پزشک یا تخصص..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
            >
              حذف فیلترها
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">در حال بارگذاری...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          هیچ پزشکی با فیلترهای انتخابی یافت نشد.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredDoctors.map((doctor) => {
            const mapLink = getMapLink(doctor)
            return (
              <div key={doctor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="md:flex">
                  {doctor.photo ? (
                    <div className="relative w-full md:w-1/3 h-48 md:h-full min-h-[12rem]">
                      <Image
                        src={doctor.photo}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 33vw, 100vw"
                        priority={false}
                        unoptimized={isDataUrl(doctor.photo)}
                      />
                    </div>
                  ) : (
                    <div className="w-full md:w-1/3 h-48 md:h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-6xl">
                      🩺
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-2xl font-semibold">{doctor.name}</h3>
                        <p className="text-blue-600 font-medium">{doctor.specialty}</p>
                      </div>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        {doctor.city}، {doctor.province}
                      </span>
                    </div>

                    <p className="text-gray-600 mt-4">{doctor.description || 'بدون توضیحات'}</p>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <div>شماره تماس: {doctor.phone}</div>
                      <div>آدرس: {doctor.address}</div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {mapLink && (
                        <a
                          href={mapLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          مشاهده در نقشه
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedDoctor(doctor)}
                        className="flex-1 min-w-[150px] px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        رزرو نوبت
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 py-8 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative">
            <button
              onClick={closeReservationModal}
              className="absolute top-4 left-4 text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
            <div className="p-6">
              <p className="text-sm text-blue-600 font-semibold">فرم رزرو آنلاین</p>
              <h2 className="text-2xl font-bold mt-1 mb-4">{selectedDoctor.name}</h2>
              <p className="text-gray-600 text-sm mb-6">{selectedDoctor.specialty}</p>

              {reservationFeedback && (
                <div
                  className={`mb-4 rounded-lg px-4 py-3 ${
                    reservationFeedback.type === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {reservationFeedback.message}
                </div>
              )}

              <form onSubmit={handleReservationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={reservationForm.patientName}
                    onChange={handleReservationChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    شماره تماس
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={reservationForm.phone}
                    onChange={handleReservationChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاریخ مدنظر
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={reservationForm.preferredDate}
                      onChange={handleReservationChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ساعت پیشنهادی
                    </label>
                    <input
                      type="time"
                      name="preferredTime"
                      value={reservationForm.preferredTime}
                      onChange={handleReservationChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    توضیحات
                  </label>
                  <textarea
                    name="note"
                    value={reservationForm.note}
                    onChange={handleReservationChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="جزئیات وضعیت حیوان خانگی یا درخواست‌های ویژه..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={reservationLoading}
                  className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                  {reservationLoading ? 'در حال ارسال...' : 'ثبت درخواست رزرو'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

