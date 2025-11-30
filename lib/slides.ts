import { type Collection, WithId } from 'mongodb'
import { loadJsonFile, saveJsonFile } from './storage'
import { getDb, mongoEnabled } from './mongodb'

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

const defaultSlides: Slide[] = [
  {
    id: 'slide-1',
    title: 'هر آنچه دوست پشمالوی شما نیاز دارد',
    description: 'غذا، لوازم و خدمات تخصصی دامپزشکی در یک فضای مدرن با ارسال سریع.',
    accent: 'فروشگاه آنلاین',
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=1400&q=80',
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
    image:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1400&q=80',
    ctaLabel: 'وبلاگ پت‌شاپ',
    ctaLink: '/blog',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

type SlideDocument = Omit<Slide, 'id'> & { _id: string }

const SLIDES_FILE = 'slides.json'
let slidesCache: Slide[] = loadJsonFile<Slide[]>(SLIDES_FILE, defaultSlides)

function refreshSlidesFromJson() {
  slidesCache = loadJsonFile<Slide[]>(SLIDES_FILE, defaultSlides)
}

function persistSlidesToJson() {
  saveJsonFile(SLIDES_FILE, slidesCache)
}

function sortSlides(slides: Slide[]) {
  return slides.sort((a, b) => {
    if (a.order === b.order) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return a.order - b.order
  })
}

function getAllSlidesFromJson(): Slide[] {
  refreshSlidesFromJson()
  return sortSlides([...slidesCache]).map((slide) => ({ ...slide }))
}

function getSlideByIdFromJson(id: string): Slide | undefined {
  refreshSlidesFromJson()
  return slidesCache.find((slide) => slide.id === id)
}

function createSlideInJson(input: SlideInput): Slide {
  refreshSlidesFromJson()
  const now = new Date().toISOString()
  const newSlide: Slide = {
    id: `slide-${Date.now()}`,
    ...input,
    order: input.order ?? slidesCache.length + 1,
    createdAt: now,
    updatedAt: now,
  }

  slidesCache.push(newSlide)
  persistSlidesToJson()
  return newSlide
}

function updateSlideInJson(id: string, input: Partial<SlideInput>): Slide | null {
  refreshSlidesFromJson()
  const index = slidesCache.findIndex((slide) => slide.id === id)
  if (index === -1) {
    return null
  }

  const updated: Slide = {
    ...slidesCache[index],
    ...input,
    order: input.order ?? slidesCache[index].order,
    updatedAt: new Date().toISOString(),
  }

  slidesCache[index] = updated
  persistSlidesToJson()
  return updated
}

function deleteSlideInJson(id: string): boolean {
  refreshSlidesFromJson()
  const index = slidesCache.findIndex((slide) => slide.id === id)
  if (index === -1) {
    return false
  }

  slidesCache.splice(index, 1)
  persistSlidesToJson()
  return true
}

let slidesCollectionPromise: Promise<Collection<SlideDocument>> | null = null

async function getSlidesCollection() {
  if (!slidesCollectionPromise) {
    slidesCollectionPromise = (async () => {
      const db = await getDb()
      const collection = db.collection<SlideDocument>('slides')
      const count = await collection.estimatedDocumentCount()
      if (count === 0) {
        await collection.insertMany(
          defaultSlides.map(({ id, ...slide }) => ({
            _id: id,
            ...slide,
          }))
        )
      }
      return collection
    })()
  }

  return slidesCollectionPromise
}

function mapSlide(doc: WithId<SlideDocument>): Slide {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    accent: doc.accent,
    image: doc.image,
    ctaLabel: doc.ctaLabel,
    ctaLink: doc.ctaLink,
    order: doc.order,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function getAllSlides(): Promise<Slide[]> {
  if (!mongoEnabled) {
    return getAllSlidesFromJson()
  }

  try {
    const collection = await getSlidesCollection()
    const docs = await collection.find().sort({ order: 1, createdAt: 1 }).toArray()
    return docs.map(mapSlide)
  } catch (error) {
    console.error('MongoDB error fetching slides, using JSON fallback:', error)
    return getAllSlidesFromJson()
  }
}

export async function getSlideById(id: string): Promise<Slide | undefined> {
  if (!mongoEnabled) {
    return getSlideByIdFromJson(id)
  }

  try {
    const collection = await getSlidesCollection()
    const doc = await collection.findOne({ _id: id })
    return doc ? mapSlide(doc) : undefined
  } catch (error) {
    console.error('MongoDB error fetching slide by id, using JSON fallback:', error)
    return getSlideByIdFromJson(id)
  }
}

export async function createSlide(input: SlideInput): Promise<Slide> {
  if (!mongoEnabled) {
    return createSlideInJson(input)
  }

  try {
    const collection = await getSlidesCollection()
    const now = new Date().toISOString()
    const id = `slide-${Date.now()}`
    const nextOrder = input.order ?? (await collection.countDocuments()) + 1
    const doc: SlideDocument = {
      _id: id,
      ...input,
      order: nextOrder,
      createdAt: now,
      updatedAt: now,
    }

    await collection.insertOne(doc)
    return mapSlide(doc)
  } catch (error) {
    console.error('MongoDB error creating slide, using JSON fallback:', error)
    return createSlideInJson(input)
  }
}

export async function updateSlide(id: string, input: Partial<SlideInput>): Promise<Slide | null> {
  if (!mongoEnabled) {
    return updateSlideInJson(id, input)
  }

  try {
    const collection = await getSlidesCollection()
    const sanitizedInput = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined)
    ) as Partial<SlideInput>

    const updateDoc: Partial<SlideDocument> = {
      ...sanitizedInput,
      updatedAt: new Date().toISOString(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: id },
      { $set: updateDoc },
      { returnDocument: 'after' }
    )

    return result.value ? mapSlide(result.value) : null
  } catch (error) {
    console.error('MongoDB error updating slide, using JSON fallback:', error)
    return updateSlideInJson(id, input)
  }
}

export async function deleteSlide(id: string): Promise<boolean> {
  if (!mongoEnabled) {
    return deleteSlideInJson(id)
  }

  try {
    const collection = await getSlidesCollection()
    const result = await collection.deleteOne({ _id: id })
    return result.deletedCount === 1
  } catch (error) {
    console.error('MongoDB error deleting slide, using JSON fallback:', error)
    return deleteSlideInJson(id)
  }
}

