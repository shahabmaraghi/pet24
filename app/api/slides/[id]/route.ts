import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { deleteSlide, getSlideById, updateSlide, SlideInput } from '@/lib/slides'

type RouteParams = { id: string }
type RouteContext = { params: Promise<RouteParams> }

export async function GET(_: Request, context: RouteContext) {
  const params = await context.params
  const slide = getSlideById(params.id)
  if (!slide) {
    return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
  }
  return NextResponse.json(slide)
}

export async function PUT(request: Request, context: RouteContext) {
  const params = await context.params
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Partial<SlideInput>

    const order =
      body.order !== undefined && body.order !== null && !Number.isNaN(Number(body.order))
        ? Number(body.order)
        : undefined

    const updated = updateSlide(params.id, {
      ...body,
      title: body.title?.trim(),
      description: body.description?.trim(),
      accent: body.accent?.trim(),
      image: body.image?.trim(),
      ctaLabel: body.ctaLabel?.trim(),
      ctaLink: body.ctaLink?.trim(),
      order,
    })

    if (!updated) {
      return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating slide:', error)
    return NextResponse.json({ error: 'خطا در بروزرسانی اسلاید' }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const params = await context.params
  const session = await getSession()

  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  const success = deleteSlide(params.id)

  if (!success) {
    return NextResponse.json({ error: 'اسلاید یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({ message: 'اسلاید حذف شد' })
}

