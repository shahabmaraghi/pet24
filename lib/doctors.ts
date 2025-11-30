import { loadJsonFile, saveJsonFile } from './storage'

export interface DoctorInput {
  name: string
  specialty: string
  phone: string
  address: string
  province: string
  city: string
  description?: string
  mapUrl?: string
  latitude?: number
  longitude?: number
  photo?: string
}

export interface Doctor extends DoctorInput {
  id: string
  createdAt: string
  updatedAt: string
}

type DoctorFilter = {
  province?: string
  city?: string
}

const DOCTORS_FILE = 'doctors.json'

const defaultDoctors: Doctor[] = [
  {
    id: 'd-1',
    name: 'دکتر لیلا محمدی',
    specialty: 'دامپزشک عمومی',
    phone: '021-55667788',
    address: 'تهران، خیابان ولیعصر، کوچه نیلوفر، پلاک ۱۲',
    province: 'تهران',
    city: 'تهران',
    description: 'متخصص مراقبت از حیوانات خانگی کوچک با بیش از ۱۰ سال سابقه.',
    mapUrl: 'https://maps.google.com/?q=35.706282,51.401978',
    latitude: 35.706282,
    longitude: 51.401978,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-2',
    name: 'دکتر سامان رضایی',
    specialty: 'جراح دامپزشک',
    phone: '026-33112255',
    address: 'البرز، کرج، خیابان آزادی، پلاک ۵۶',
    province: 'البرز',
    city: 'کرج',
    description: 'جراح تخصصی حیوانات خانگی و حیوانات اگزوتیک.',
    mapUrl: 'https://maps.google.com/?q=35.832702,50.991550',
    latitude: 35.832702,
    longitude: 50.99155,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-3',
    name: 'دکتر پریسا یکتا',
    specialty: 'متخصص داخلی حیوانات خانگی',
    phone: '031-33669922',
    address: 'اصفهان، خیابان چهارباغ عباسی، نبش کوچه فرهاد',
    province: 'اصفهان',
    city: 'اصفهان',
    description: 'ارائه دهنده خدمات تشخیصی و تصویربرداری برای حیوانات خانگی.',
    mapUrl: 'https://maps.google.com/?q=32.654627,51.667983',
    latitude: 32.654627,
    longitude: 51.667983,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-4',
    name: 'دکتر آرش موحد',
    specialty: 'متخصص پرندگان و حیوانات اگزوتیک',
    phone: '013-44225511',
    address: 'رشت، میدان شهرداری، ساختمان نیما، واحد ۴',
    province: 'گیلان',
    city: 'رشت',
    description: 'دارای دوره تخصصی در مراقبت از پرندگان زینتی و حیوانات اگزوتیک.',
    mapUrl: 'https://maps.google.com/?q=37.280833,49.585278',
    latitude: 37.280833,
    longitude: 49.585278,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-5',
    name: 'دکتر نوید احمدی',
    specialty: 'جراح ارتوپد حیوانات',
    phone: '071-36224455',
    address: 'شیراز، بلوار ستارخان، ساختمان مهر، طبقه دوم',
    province: 'فارس',
    city: 'شیراز',
    description: 'متخصص جراحی ارتوپدی و فیزیوتراپی برای حیوانات آسیب دیده.',
    mapUrl: 'https://maps.google.com/?q=29.591768,52.583698',
    latitude: 29.591768,
    longitude: 52.583698,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-6',
    name: 'دکتر مهسا توکلی',
    specialty: 'متخصص قلب و عروق حیوانات',
    phone: '051-38552233',
    address: 'مشهد، بلوار ساجدی، روبروی پارک ملت، پلاک ۲۷',
    province: 'خراسان رضوی',
    city: 'مشهد',
    description: 'کنترل بیماری‌های قلبی و ارائه برنامه‌های مراقبتی ویژه.',
    mapUrl: 'https://maps.google.com/?q=36.298824,59.605743',
    latitude: 36.298824,
    longitude: 59.605743,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-7',
    name: 'دکتر حمیدرضا کرمی',
    specialty: 'اورژانس و مراقبت ویژه',
    phone: '061-34456677',
    address: 'اهواز، کیانپارس، خیابان ۲۴ شرقی، پلاک ۱۸',
    province: 'خوزستان',
    city: 'اهواز',
    description: 'پوشش ۲۴ ساعته برای بیماران اورژانسی و خدمات بستری.',
    mapUrl: 'https://maps.google.com/?q=31.318327,48.670618',
    latitude: 31.318327,
    longitude: 48.670618,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-8',
    name: 'دکتر سارا صادقی',
    specialty: 'متخصص دندانپزشکی حیوانات',
    phone: '041-35551122',
    address: 'تبریز، خیابان آزادی، جنب پارک ائل گلی، پلاک ۹۲',
    province: 'آذربایجان شرقی',
    city: 'تبریز',
    description: 'خدمات کامل جرم‌گیری، جراحی فک و مراقبت‌های دهان و دندان.',
    mapUrl: 'https://maps.google.com/?q=38.066667,46.299999',
    latitude: 38.066667,
    longitude: 46.299999,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'd-9',
    name: 'دکتر نازنین فرهمند',
    specialty: 'پزشک عمومی حیوانات خانگی',
    phone: '011-33221144',
    address: 'ساری، بلوار خزر، نبش خیابان گلستان، پلاک ۷۵',
    province: 'مازندران',
    city: 'ساری',
    description: 'ویزیت دوره‌ای، واکسیناسیون و تغذیه تخصصی برای حیوانات خانگی.',
    mapUrl: 'https://maps.google.com/?q=36.563322,53.060097',
    latitude: 36.563322,
    longitude: 53.060097,
    photo: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

let doctors: Doctor[] = loadJsonFile<Doctor[]>(DOCTORS_FILE, defaultDoctors)

function refreshDoctors() {
  doctors = loadJsonFile<Doctor[]>(DOCTORS_FILE, defaultDoctors)
}

function persistDoctors() {
  saveJsonFile(DOCTORS_FILE, doctors)
}

export function getAllDoctors(filter?: DoctorFilter): Doctor[] {
  refreshDoctors()
  let result = [...doctors]

  if (filter?.province) {
    result = result.filter((doctor) => doctor.province === filter.province)
  }

  if (filter?.city) {
    result = result.filter((doctor) => doctor.city === filter.city)
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getDoctorById(id: string): Doctor | undefined {
  refreshDoctors()
  return doctors.find((doctor) => doctor.id === id)
}

export function createDoctor(payload: DoctorInput): Doctor {
  refreshDoctors()
  const now = new Date().toISOString()
  const newDoctor: Doctor = {
    id: `doc-${Date.now()}`,
    ...payload,
    createdAt: now,
    updatedAt: now,
  }

  doctors.push(newDoctor)
  persistDoctors()
  return newDoctor
}

export function updateDoctor(id: string, payload: Partial<DoctorInput>): Doctor | null {
  refreshDoctors()
  const index = doctors.findIndex((doctor) => doctor.id === id)
  if (index === -1) {
    return null
  }

  const updatedDoctor: Doctor = {
    ...doctors[index],
    ...payload,
    updatedAt: new Date().toISOString(),
  }

  doctors[index] = updatedDoctor
  persistDoctors()
  return updatedDoctor
}

export function deleteDoctor(id: string): boolean {
  refreshDoctors()
  const index = doctors.findIndex((doctor) => doctor.id === id)
  if (index === -1) {
    return false
  }

  doctors.splice(index, 1)
  persistDoctors()
  return true
}

