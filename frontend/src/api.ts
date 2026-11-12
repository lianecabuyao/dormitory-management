import type {
  Bill,
  Lease,
  LeaseRequest,
  MaintenanceRequest,
  MaintenanceRequestInput,
  NewUser,
  Payment,
  PaymentRequest,
  Portal,
  Reservation,
  Room,
  RoomInput,
  RoomPhoto,
  User,
  UserRole,
} from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const SERVER_DOWN = 'Cannot reach the server. Make sure the backend is running on port 8080.'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      // FormData (file uploads) sets its own multipart Content-Type.
      headers: body === undefined || body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, SERVER_DOWN)
  }

  const text = await res.text()
  let data: unknown
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) {
      message = data.message
    } else if (!text && res.status >= 500) {
      // The Vite dev proxy answers with an empty 500 when the backend is down.
      message = SERVER_DOWN
    }
    throw new ApiError(res.status, message)
  }

  return data as T
}

const get = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body)
const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, body)
const del = (path: string) => request<void>('DELETE', path)

export const api = {
  auth: {
    login: (email: string, password: string, portal: Portal) => post<User>('/auth/login', { email, password, portal }),
    /** Public tenant sign-up; the backend always assigns the TENANT role. */
    register: (user: Omit<NewUser, 'role'>) => post<User>('/auth/register', user),
  },
  users: {
    list: () => get<User[]>('/users'),
    byRole: (role: UserRole) => get<User[]>(`/users/role/${role}`),
    create: (user: NewUser) => post<User>('/users', user),
    remove: (id: number) => del(`/users/${id}`),
  },
  rooms: {
    list: () => get<Room[]>('/rooms'),
    available: () => get<Room[]>('/rooms/available'),
    create: (room: RoomInput) => post<Room>('/rooms', room),
    update: (id: number, room: RoomInput) => put<Room>(`/rooms/${id}`, room),
    remove: (id: number) => del(`/rooms/${id}`),
    photos: (roomId: number) => get<RoomPhoto[]>(`/rooms/${roomId}/photos`),
    uploadPhotos: (roomId: number, files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return post<RoomPhoto[]>(`/rooms/${roomId}/photos`, form)
    },
    setCoverPhoto: (roomId: number, photoId: number) => put<RoomPhoto[]>(`/rooms/${roomId}/photos/${photoId}/cover`),
    removePhoto: (roomId: number, photoId: number) => request<RoomPhoto[]>('DELETE', `/rooms/${roomId}/photos/${photoId}`),
  },
  reservations: {
    list: () => get<Reservation[]>('/reservations'),
    byTenant: (tenantId: number) => get<Reservation[]>(`/reservations/tenant/${tenantId}`),
    create: (tenantId: number, roomId: number) => post<Reservation>('/reservations', { tenantId, roomId }),
    approve: (id: number) => put<Reservation>(`/reservations/${id}/approve`),
    reject: (id: number) => put<Reservation>(`/reservations/${id}/reject`),
    cancel: (id: number) => put<Reservation>(`/reservations/${id}/cancel`),
  },
  bills: {
    list: () => get<Bill[]>('/bills'),
    byLease: (leaseId: number) => get<Bill[]>(`/bills/lease/${leaseId}`),
    byTenant: (tenantId: number) => get<Bill[]>(`/bills/tenant/${tenantId}`),
  },
  leases: {
    list: () => get<Lease[]>('/lease'),
    byTenant: (tenantId: number) => get<Lease[]>(`/lease/tenant/${tenantId}`),
    create: (req: LeaseRequest) => post<Lease>('/lease', req),
    activate: (id: number) => put<Lease>(`/lease/${id}/activate`),
    terminate: (id: number) => put<Lease>(`/lease/${id}/terminate`),
  },
  payments: {
    list: () => get<Payment[]>('/payments'),
    byTenant: (tenantId: number) => get<Payment[]>(`/payments/tenant/${tenantId}`),
    create: (req: PaymentRequest) => post<Payment>('/payments', req),
    confirm: (id: number) => put<Payment>(`/payments/${id}/confirm`),
    fail: (id: number) => put<Payment>(`/payments/${id}/fail`),
  },
  maintenance: {
    list: () => get<MaintenanceRequest[]>('/maintenance'),
    byTenant: (tenantId: number) => get<MaintenanceRequest[]>(`/maintenance/tenant/${tenantId}`),
    create: (req: MaintenanceRequestInput) => post<MaintenanceRequest>('/maintenance', req),
    start: (id: number) => put<MaintenanceRequest>(`/maintenance/${id}/start`),
    resolve: (id: number) => put<MaintenanceRequest>(`/maintenance/${id}/resolve`),
    cancel: (id: number) => put<MaintenanceRequest>(`/maintenance/${id}/cancel`),
  },
}
