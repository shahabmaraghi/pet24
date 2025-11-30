import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { deleteProduct, getProductById, updateProduct } from '@/lib/products'
import { ensureProductImages } from '@/lib/externalMedia'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = getProductById(params.id)

  if (!product) {
    return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 })
  }

  const [productWithImage] = await ensureProductImages([product])

  return NextResponse.json(productWithImage)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const price =
      body.price !== undefined && body.price !== null && body.price !== ''
        ? Number(body.price)
        : undefined
    const stock =
      body.stock !== undefined && body.stock !== null && body.stock !== ''
        ? Number(body.stock)
        : undefined

    if (price !== undefined && (Number.isNaN(price) || price <= 0)) {
      return NextResponse.json({ error: 'قیمت نامعتبر است' }, { status: 400 })
    }

    if (stock !== undefined && (Number.isNaN(stock) || stock < 0)) {
      return NextResponse.json({ error: 'موجودی نامعتبر است' }, { status: 400 })
    }

    const highlights =
      typeof body.highlights === 'string'
        ? body.highlights
            .split('\n')
            .map((item: string) => item.trim())
            .filter(Boolean)
        : Array.isArray(body.highlights)
          ? body.highlights
          : undefined

    const updated = updateProduct(params.id, {
      ...body,
      price,
      stock,
      highlights,
      name: body.name?.trim(),
      description: body.description?.trim(),
      image: body.image?.trim(),
      brand: body.brand?.trim(),
      weight: body.weight?.trim(),
    })

    if (!updated) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 })
    }

    const [productWithImage] = await ensureProductImages([updated])

    return NextResponse.json(productWithImage)
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی محصول' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  const success = deleteProduct(params.id)

  if (!success) {
    return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 })
  }

  return NextResponse.json({ message: 'محصول با موفقیت حذف شد' })
}

