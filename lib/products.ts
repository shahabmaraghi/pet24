import { loadJsonFile, saveJsonFile } from './storage'
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

const PRODUCTS_FILE = 'products.json'

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

let products: Product[] = loadJsonFile<Product[]>(PRODUCTS_FILE, defaultProducts)

function refreshProducts() {
  products = loadJsonFile<Product[]>(PRODUCTS_FILE, defaultProducts)
}

function persistProducts() {
  saveJsonFile(PRODUCTS_FILE, products)
}

export function getAllProducts(filter?: ProductFilter): Product[] {
  refreshProducts()
  let result = [...products]

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

export function getProductById(id: string): Product | undefined {
  refreshProducts()
  return products.find((product) => product.id === id)
}

export function createProduct(payload: ProductInput): Product {
  refreshProducts()
  const now = new Date().toISOString()
  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    ...payload,
    createdAt: now,
    updatedAt: now,
  }
  products.push(newProduct)
  persistProducts()
  return newProduct
}

export function updateProduct(id: string, payload: Partial<ProductInput>): Product | null {
  refreshProducts()
  const index = products.findIndex((product) => product.id === id)
  if (index === -1) {
    return null
  }

  const updatedProduct: Product = {
    ...products[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  products[index] = updatedProduct
  persistProducts()
  return updatedProduct
}

export function deleteProduct(id: string): boolean {
  refreshProducts()
  const index = products.findIndex((product) => product.id === id)
  if (index === -1) {
    return false
  }

  products.splice(index, 1)
  persistProducts()
  return true
}

