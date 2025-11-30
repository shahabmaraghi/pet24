import { type Collection, WithId } from 'mongodb'
import { loadJsonFile, saveJsonFile } from './storage'
import { getDb, mongoEnabled } from './mongodb'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export interface ReservationInput {
  doctorId: string
  doctorName: string
  patientName: string
  phone: string
  preferredDate: string
  preferredTime?: string
  note?: string
}

export interface Reservation extends ReservationInput {
  id: string
  status: ReservationStatus
  createdAt: string
}

type ReservationFilter = {
  doctorId?: string
}

type ReservationDocument = Omit<Reservation, 'id'> & { _id: string }

const RESERVATIONS_FILE = 'reservations.json'
let reservationCache: Reservation[] = loadJsonFile<Reservation[]>(RESERVATIONS_FILE, [])

function refreshReservationsFromJson() {
  reservationCache = loadJsonFile<Reservation[]>(RESERVATIONS_FILE, [])
}

function persistReservationsToJson() {
  saveJsonFile(RESERVATIONS_FILE, reservationCache)
}

function createReservationInJson(payload: ReservationInput): Reservation {
  refreshReservationsFromJson()
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...payload,
  }

  reservationCache.push(newReservation)
  persistReservationsToJson()
  return newReservation
}

function getReservationsFromJson(filter?: ReservationFilter): Reservation[] {
  refreshReservationsFromJson()
  let result = [...reservationCache]

  if (filter?.doctorId) {
    result = result.filter((reservation) => reservation.doctorId === filter.doctorId)
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

let reservationsCollectionPromise: Promise<Collection<ReservationDocument>> | null = null

async function getReservationsCollection() {
  if (!reservationsCollectionPromise) {
    reservationsCollectionPromise = (async () => {
      const db = await getDb()
      return db.collection<ReservationDocument>('reservations')
    })()
  }

  return reservationsCollectionPromise
}

function mapReservation(doc: WithId<ReservationDocument>): Reservation {
  return {
    id: doc._id,
    doctorId: doc.doctorId,
    doctorName: doc.doctorName,
    patientName: doc.patientName,
    phone: doc.phone,
    preferredDate: doc.preferredDate,
    preferredTime: doc.preferredTime,
    note: doc.note,
    status: doc.status,
    createdAt: doc.createdAt,
  }
}

export async function createReservation(payload: ReservationInput): Promise<Reservation> {
  if (!mongoEnabled) {
    return createReservationInJson(payload)
  }

  try {
    const collection = await getReservationsCollection()
    const now = new Date().toISOString()
    const doc: ReservationDocument = {
      _id: `res-${Date.now()}`,
      status: 'pending',
      createdAt: now,
      ...payload,
    }

    await collection.insertOne(doc)
    return mapReservation(doc)
  } catch (error) {
    console.error('MongoDB error creating reservation, using JSON fallback:', error)
    return createReservationInJson(payload)
  }
}

export async function getReservations(filter?: ReservationFilter): Promise<Reservation[]> {
  if (!mongoEnabled) {
    return getReservationsFromJson(filter)
  }

  try {
    const collection = await getReservationsCollection()
    const query: Record<string, string> = {}

    if (filter?.doctorId) {
      query.doctorId = filter.doctorId
    }

    const docs = await collection.find(query).sort({ createdAt: -1 }).toArray()
    return docs.map(mapReservation)
  } catch (error) {
    console.error('MongoDB error fetching reservations, using JSON fallback:', error)
    return getReservationsFromJson(filter)
  }
}

