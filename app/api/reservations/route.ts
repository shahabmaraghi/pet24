import { NextResponse } from 'next/server'
import { createReservation, getReservations } from '@/lib/reservations'
import { getDoctorById } from '@/lib/doctors'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  const url = new URL(request.url)
  const doctorId = url.searchParams.get('doctorId') || undefined

  const reservations = await getReservations({ doctorId })
  return NextResponse.json(reservations)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { doctorId, patientName, phone, preferredDate, preferredTime, note } = body

    if (!doctorId || !patientName || !phone || !preferredDate) {
      return NextResponse.json(
        { error: 'اطلاعات لازم برای رزرو تکمیل نشده است' },
        { status: 400 }
      )
    }

    const doctor = await getDoctorById(doctorId)

    if (!doctor) {
      return NextResponse.json({ error: 'پزشک یافت نشد' }, { status: 404 })
    }

    const reservation = await createReservation({
      doctorId,
      doctorName: doctor.name,
      patientName: patientName.trim(),
      phone: phone.trim(),
      preferredDate,
      preferredTime: preferredTime?.trim() || undefined,
      note: note?.trim() || undefined,
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در ثبت درخواست رزرو' },
      { status: 500 }
    )
  }
}

