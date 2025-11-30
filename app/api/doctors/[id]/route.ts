import { NextResponse } from 'next/server'
import { deleteDoctor, getDoctorById, updateDoctor } from '@/lib/doctors'
import { ensureDoctorPhotos } from '@/lib/externalMedia'
import { getSession } from '@/lib/auth'

type RouteParams = { id: string }
type RouteContext = { params: Promise<RouteParams> }

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params
  const doctor = getDoctorById(params.id)

  if (!doctor) {
    return NextResponse.json({ error: 'پزشک یافت نشد' }, { status: 404 })
  }

  const [doctorWithPhoto] = await ensureDoctorPhotos([doctor])

  return NextResponse.json(doctorWithPhoto)
}

export async function PUT(request: Request, context: RouteContext) {
  const params = await context.params
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = await request.json()

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

    const doctor = updateDoctor(params.id, {
      ...body,
      description: body.description?.trim() || undefined,
      mapUrl: body.mapUrl?.trim() || undefined,
      photo: body.photo?.trim() || undefined,
      latitude,
      longitude,
    })

    if (!doctor) {
      return NextResponse.json({ error: 'پزشک یافت نشد' }, { status: 404 })
    }

    const [doctorWithPhoto] = await ensureDoctorPhotos([doctor])

    return NextResponse.json(doctorWithPhoto)
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی پزشک' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  const success = deleteDoctor(params.id)

  if (!success) {
    return NextResponse.json({ error: 'پزشک یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({ message: 'پزشک با موفقیت حذف شد' })
}

