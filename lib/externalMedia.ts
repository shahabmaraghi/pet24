import type { Doctor } from './doctors'
import type { Product } from './products'

const doctorPhotoCache = new Map<string, string>()
const productImageCache = new Map<string, string>()

const cleanValue = (value?: string | null) =>
  typeof value === 'string' ? value.trim() : ''

const DEFAULT_DOCTOR_IMAGE = '/images/default-doctor.svg'

const diceBearUrl = (style: string, seed: string) =>
  `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=512`

export async function ensureDoctorPhotos(doctors: Doctor[]): Promise<Doctor[]> {
  return doctors.map((doctor) => {
    const current = cleanValue(doctor.photo)
    if (current) {
      doctor.photo = current
      doctorPhotoCache.set(doctor.id, current)
      return doctor
    }

    if (!doctorPhotoCache.has(doctor.id)) {
      doctorPhotoCache.set(doctor.id, DEFAULT_DOCTOR_IMAGE)
    }

    doctor.photo = doctorPhotoCache.get(doctor.id)!
    return doctor
  })
}

export async function ensureProductImages(products: Product[]): Promise<Product[]> {
  return products.map((product) => {
    const current = cleanValue(product.image)
    if (current) {
      product.image = current
      productImageCache.set(product.id, current)
      return product
    }

    if (!productImageCache.has(product.id)) {
      const seed = product.name || product.id || `product-${productImageCache.size + 1}`
      productImageCache.set(product.id, diceBearUrl('shapes', seed))
    }

    product.image = productImageCache.get(product.id)!
    return product
  })
}


