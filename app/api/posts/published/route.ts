import { NextResponse } from 'next/server'
import { getPublishedPosts } from '@/lib/posts'

export async function GET() {
  const posts = getPublishedPosts()
  return NextResponse.json(posts)
}

