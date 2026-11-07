// TypeScript mirrors of the Spring Boot entities, enums and request DTOs.

export type UserRole = 'TENANT' | 'ADMIN' | 'LANDLORD'
export type RoomStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE'
export type ReservationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaseStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'

/** Which login page a sign-in comes from: /login (tenants) or /admin (admins and landlords). */
export type Portal = 'TENANT' | 'STAFF'

export const USER_ROLES: UserRole[] = ['TENANT', 'ADMIN', 'LANDLORD']
export const ROOM_STATUSES: RoomStatus[] = ['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE']

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  contactNumber: string | null
  role: UserRole
}

export interface NewUser {
  firstName: string
  lastName: string
  email: string
  password: string
  contactNumber?: string
  role: UserRole
}

export interface Room {
  id: number
  roomNumber: string
  type: string
  capacity: number
  currentOccupants: number
  monthlyRate: number
  status: RoomStatus
}

export type RoomInput = Omit<Room, 'id'>

export interface Reservation {
  id: number
  tenant: User
  room: Room
  reservationDate: string
  status: ReservationStatus
  remarks: string | null
}

export interface Lease {
  id: number
  reservation: Reservation | null
  tenant: User
  room: Room
  startDate: string
  endDate: string | null
  monthlyRent: number
  status: LeaseStatus
}

export interface LeaseRequest {
  reservationId: number
  startDate: string
  endDate?: string
}

export interface Payment {
  id: number
  lease: Lease
  tenant: User
  amount: number
  paymentDate: string | null
  paymentMethod: string | null
  status: PaymentStatus
  referenceNumber: string | null
}

export interface PaymentRequest {
  leaseId: number
  amount: number
  paymentMethod: string
  referenceNumber?: string
}

export interface MaintenanceRequest {
  id: number
  tenant: User
  room: Room
  title: string
  description: string
  createdAt: string
  resolvedAt: string | null
  status: MaintenanceStatus
}

export interface MaintenanceRequestInput {
  tenantId: number
  roomId: number
  title: string
  description: string
}
