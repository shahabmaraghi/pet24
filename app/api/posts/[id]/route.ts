import { NextResponse } from 'next/server'
import { getPostById, updatePost, deletePost } from '@/lib/posts'

type RouteParams = { id: string }
type RouteContext = { params: Promise<RouteParams> }

export async function GET(request: Request, context: RouteContext) {
  const params = await context.params
  const post = await getPostById(params.id)
  
  if (!post) {
    return NextResponse.json(
      { error: 'پست یافت نشد' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(post)
}

export async function PUT(request: Request, context: RouteContext) {
  const params = await context.params
  try {
    const body = await request.json()
    const { title, content, published, image } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'عنوان و محتوا الزامی است' },
        { status: 400 }
      )
    }
    
    const post = await updatePost(params.id, title, content, published || false, image)
    
    if (!post) {
      return NextResponse.json(
        { error: 'پست یافت نشد' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(post)
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی پست' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const params = await context.params
  const success = await deletePost(params.id)
  
  if (!success) {
    return NextResponse.json(
      { error: 'پست یافت نشد' },
      { status: 404 }
    )
  }
  
  return NextResponse.json({ message: 'پست با موفقیت حذف شد' })
}

