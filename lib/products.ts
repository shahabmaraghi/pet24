import { type Collection, WithId } from 'mongodb'
import { loadJsonFile, saveJsonFile } from './storage'
import { getDb, mongoEnabled } from './mongodb'
import {
  productCategories,
  type ProductCategory,
  type ProductCategoryId,
} from './productCategories'

export { productCategories }
export type { ProductCategory, ProductCategoryId }

export interface ProductInput {
  name: string
  categoryId: ProductCategoryId
  description: string
  image: string
  price: number
  stock: number
  brand?: string
  highlights?: string[]
  weight?: string
}

export interface Product extends ProductInput {
  id: string
  createdAt: string
  updatedAt: string
}

type ProductFilter = {
  categoryId?: ProductCategoryId
  search?: string
}

type ProductDocument = Omit<Product, 'id'> & { _id: string }

const defaultProducts: Product[] = [
  {
    id: 'p-1',
    name: 'غذای خشک گربه رویال کنین',
    categoryId: 'cat',
    description: 'غذای کامل برای گربه‌های خانگی با ترکیبات متعادل و پروتئین بالا.',
    image: '',
    price: 890000,
    stock: 20,
    brand: 'Royal Canin',
    weight: '2 کیلوگرم',
    highlights: ['تقویت سیستم ایمنی', 'کمک به سلامت دندان‌ها', 'هضم آسان'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-2',
    name: 'قلاده قابل تنظیم سگ',
    categoryId: 'dog',
    description: 'قلاده پارچه‌ای نرم با قابلیت تنظیم اندازه و قفل ایمنی.',
    image: '',
    price: 320000,
    stock: 45,
    brand: 'PetSafe',
    highlights: ['ضد حساسیت', 'قفل فلزی مقاوم', 'نوار شب‌نما'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-3',
    name: 'قفس پرندگان متوسط',
    categoryId: 'bird',
    description: 'قفس فلزی با پوشش ضدزنگ مناسب طوطی و مرغ عشق با سینی قابل شستشو.',
    image: '',
    price: 1250000,
    stock: 10,
    highlights: ['دارای تاب و ظرف آب', 'کف کشویی', 'در بزرگ برای تمیزکاری'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-4',
    name: 'ست مراقبت از خرگوش',
    categoryId: 'rabbit',
    description: 'شامل برس، ناخن‌گیر و شامپو مخصوص خرگوش برای مراقبت روزانه.',
    image: '',
    price: 540000,
    stock: 15,
    highlights: ['برس نرم فیبری', 'شامپوی بدون اشک', 'ناخن‌گیر استیل'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-5',
    name: 'غذای تشویقی سگ با طعم مرغ',
    categoryId: 'dog',
    description: 'تشویقی نرم مناسب آموزش با پروتئین بالا و بدون گلوتن.',
    image: '',
    price: 215000,
    stock: 60,
    highlights: ['بدون مواد نگهدارنده', 'قابل استفاده برای تمامی نژادها'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-6',
    name: 'اسباب‌بازی تعادلی گربه',
    categoryId: 'cat',
    description: 'اسباب‌بازی فنری با توپ LED برای سرگرمی و تحرک بیشتر گربه‌ها.',
    image: '',
    price: 175000,
    stock: 35,
    highlights: ['چراغ LED', 'پایه ضدلغزش', 'قابل استفاده برای دو گربه'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-7',
    name: 'خانه چوبی همستر',
    categoryId: 'small-pet',
    description: 'خانه چندطبقه از چوب طبیعی بدون مواد شیمیایی برای همستر و خوکچه.',
    image: '',
    price: 460000,
    stock: 12,
    highlights: ['طراحی سه طبقه', 'مقاوم در برابر رطوبت', 'نصب آسان'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-8',
    name: 'بطری آب مسافرتی حیوانات',
    categoryId: 'accessory',
    description: 'بطری آب ۵۰۰ میلی لیتری با ظرف تاشو مناسب سفر و پیاده‌روی.',
    image: '',
    price: 210000,
    stock: 30,
    highlights: ['بدون نشتی', 'سبک و کم‌جا', 'قابل استفاده برای گربه و سگ'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const PRODUCTS_FILE = 'products.json'
let productCache: Product[] = loadJsonFile<Product[]>(PRODUCTS_FILE, defaultProducts)

function refreshProductsFromJson() {
  productCache = loadJsonFile<Product[]>(PRODUCTS_FILE, defaultProducts)
}

function persistProductsToJson() {
  saveJsonFile(PRODUCTS_FILE, productCache)
}

function getAllProductsFromJson(filter?: ProductFilter): Product[] {
  refreshProductsFromJson()
  let result = [...productCache]

  if (filter?.categoryId) {
    result = result.filter((product) => product.categoryId === filter.categoryId)
  }

  if (filter?.search) {
    const normalized = filter.search.trim().toLowerCase()
    result = result.filter(
      (product) =>
        product.name.toLowerCase().includes(normalized) ||
        product.description.toLowerCase().includes(normalized) ||
        product.brand?.toLowerCase().includes(normalized)
    )
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function getProductByIdFromJson(id: string): Product | undefined {
  refreshProductsFromJson()
  return productCache.find((product) => product.id === id)
}

function createProductInJson(payload: ProductInput): Product {
  refreshProductsFromJson()
  const now = new Date().toISOString()
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    ...payload,
    createdAt: now,
    updatedAt: now,
  }
  productCache.push(newProduct)
  persistProductsToJson()
  return newProduct
}

function updateProductInJson(id: string, payload: Partial<ProductInput>): Product | null {
  refreshProductsFromJson()
  const index = productCache.findIndex((product) => product.id === id)
  if (index === -1) {
    return null
  }

  const updatedProduct: Product = {
    ...productCache[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  productCache[index] = updatedProduct
  persistProductsToJson()
  return updatedProduct
}

function deleteProductInJson(id: string): boolean {
  refreshProductsFromJson()
  const index = productCache.findIndex((product) => product.id === id)
  if (index === -1) {
    return false
  }

  productCache.splice(index, 1)
  persistProductsToJson()
  return true
}

let productsCollectionPromise: Promise<Collection<ProductDocument>> | null = null

async function getProductsCollection() {
  if (!productsCollectionPromise) {
    productsCollectionPromise = (async () => {
      const db = await getDb()
      const collection = db.collection<ProductDocument>('products')
      const count = await collection.estimatedDocumentCount()
      if (count === 0) {
        await collection.insertMany(
          defaultProducts.map(({ id, ...product }) => ({
            _id: id,
            ...product,
          }))
        )
      }
      return collection
    })()
  }

  return productsCollectionPromise
}

function mapProduct(doc: WithId<ProductDocument>): Product {
  return {
    id: doc._id,
    name: doc.name,
    categoryId: doc.categoryId,
    description: doc.description,
    image: doc.image,
    price: doc.price,
    stock: doc.stock,
    brand: doc.brand,
    highlights: doc.highlights,
    weight: doc.weight,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function getAllProducts(filter?: ProductFilter): Promise<Product[]> {
  if (!mongoEnabled) {
    return getAllProductsFromJson(filter)
  }

  try {
    const collection = await getProductsCollection()
    const query: Record<string, unknown> = {}

    if (filter?.categoryId) {
      query.categoryId = filter.categoryId
    }

    if (filter?.search) {
      const normalized = filter.search.trim().toLowerCase()
      query.$or = [
        { name: { $regex: normalized, $options: 'i' } },
        { description: { $regex: normalized, $options: 'i' } },
        { brand: { $regex: normalized, $options: 'i' } },
      ]
    }

    const docs = await collection.find(query).sort({ createdAt: -1 }).toArray()
    return docs.map(mapProduct)
  } catch (error) {
    console.error('MongoDB error fetching products, using JSON fallback:', error)
    return getAllProductsFromJson(filter)
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!mongoEnabled) {
    return getProductByIdFromJson(id)
  }

  try {
    const collection = await getProductsCollection()
    const doc = await collection.findOne({ _id: id })
    return doc ? mapProduct(doc) : undefined
  } catch (error) {
    console.error('MongoDB error fetching product by id, using JSON fallback:', error)
    return getProductByIdFromJson(id)
  }
}

export async function createProduct(payload: ProductInput): Promise<Product> {
  if (!mongoEnabled) {
    return createProductInJson(payload)
  }

  try {
    const collection = await getProductsCollection()
    const now = new Date().toISOString()
    const id = `prod-${Date.now()}`
    const doc: ProductDocument = {
      _id: id,
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    await collection.insertOne(doc)
    return mapProduct(doc)
  } catch (error) {
    console.error('MongoDB error creating product, using JSON fallback:', error)
    return createProductInJson(payload)
  }
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductInput>
): Promise<Product | null> {
  if (!mongoEnabled) {
    return updateProductInJson(id, payload)
  }

  try {
    const collection = await getProductsCollection()
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    ) as Partial<ProductInput>

    const result = await collection.findOneAndUpdate(
      { _id: id },
      { $set: { ...sanitizedPayload, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    )

    return result.value ? mapProduct(result.value) : null
  } catch (error) {
    console.error('MongoDB error updating product, using JSON fallback:', error)
    return updateProductInJson(id, payload)
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!mongoEnabled) {
    return deleteProductInJson(id)
  }

  try {
    const collection = await getProductsCollection()
    const result = await collection.deleteOne({ _id: id })
    return result.deletedCount === 1
  } catch (error) {
    console.error('MongoDB error deleting product, using JSON fallback:', error)
    return deleteProductInJson(id)
  }
}

