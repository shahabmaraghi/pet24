import { NextResponse } from 'next/server'
import { createDoctor, getAllDoctors, DoctorInput } from '@/lib/doctors'
import { ensureDoctorPhotos } from '@/lib/externalMedia'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const province = url.searchParams.get('province') || undefined
  const city = url.searchParams.get('city') || undefined

  const doctors = await ensureDoctorPhotos(
    await getAllDoctors({
      province,
      city,
    })
  )

  return NextResponse.json(doctors)
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const requiredFields: Array<keyof DoctorInput> = [
      'name',
      'specialty',
      'phone',
      'address',
      'province',
      'city',
    ]

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
        return NextResponse.json(
          { error: `فیلد ${field} الزامی است` },
          { status: 400 }
        )
      }
    }

    const latitude =
      body.latitude !== undefined && body.latitude !== null && body.latitude !== ''
        ? Number(body.latitude)
        : undefined
    const longitude =
      body.longitude !== undefined && body.longitude !== null && body.longitude !== ''
        ? Number(body.longitude)
        : undefined

    if (latitude !== undefined && Number.isNaN(latitude)) {
      return NextResponse.json(
        { error: 'مختصات عرضی نامعتبر است' },
        { status: 400 }
      )
    }

    if (longitude !== undefined && Number.isNaN(longitude)) {
      return NextResponse.json(
        { error: 'مختصات طولی نامعتبر است' },
        { status: 400 }
      )
    }

    const doctor = await createDoctor({
      name: body.name.trim(),
      specialty: body.specialty.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
      province: body.province.trim(),
      city: body.city.trim(),
      description: body.description?.trim() || undefined,
      mapUrl: body.mapUrl?.trim() || undefined,
      latitude,
      longitude,
      photo: body.photo?.trim() || undefined,
    })

    const [doctorWithPhoto] = await ensureDoctorPhotos([doctor])

    return NextResponse.json(doctorWithPhoto, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در ایجاد پزشک جدید' },
      { status: 500 }
    )
  }
}

