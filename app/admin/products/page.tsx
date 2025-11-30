'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { productCategories, type ProductCategoryId } from '@/lib/productCategories'
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, fileToBase64, isDataUrl } from '@/lib/images'

interface Product {
  id: string
  name: string
  categoryId: ProductCategoryId
  description: string
  image: string
  price: number
  stock: number
  brand?: string
  highlights?: string[]
  weight?: string
  createdAt: string
}

interface SessionUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

const initialFormState = {
  name: '',
  categoryId: 'cat' as ProductCategoryId,
  price: '',
  stock: '',
  description: '',
  image: '',
  brand: '',
  weight: '',
  highlights: '',
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageUrlInput, setImageUrlInput] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('خطا در دریافت محصولات')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.user && data.user.role === 'admin') {
        setUser(data.user)
        fetchProducts()
      } else {
        router.push('/admin/login')
      }
    } catch (err) {
      console.error('Auth check error:', err)
      router.push('/admin/login')
    }
  }, [fetchProducts, router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const parseHighlights = () =>
    form.highlights
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.image) {
      setError('افزودن تصویر محصول الزامی است')
      return
    }
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch(
        editingProductId ? `/api/products/${editingProductId}` : '/api/products',
        {
          method: editingProductId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          highlights: parseHighlights(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'خطا در ثبت محصول')
        return
      }

      setMessage(editingProductId ? 'محصول با موفقیت ویرایش شد' : 'محصول جدید با موفقیت ثبت شد')
      setForm(initialFormState)
      setEditingProductId(null)
      fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      setError('خطا در ثبت محصول')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) {
      return
    }
    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        setError('خطا در حذف محصول')
        return
      }
      if (editingProductId === id) {
        setEditingProductId(null)
        setForm(initialFormState)
      }
      fetchProducts()
    } catch (err) {
      console.error('Error deleting product:', err)
      setError('خطا در حذف محصول')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProductId(product.id)
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
      image: product.image,
      brand: product.brand || '',
      weight: product.weight || '',
      highlights: (product.highlights || []).join('\n'),
    })
    if (!isDataUrl(product.image)) {
      setImageUrlInput(product.image)
    } else {
      setImageUrlInput('')
    }
    setImageError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setForm(initialFormState)
    setImageUrlInput('')
    setImageError(null)
  }

  const totalInventoryValue = useMemo(() => {
    return products.reduce((sum, product) => sum + product.price * product.stock, 0)
  }, [products])

  useEffect(() => {
    if (!isDataUrl(form.image)) {
      setImageUrlInput(form.image || '')
    }
  }, [form.image])

  const handleManualImageChange = (value: string) => {
    setImageUrlInput(value)
    setForm((prev) => ({
      ...prev,
      image: value,
    }))
    setImageError(null)
  }

  const handleProductImage = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file)
      setForm((prev) => ({
        ...prev,
        image: base64,
      }))
      setImageUrlInput('')
      setImageError(null)
    } catch (err) {
      console.error('Error reading file:', err)
      setImageError('بارگذاری تصویر با خطا مواجه شد')
    }
  }, [])

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0]
        setImageError(firstError?.message || 'فایل انتخابی معتبر نیست')
      }
      if (acceptedFiles.length > 0) {
        await handleProductImage(acceptedFiles[0])
      }
    },
    [handleProductImage]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    maxSize: MAX_IMAGE_SIZE_BYTES,
    multiple: false,
  })

  if (!user) {
    return <div className="text-center py-12">در حال بارگذاری...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">مدیریت محصولات فروشگاه</h1>
          <p className="text-gray-500 mt-1">افزودن و مدیریت محصولات فروشگاه حیوانات</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            بازگشت به پنل
          </Link>
          <Link
            href="/shop"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            target="_blank"
          >
            مشاهده فروشگاه
          </Link>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded bg-green-100 px-4 py-3 text-green-800">{message}</div>
      )}
      {error && (
        <div className="mb-4 rounded bg-red-100 px-4 py-3 text-red-700">{error}</div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingProductId ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </h2>
            {editingProductId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                لغو و افزودن محصول جدید
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نام محصول
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  دسته‌بندی
                </label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  {productCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  قیمت (تومان)
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  موجودی
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  min={0}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  برند
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="اختیاری"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وزن / حجم
                </label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="مثال: ۲ کیلوگرم"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تصویر محصول
              </label>
              <div
                {...getRootProps({
                  className: `border-2 border-dashed rounded-2xl px-4 py-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`,
                })}
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600">
                  {isDragActive ? 'فایل را رها کنید' : 'برای آپلود تصویر کلیک کنید یا فایل را اینجا بکشید'}
                </p>
                <p className="text-xs text-gray-400 mt-2">فرمت‌های مجاز: JPG, PNG, WEBP, GIF (حداکثر ۵ مگابایت)</p>
              </div>
              {imageError && <p className="text-xs text-red-600 mt-2">{imageError}</p>}
              {form.image && (
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border">
                    <Image
                      src={form.image}
                      alt="Product"
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={isDataUrl(form.image)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, image: '' }))
                      setImageUrlInput('')
                      setImageError(null)
                    }}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    حذف تصویر
                  </button>
                </div>
              )}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  یا وارد کردن لینک مستقیم
                </label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => handleManualImageChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/product.jpg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                توضیحات محصول
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نکات برجسته (هر خط یک مورد)
              </label>
              <textarea
                name="highlights"
                value={form.highlights}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="نمونه:\nحاوی ویتامین\nفاقد گلوتن"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={saving}
            >
              {saving
                ? 'در حال ذخیره...'
                : editingProductId
                  ? 'ذخیره تغییرات'
                  : 'ثبت محصول'}
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold mb-4">وضعیت موجودی</h2>
          <p className="text-4xl font-bold mb-2">
            {totalInventoryValue.toLocaleString('fa-IR')} <span className="text-lg">تومان</span>
          </p>
          <p className="text-sm text-white/80 mb-6">
            ارزش کل موجودی بر اساس قیمت و تعداد فعلی محصولات
          </p>

          <div className="space-y-3">
            {productCategories.map((category) => {
              const count = products.filter((product) => product.categoryId === category.id).length
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3"
                >
                  <span>{category.label}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg mt-10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold">لیست محصولات</h2>
            <p className="text-sm text-gray-500 mt-1">مدیریت سریع موجودی و حذف محصولات</p>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">در حال بارگذاری...</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">محصولی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    محصول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    دسته
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    قیمت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    موجودی
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const categoryLabel =
                    productCategories.find((cat) => cat.id === product.categoryId)?.label || '-'
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100"
                          sizes="56px"
                          unoptimized={isDataUrl(product.image)}
                        />
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {product.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {categoryLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.price.toLocaleString('fa-IR')} تومان
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

