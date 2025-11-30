'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { isDataUrl } from '@/lib/images'

type HeroSlide = {
  id: string
  title: string
  description: string
  accent: string
  image: string
  ctaLabel: string
  ctaLink: string
}

const fallbackSlides: HeroSlide[] = [
  {
    id: 'fallback-1',
    title: 'هر آنچه دوست پشمالوی شما نیاز دارد',
    description: 'غذا، لوازم و خدمات تخصصی دامپزشکی در یک فضای مدرن با ارسال سریع.',
    ctaLabel: 'مشاهده فروشگاه',
    ctaLink: '/shop',
    accent: 'فروشگاه آنلاین',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'fallback-2',
    title: 'رزرو سریع نوبت دامپزشکی',
    description: 'با پزشکان منتخب ما آشنا شوید و تنها با چند کلیک نوبت رزرو کنید.',
    ctaLabel: 'لیست پزشکان',
    ctaLink: '/doctors',
    accent: 'پزشکان معتبر',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'fallback-3',
    title: 'مطالب الهام‌بخش برای نگهداری بهتر',
    description: 'در وبلاگ پت‌شاپ نکات تخصصی مراقبت و تربیت حیوانات خانگی را بخوانید.',
    ctaLabel: 'وبلاگ پت‌شاپ',
    ctaLink: '/blog',
    accent: 'مقالات جدید',
    image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1400&q=80',
  },
]

const quickActions = [
  {
    title: 'فروشگاه',
    description: 'تازه‌ترین محصولات و تخفیف‌ها',
    href: '/shop',
    emoji: '🛒',
  },
  {
    title: 'پزشکان',
    description: 'رزرو آنلاین و مشاهده پروفایل پزشکان',
    href: '/doctors',
    emoji: '🩺',
  },
  {
    title: 'رزرو نوبت',
    description: 'ثبت درخواست و پیگیری وضعیت',
    href: '/doctors#reservation',
    emoji: '📅',
  },
  {
    title: 'وبلاگ',
    description: 'خبرها و نکات آموزشی روز',
    href: '/blog',
    emoji: '📰',
  },
]

const communityHighlights = [
  { value: '۸K+', label: 'خانواده خوشحال', detail: 'مشتری فعال در سراسر کشور' },
  { value: '۳۵+', label: 'پزشک همکار', detail: 'متخصصان دامپزشکی تایید شده' },
  { value: '۱۲۰۰+', label: 'محصول موجود', detail: 'منتخب برندهای معتبر' },
  { value: '۴.۹/۵', label: 'رضایت کاربران', detail: 'بر اساس ۳۴۰۰ نظر ثبت شده' },
]

const trendingArticles = [
  {
    title: 'راهنمای تغذیه حیوانات خانگی در روزهای گرم',
    excerpt: 'چگونه برنامه غذایی سگ و گربه خود را در تابستان تنظیم کنیم تا همیشه سرحال بمانند.',
    tag: 'سلامت',
    href: '/blog',
  },
  {
    title: '۱۰ نکته طلایی برای تربیت توله سگ',
    excerpt: 'از انتخاب جایزه مناسب تا تکنیک‌های مثبت برای ساختن رابطه‌ای سالم با پت جدید.',
    tag: 'تربیت',
    href: '/blog',
  },
  {
    title: 'لیست سفر دوستانه با حیوانات خانگی',
    excerpt: 'بهترین اقامتگاه‌ها و چک‌لیست سفر با حیوانات در داخل کشور.',
    tag: 'سبک زندگی',
    href: '/blog',
  },
]

