import { loadJsonFile, saveJsonFile } from './storage'

export interface SlideInput {
  title: string
  description: string
  accent: string
  image: string
  ctaLabel: string
  ctaLink: string
  order?: number
}

export interface Slide extends SlideInput {
  id: string
  order: number
  createdAt: string
  updatedAt: string
}

const SLIDES_FILE = 'slides.json'

const defaultSlides: Slide[] = [
  {
    id: 'slide-1',
    title: 'هر آنچه دوست پشمالوی شما نیاز دارد',
    description: 'غذا، لوازم و خدمات تخصصی دامپزشکی در یک فضای مدرن با ارسال سریع.',
    accent: 'فروشگاه آنلاین',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
    ctaLabel: 'مشاهده فروشگاه',
    ctaLink: '/shop',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slide-2',
    title: 'رزرو سریع نوبت دامپزشکی',
    description: 'با پزشکان منتخب ما آشنا شوید و تنها با چند کلیک نوبت رزرو کنید.',
    accent: 'پزشکان معتبر',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1400&q=80',
    ctaLabel: 'لیست پزشکان',
    ctaLink: '/doctors',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'slide-3',
    title: 'مطالب الهام‌بخش برای نگهداری بهتر',
    description: 'در وبلاگ پت‌شاپ نکات تخصصی مراقبت و تربیت حیوانات خانگی را بخوانید.',
    accent: 'مقالات جدید',
    image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1400&q=80',
    ctaLabel: 'وبلاگ پت‌شاپ',
    ctaLink: '/blog',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let slides: Slide[] = loadJsonFile<Slide[]>(SLIDES_FILE, defaultSlides)

const sortSlides = () =>
  slides.sort((a, b) => {
    if (a.order === b.order) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return a.order - b.order
  })

function refreshSlides() {
  slides = loadJsonFile<Slide[]>(SLIDES_FILE, defaultSlides)
}

function persistSlides() {
  saveJsonFile(SLIDES_FILE, slides)
}

export function getAllSlides(): Slide[] {
  refreshSlides()
  return sortSlides().map((slide) => ({ ...slide }))
}

export function getSlideById(id: string): Slide | undefined {
  refreshSlides()
  return slides.find((slide) => slide.id === id)
}

export function createSlide(input: SlideInput): Slide {
  refreshSlides()
  const now = new Date().toISOString()
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    ...input,
    order: input.order ?? slides.length + 1,
    createdAt: now,
    updatedAt: now,
  }

  slides.push(newSlide)
  persistSlides()
  return newSlide
}

export function updateSlide(id: string, input: Partial<SlideInput>): Slide | null {
  refreshSlides()
  const index = slides.findIndex((slide) => slide.id === id)
  if (index === -1) {
    return null
  }

  const updated: Slide = {
    ...slides[index],
    ...input,
    order: input.order ?? slides[index].order,
    updatedAt: new Date().toISOString(),
  }

  slides[index] = updated
  persistSlides()
  return updated
}

export function deleteSlide(id: string): boolean {
  refreshSlides()
  const index = slides.findIndex((slide) => slide.id === id)
  if (index === -1) {
    return false
  }
  slides.splice(index, 1)
  persistSlides()
  return true
}

