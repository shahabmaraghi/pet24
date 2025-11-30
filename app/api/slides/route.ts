import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createSlide, getAllSlides, SlideInput } from '@/lib/slides'

export async function GET() {
  const slides = await getAllSlides()
  return NextResponse.json(slides)
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as SlideInput
    const requiredFields: Array<keyof SlideInput> = [
      'title',
      'description',
      'accent',
      'image',
      'ctaLabel',
      'ctaLink',
    ]

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string' || !body[field].trim()) {
        return NextResponse.json({ error: `فیلد ${field} الزامی است` }, { status: 400 })
      }
    }

    const order =
      body.order !== undefined && body.order !== null && !Number.isNaN(Number(body.order))
        ? Number(body.order)
        : undefined

    const slide = await createSlide({
      title: body.title.trim(),
      description: body.description.trim(),
      accent: body.accent.trim(),
      image: body.image.trim(),
      ctaLabel: body.ctaLabel.trim(),
      ctaLink: body.ctaLink.trim(),
      order,
    })

    return NextResponse.json(slide, { status: 201 })
  } catch (error) {
    console.error('Error creating slide:', error)
    return NextResponse.json({ error: 'خطا در ایجاد اسلاید' }, { status: 500 })
  }
}

