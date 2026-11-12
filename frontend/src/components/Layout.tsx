import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { fullName, label } from '../format'
import { loginPathFor, useCurrentUser, useSession } from '../session'
import type { UserRole } from '../types'

interface NavItem {
  to: string
  text: string
}

const NAV: Record<UserRole, NavItem[]> = {
  TENANT: [
    { to: '/rooms/available', text: 'Find a room' },
    { to: '/my/reservations', text: 'My reservations' },
    { to: '/my/leases', text: 'My lease' },
    { to: '/my/payments', text: 'My payments' },
    { to: '/my/maintenance', text: 'Maintenance' },
  ],
  ADMIN: [
    { to: '/dashboard', text: 'Dashboard' },
    { to: '/reservations', text: 'Reservations' },
    { to: '/leases', text: 'Leases' },
    { to: '/rooms', text: 'Rooms' },
    { to: '/users', text: 'Users' },
    { to: '/payments', text: 'Payments' },
    { to: '/billing', text: 'Billing' },
    { to: '/maintenance', text: 'Maintenance' },
  ],
  LANDLORD: [
    { to: '/dashboard', text: 'Dashboard' },
    { to: '/rooms', text: 'Rooms' },
    { to: '/leases', text: 'Leases' },
    { to: '/payments', text: 'Payments' },
    { to: '/billing', text: 'Billing' },
    { to: '/maintenance', text: 'Maintenance' },
  ],
}

export function Layout() {
  const user = useCurrentUser()
  const { signOut } = useSession()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span className="brand-name">DormiSync</span>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.text}
            </NavLink>
          ))}
        </nav>

        <div className="who">
          <div className="who-name">{fullName(user)}</div>
          <div className="who-role">{label(user.role)}</div>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => {
              const loginPath = loginPathFor(user.role)
              signOut()
              navigate(loginPath)
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
