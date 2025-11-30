import { NextResponse } from 'next/server'
import { getAllPosts, createPost } from '@/lib/posts'

export async function GET() {
  const posts = getAllPosts()
  return NextResponse.json(posts)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, published, image } = body
    
    if (!title || !content) {
      return NextResponse.json(
        { error: 'عنوان و محتوا الزامی است' },
        { status: 400 }
      )
    }
    
    const post = createPost(title, content, published || false, image)
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'خطا در ایجاد پست' },
      { status: 500 }
    )
  }
}

