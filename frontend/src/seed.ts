import { api } from './api'
import type { NewUser, RoomInput } from './types'

// Sample landlord, tenants and rooms for trying the app. Admins load these from the
// dashboard. (The first admin account is created by the backend on startup.)

const USERS: NewUser[] = [
  { firstName: 'Ramon', lastName: 'Cruz', email: 'landlord@dormisync.local', password: 'landlord123', contactNumber: '09170000002', role: 'LANDLORD' },
  { firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@dormisync.local', password: 'tenant123', contactNumber: '09170000003', role: 'TENANT' },
  { firstName: 'Maria', lastName: 'Santos', email: 'maria@dormisync.local', password: 'tenant123', contactNumber: '09170000004', role: 'TENANT' },
]

/** Shown on the dashboard after loading sample data. */
export const SAMPLE_ACCOUNTS = USERS.map((u) => ({
  name: `${u.firstName} ${u.lastName}`,
  role: u.role,
  email: u.email,
  password: u.password,
  signInAt: u.role === 'TENANT' ? '/login' : '/admin',
}))

const ROOMS: Omit<RoomInput, 'currentOccupants' | 'status'>[] = [
  { roomNumber: '101', type: 'Single', capacity: 1, monthlyRate: 3800 },
  { roomNumber: '102', type: 'Double', capacity: 2, monthlyRate: 2900 },
  { roomNumber: '201', type: 'Quad', capacity: 4, monthlyRate: 2000 },
  { roomNumber: '202', type: 'Single', capacity: 1, monthlyRate: 4200 },
  { roomNumber: '203', type: 'Double', capacity: 2, monthlyRate: 3100 },
]

/** Creates the sample users and rooms, skipping any that already exist. */
export async function seedSampleData(): Promise<void> {
  const [users, rooms] = await Promise.all([api.users.list(), api.rooms.list()])
  const emails = new Set(users.map((u) => u.email))
  const numbers = new Set(rooms.map((r) => r.roomNumber))

  for (const u of USERS) {
    if (!emails.has(u.email)) await api.users.create(u)
  }
  for (const r of ROOMS) {
    if (!numbers.has(r.roomNumber)) await api.rooms.create({ ...r, currentOccupants: 0, status: 'AVAILABLE' })
  }
}