export default function Home() {
  const [slides, setSlides] = useState<HeroSlide[]>(fallbackSlides)
  const [activeSlide, setActiveSlide] = useState(0)

  const heroSlides = useMemo(
    () => (slides.length > 0 ? slides : fallbackSlides),
    [slides]
  )

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/slides', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to load slides')
        }
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setSlides(
            data.map((slide: any) => ({
              id: slide.id,
              title: slide.title,
              description: slide.description,
              accent: slide.accent,
              image: slide.image,
              ctaLabel: slide.ctaLabel,
              ctaLink: slide.ctaLink,
            }))
          )
        }
      } catch (error) {
        console.error('Slider fetch error:', error)
      }
    }

    fetchSlides()
  }, [])

  useEffect(() => {
    if (heroSlides.length === 0) {
      return
    }
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [heroSlides.length])

  useEffect(() => {
    setActiveSlide(0)
  }, [heroSlides.length])

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="container mx-auto px-4 space-y-16 py-12">
        {/* Hero slider */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 text-white">
          <div className="relative h-[360px] sm:h-[420px] md:h-[480px]">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id || slide.title}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
                aria-hidden={index !== activeSlide}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === activeSlide}
                  unoptimized={isDataUrl(slide.image)}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-slate-900/80 via-slate-900/70 to-slate-900/40" />
                <div className="relative z-20 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16">
                  <p className="text-sm font-semibold mb-4 text-blue-200">{slide.accent}</p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-snug max-w-3xl">
                    {slide.title}
                  </h1>
                  <p className="mt-4 text-base sm:text-lg text-blue-50 max-w-2xl">
                    {slide.description}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white/90 text-slate-900 font-semibold px-6 py-3 hover:bg-white transition-colors w-max"
                  >
                    {slide.ctaLabel}
                    <span className="mr-2 text-xl">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3 z-30">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === activeSlide ? 'bg-white w-10' : 'bg-white/40 w-3'
                }`}
                aria-label={`اسلاید ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="bg-white rounded-2xl border border-slate-100 hover:-translate-y-1 transition-all shadow-sm hover:shadow-lg p-5 flex flex-col gap-2"
            >
              <span className="text-3xl">{action.emoji}</span>
              <h3 className="text-xl font-bold text-slate-900">{action.title}</h3>
              <p className="text-sm text-slate-500">{action.description}</p>
              <span className="text-sm font-semibold text-blue-600 mt-auto">رفتن به صفحه →</span>
            </Link>
          ))}
        </section>

        {/* Highlights */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white p-8 lg:p-12 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <p className="text-blue-200 font-semibold mb-2">پت شاپ مارکت</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">یک تجربه کامل برای دوستداران حیوانات خانگی</h2>
              <p className="text-white/80 leading-7">
                ما جامعه‌ای پرانرژی از صاحبان حیوانات خانگی، دامپزشکان و برندهای معتبر هستیم که هر روز
                برای رفاه حیوانات تلاش می‌کنیم. از سفارش آنلاین تا مشاوره تخصصی، هر چه لازم دارید در
                دسترس شماست.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-2xl hover:bg-blue-50 transition-colors"
                >
                  عضویت رایگان
                </Link>
                <Link
                  href="/profile"
                  className="bg-white/10 text-white border border-white/30 font-semibold px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors"
                >
                  ورود کاربران
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              {communityHighlights.map((item) => (
                <div
                  key={item.label}
                  className="bg-white/10 rounded-2xl p-4 text-center border border-white/20 backdrop-blur"
                >
                  <p className="text-2xl font-black">{item.value}</p>
                  <p className="text-sm font-semibold mt-1">{item.label}</p>
                  <p className="text-xs text-white/70 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Blog teaser */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-blue-600 font-semibold">مجله پت شاپ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">آخرین مطالب آموزشی</h2>
            </div>
            <Link href="/blog" className="text-blue-600 font-semibold hover:text-blue-700">
              مشاهده همه مطالب →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {trendingArticles.map((article) => (
              <article
                key={article.title}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col"
              >
                <span className="inline-flex items-center text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-3 py-1 w-max">
                  {article.tag}
                </span>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{article.title}</h3>
                <p className="mt-3 text-sm text-slate-500 leading-6 flex-1">{article.excerpt}</p>
                <Link href={article.href} className="mt-4 text-blue-600 font-semibold">
                  ادامه مطلب →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-lg p-8 lg:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-sm text-blue-600 font-semibold">همراه پت شاپ شوید</p>
            <h2 className="text-3xl font-black text-slate-900 mt-2">با یک حساب، همه خدمات در دسترس شماست</h2>
            <p className="text-slate-500 mt-4 leading-7">
              موجودی محصولات محبوب را دنبال کنید، نوبت بگیرید و به باشگاه مشتریان بپیوندید. با ثبت
              نام رایگان از تخفیف‌های ویژه و پاداش‌های فصلی بهره‌مند شوید.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
              >
                شروع کنید
              </Link>
              <Link
                href="/admin/doctors"
                className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                پیوستن پزشکان
              </Link>
            </div>
          </div>
          <div className="w-full md:w-72 lg:w-80 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">نکته امروز</h3>
            <p className="text-sm text-white/70 mt-2 leading-6">
              برای جلوگیری از استرس حیوان خانگی، برنامه بازی روزانه را در ساعت مشخصی تنظیم کنید و هر
              بار همان روال را دنبال کنید. ثبات، احساس امنیت ایجاد می‌کند.
            </p>
            <div className="mt-6 pt-4 border-t border-white/20 text-sm text-white/80">
              <p>پشتیبانی ۲۴/۷</p>
              <p className="mt-1">۰۲۱-۴۴۴۴۵۵۵۵</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

