import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { User, UserRole } from './types'

// The signed-in user returned by POST /api/auth/login, remembered in localStorage.
// Note: the API itself does not check who is calling yet (no tokens), so this only
// controls what the UI shows.

const STORAGE_KEY = 'dormisync.user'

interface Session {
  user: User | null
  signIn: (user: User) => void
  signOut: () => void
}

const SessionContext = createContext<Session | null>(null)

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser)

  const signIn = useCallback((u: User) => {
    setUser(u)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside <SessionProvider>')
  return session
}

/** For pages behind the route guard, where a user is always present. */
export function useCurrentUser(): User {
  const { user } = useSession()
  if (!user) throw new Error('No user is signed in')
  return user
}

export function homeFor(role: UserRole): string {
  return role === 'TENANT' ? '/rooms/available' : '/dashboard'
}

export function loginPathFor(role: UserRole): string {
  return role === 'TENANT' ? '/login' : '/admin'
}
