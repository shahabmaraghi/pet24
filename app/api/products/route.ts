import { NextResponse } from 'next/server'
import { createProduct, getAllProducts } from '@/lib/products'
import { productCategories, type ProductCategoryId } from '@/lib/productCategories'
import { ensureProductImages } from '@/lib/externalMedia'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const categoryParam = url.searchParams.get('categoryId') as ProductCategoryId | null
  const search = url.searchParams.get('search') || undefined

  const products = await ensureProductImages(
    getAllProducts({
      categoryId: categoryParam || undefined,
      search,
    })
  )

  return NextResponse.json({
    categories: productCategories,
    products,
  })
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const required = ['name', 'categoryId', 'price', 'description', 'image', 'stock']
    for (const field of required) {
      if (
        body[field] === undefined ||
        body[field] === null ||
        (typeof body[field] === 'string' && !body[field].trim())
      ) {
        return NextResponse.json({ error: `فیلد ${field} الزامی است` }, { status: 400 })
      }
    }

    const price = Number(body.price)
    const stock = Number(body.stock)

    if (Number.isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'قیمت نامعتبر است' }, { status: 400 })
    }

    if (Number.isNaN(stock) || stock < 0) {
      return NextResponse.json({ error: 'موجودی نامعتبر است' }, { status: 400 })
    }

    const highlights = Array.isArray(body.highlights)
      ? body.highlights
      : typeof body.highlights === 'string' && body.highlights.trim().length > 0
        ? body.highlights
            .split('\n')
            .map((item: string) => item.trim())
            .filter(Boolean)
        : undefined

    const product = createProduct({
      name: body.name.trim(),
      categoryId: body.categoryId.trim(),
      description: body.description.trim(),
      image: body.image.trim(),
      price,
      stock,
      brand: body.brand?.trim() || undefined,
      weight: body.weight?.trim() || undefined,
      highlights,
    })

    const [productWithImage] = await ensureProductImages([product])

    return NextResponse.json(productWithImage, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در ایجاد محصول جدید' },
      { status: 500 }
    )
  }
}

