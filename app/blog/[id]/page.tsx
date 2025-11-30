import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPostById, getPublishedPosts } from '@/lib/posts'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getReadingTime(content: string) {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  const minutes = Math.ceil(words / wordsPerMinute)
  return minutes
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const post = getPostById(params.id)
  const allPosts = getPublishedPosts()

  if (!post || !post.published) {
    notFound()
  }

  const readingTime = getReadingTime(post.content)
  const relatedPosts = allPosts
    .filter(p => p.id !== post.id)
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 text-sm font-medium transition-colors"
        >
          <span>←</span>
          <span>بازگشت به وبلاگ</span>
        </Link>

        {/* Main Article */}
        <article className="mb-12">
          {/* Header Image */}
          <div className="h-64 md:h-96 relative rounded-lg mb-8 overflow-hidden bg-gray-100">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
            )}
          </div>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <time dateTime={post.createdAt}>
                {formatDate(post.createdAt)}
              </time>
              <span>•</span>
              <span>{readingTime} دقیقه مطالعه</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              {post.title}
            </h1>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed text-lg">
              {post.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-6 last:mb-0">
                  {paragraph || '\u00A0'}
                </p>
              ))}
            </div>
          </div>

          {/* Article Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <span>آخرین بروزرسانی: </span>
                <time dateTime={post.updatedAt}>
                  {formatDate(post.updatedAt)}
                </time>
              </div>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
              مقالات مرتبط
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.id}`}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="h-40 relative overflow-hidden bg-gray-100">
                    {relatedPost.image ? (
                      <Image
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <time dateTime={relatedPost.createdAt}>
                        {formatDate(relatedPost.createdAt)}
                      </time>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                      {relatedPost.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>←</span>
            <span>بازگشت به لیست مقالات</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
