export type ProductCategoryId = 'cat' | 'dog' | 'bird' | 'rabbit' | 'small-pet' | 'accessory'

export interface ProductCategory {
  id: ProductCategoryId
  label: string
}

export const productCategories: ProductCategory[] = [
  { id: 'cat', label: 'لوازم گربه' },
  { id: 'dog', label: 'لوازم سگ' },
  { id: 'bird', label: 'ملزومات پرندگان' },
  { id: 'rabbit', label: 'لوازم خرگوش' },
  { id: 'small-pet', label: 'جوندگان و کوچک' },
  { id: 'accessory', label: 'اکسسوری و عمومی' },
]

