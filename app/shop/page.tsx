'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { isDataUrl } from '@/lib/images'

interface Product {
  id: string
  name: string
  categoryId: string
  description: string
  image: string
  price: number
  stock: number
  brand?: string
  highlights?: string[]
}

interface ProductCategory {
  id: string
  label: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

const CART_STORAGE_KEY = 'pet-shop-cart'

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    loadCart()
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  const loadCart = () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      setCart(JSON.parse(stored))
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
      setCategories([{ id: 'all', label: 'همه' }, ...(data.categories || [])])
    } catch (err) {
      console.error('Error loading products:', err)
      setError('خطا در دریافت لیست محصولات. لطفاً مجدداً تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (selectedCategory !== 'all') {
      result = result.filter((product) => product.categoryId === selectedCategory)
    }

    if (search.trim()) {
      const normalized = search.trim().toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(normalized) ||
          product.description.toLowerCase().includes(normalized) ||
          product.brand?.toLowerCase().includes(normalized)
      )
    }

    if (sort === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else {
      result.sort((a, b) => (a.id < b.id ? 1 : -1))
    }

    return result
  }, [products, selectedCategory, search, sort])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.productId === product.id)
      if (exists) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ]
    })
  }

  const decreaseQuantity = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== id))
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setCheckoutMessage('سفارش شما ثبت شد. همکاران ما به‌زودی با شما تماس می‌گیرند.')
    setCart([])
    setTimeout(() => setCheckoutMessage(null), 4000)
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
          <p className="text-blue-200 mb-2 font-semibold">PET SHOP MARKETPLACE</p>
          <div className="flex flex-wrap justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-black mb-4">فروشگاه آنلاین حیوانات خانگی</h1>
              <p className="text-white/80 leading-7">
                غذا، لوازم و اسباب‌بازی‌های منتخب برای دوستان پشمالوی شما با ارسال سریع و
                تضمین اصالت کالا. دسته‌بندی مورد علاقه خود را انتخاب کنید و خریدتان را کامل
                کنید.
              </p>
            </div>
            <div className="bg-white/15 rounded-2xl px-6 py-4 backdrop-blur">
              <p className="text-sm text-white/70 mb-2">جمع کل سبد</p>
              <p className="text-2xl font-bold">
                {cartTotal.toLocaleString('fa-IR')} تومان
              </p>
              <p className="text-xs text-white/60 mt-2">هم‌اکنون {cart.length} کالا در سبد</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm text-gray-500 mb-1">جستجو</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="نام محصول، برند یا کاربرد..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="absolute left-4 top-2.5 text-gray-400">🔍</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-500 mb-1">مرتب‌سازی</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="newest">جدیدترین</option>
                    <option value="price-asc">ارزان‌ترین</option>
                    <option value="price-desc">گران‌ترین</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full border transition-all ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="p-12 text-center text-gray-500">در حال بارگذاری محصولات...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-500">محصولی مطابق فیلترها یافت نشد.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    <div className="relative h-56">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 50vw, 100vw"
                        unoptimized={isDataUrl(product.image)}
                      />
                      <div className="absolute top-4 right-4 bg-white/80 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {product.brand || 'پت‌شاپ'}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">قیمت</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {product.price.toLocaleString('fa-IR')}
                            <span className="text-sm mr-1">تومان</span>
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/shop/${product.id}`}
                            target="_blank"
                            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            جزئیات
                          </Link>
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            disabled={product.stock === 0}
                          >
                            افزودن
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">سبد خرید</h2>
                <span className="text-sm text-gray-500">{cart.length} کالا</span>
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-sm">هنوز محصولی به سبد اضافه نشده است.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex gap-3 border border-gray-100 rounded-xl p-3"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover"
                        sizes="64px"
                        unoptimized={isDataUrl(item.image)}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-500">
                            {item.price.toLocaleString('fa-IR')} تومان
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseQuantity(item.productId)}
                              className="w-7 h-7 rounded-full border border-gray-200 text-gray-600"
                            >
                              -
                            </button>
                            <span className="min-w-[24px] text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const product = products.find((p) => p.id === item.productId)
                                if (product) addToCart(product)
                              }}
                              className="w-7 h-7 rounded-full border border-blue-200 text-blue-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 mt-6 pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>هزینه ارسال</span>
                  <span>رایگان</span>
                </div>
                <div className="flex items-center justify-between font-bold text-lg">
                  <span>مجموع پرداخت</span>
                  <span>{cartTotal.toLocaleString('fa-IR')} تومان</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 font-semibold shadow-lg disabled:opacity-50"
                >
                  ثبت و پرداخت
                </button>
                {checkoutMessage && (
                  <p className="text-green-600 text-sm text-center">{checkoutMessage}</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-200 to-orange-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2">ارسال سریع تهران و کرج</h3>
              <p className="text-gray-700 text-sm leading-6">
                سفارش‌های ثبت شده تا ساعت ۱۵ در همان روز برای تهران و کرج ارسال می‌شوند. سایر
                شهرها ظرف ۲۴ تا ۴۸ ساعت تحویل پست خواهند شد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

