'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  weight?: string
}

interface CartItem {
  productId: string
  name: string
  price: number
  image: string
  quantity: number
}

const CART_STORAGE_KEY = 'pet-shop-cart'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id as string)
    }
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      setCartItems(JSON.parse(stored))
    }
  }, [params?.id])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const fetchProduct = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) {
        setError('محصول مورد نظر یافت نشد.')
        setLoading(false)
        return
      }
      const data = await response.json()
      setProduct(data)
    } catch (err) {
      console.error('Error loading product:', err)
      setError('خطا در بارگذاری محصول')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = () => {
    if (!product) return
    setCartItems((prev) => {
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
    setToast('به سبد خرید اضافه شد')
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) {
    return <div className="text-center py-16 text-gray-500">در حال بارگذاری...</div>
  }

  if (error || !product) {
    return (
      <div className="text-center py-16 text-gray-500">
        {error || 'محصول یافت نشد'}
        <div className="mt-6">
          <button
            onClick={() => router.push('/shop')}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white"
          >
            بازگشت به فروشگاه
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/shop" className="text-blue-600 hover:text-blue-800">
            ← بازگشت به فروشگاه
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative h-96">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              unoptimized={isDataUrl(product.image)}
            />
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col gap-6 border border-gray-100">
            <div>
              <p className="text-sm text-gray-400 mb-1">کد محصول: {product.id}</p>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              {product.brand && <p className="text-blue-600 font-semibold mt-2">{product.brand}</p>}
            </div>

            <p className="text-gray-600 leading-7">{product.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400">قیمت</p>
                <p className="text-3xl font-bold text-blue-600">
                  {product.price.toLocaleString('fa-IR')}
                  <span className="text-base mr-1">تومان</span>
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400">موجودی</p>
                <p className="text-2xl font-bold text-gray-900">{product.stock} عدد</p>
              </div>
            </div>

            {product.weight && (
              <div className="bg-slate-100 rounded-2xl p-4 text-sm text-gray-600">
                وزن / حجم بسته‌بندی: <span className="font-semibold">{product.weight}</span>
              </div>
            )}

            {product.highlights && product.highlights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">ویژگی‌های کلیدی</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {product.highlights.map((highlight, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-gray-700"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={addToCart}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'ناموجود' : 'افزودن به سبد خرید'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  )
}

