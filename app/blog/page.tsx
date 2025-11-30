import Link from 'next/link'
import Image from 'next/image'
import { getPublishedPosts } from '@/lib/posts'

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

function truncateText(text: string, maxLength: number = 120) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export default async function BlogPage() {
  const posts = getPublishedPosts()
  const featuredPost = posts[0]
  const latestPosts = posts.slice(1)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            وبلاگ فروشگاه حیوانات خانگی
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            مقالات و راهنمایی‌های تخصصی برای نگهداری از حیوانات خانگی. 
            از انتخاب حیوان مناسب تا مراقبت‌های روزانه و سلامت حیوان خانگی شما.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-2">هیچ پستی یافت نشد</p>
            <p className="text-gray-500">به زودی مطالب جدیدی اضافه خواهد شد</p>
          </div>
        ) : (
          <>
            {/* Featured Story */}
            {featuredPost && (
              <div className="mb-16">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Featured Story
                  </span>
                </div>
                <Link
                  href={`/blog/${featuredPost.id}`}
                  className="block group"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="md:flex">
                      <div className="md:w-1/2 h-64 md:h-auto relative overflow-hidden bg-gray-100">
                        {featuredPost.image ? (
                          <Image
                            src={featuredPost.image}
                            alt={featuredPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity" />
                      </div>
                      <div className="md:w-1/2 p-8 md:p-12">
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                          <time dateTime={featuredPost.createdAt}>
                            {formatDate(featuredPost.createdAt)}
                          </time>
                          <span>•</span>
                          <span>{getReadingTime(featuredPost.content)} دقیقه مطالعه</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                          {featuredPost.title}
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed mb-6 line-clamp-3">
                          {truncateText(featuredPost.content, 200)}
                        </p>
                        <span className="inline-flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                          <span>ادامه مطلب</span>
                          <span className="mr-2">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Latest Articles */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  آخرین مقالات
                </h2>
                {latestPosts.length > 6 && (
                  <Link
                    href="/blog"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    مشاهده همه مقالات →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestPosts.map((post) => {
                  const readingTime = getReadingTime(post.content)
                  const excerpt = truncateText(post.content)
                  
                  return (
                    <article
                      key={post.id}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all group"
                    >
                      {/* Image */}
                      <Link href={`/blog/${post.id}`}>
                        <div className="h-48 relative overflow-hidden bg-gray-100">
                          {post.image ? (
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-opacity" />
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <time dateTime={post.createdAt}>
                            {formatDate(post.createdAt)}
                          </time>
                          <span>•</span>
                          <span>{readingTime} دقیقه</span>
                        </div>

                        <Link href={`/blog/${post.id}`}>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed text-sm">
                          {excerpt}
                        </p>

                        <Link
                          href={`/blog/${post.id}`}
                          className="inline-flex items-center text-blue-600 font-medium text-sm hover:text-blue-700 group/link"
                        >
                          <span>ادامه مطلب</span>
                          <span className="mr-1 group-hover/link:translate-x-[-2px] transition-transform">→</span>
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
