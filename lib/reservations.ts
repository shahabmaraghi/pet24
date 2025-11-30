import { loadJsonFile, saveJsonFile } from './storage'

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

const RESERVATIONS_FILE = 'reservations.json'

let reservations: Reservation[] = loadJsonFile<Reservation[]>(RESERVATIONS_FILE, [])

function refreshReservations() {
  reservations = loadJsonFile<Reservation[]>(RESERVATIONS_FILE, [])
}

function persistReservations() {
  saveJsonFile(RESERVATIONS_FILE, reservations)
}

export function createReservation(payload: ReservationInput): Reservation {
  refreshReservations()
  const newReservation: Reservation = {
    id: `res-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...payload,
  }

  reservations.push(newReservation)
  persistReservations()
  return newReservation
}

export function getReservations(filter?: ReservationFilter): Reservation[] {
  refreshReservations()
  let result = [...reservations]

  if (filter?.doctorId) {
    result = result.filter((reservation) => reservation.doctorId === filter.doctorId)
  }

  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

