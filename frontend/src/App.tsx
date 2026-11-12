import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { RegisterPage } from './pages/RegisterPage'
import { SignInPage } from './pages/SignInPage'
import { BillingPage } from './pages/manage/BillingPage'
import { LeasesPage } from './pages/manage/LeasesPage'
import { MaintenancePage } from './pages/manage/MaintenancePage'
import { PaymentsPage } from './pages/manage/PaymentsPage'
import { ReservationsPage } from './pages/manage/ReservationsPage'
import { RoomsPage } from './pages/manage/RoomsPage'
import { UsersPage } from './pages/manage/UsersPage'
import { BrowseRoomsPage } from './pages/tenant/BrowseRoomsPage'
import { MyLeasesPage } from './pages/tenant/MyLeasesPage'
import { MyMaintenancePage } from './pages/tenant/MyMaintenancePage'
import { MyPaymentsPage } from './pages/tenant/MyPaymentsPage'
import { MyReservationsPage } from './pages/tenant/MyReservationsPage'
import { homeFor, SessionProvider, useSession } from './session'
import { ToastProvider } from './toast'
import type { UserRole } from './types'

/**
 * Sends signed-out visitors to the matching login page (/login for tenant pages,
 * /admin for staff pages) and signed-in users without access to their own home page.
 */
function RequireRole({ roles }: { roles: UserRole[] }) {
  const { user } = useSession()
  if (!user) return <Navigate to={roles.includes('TENANT') ? '/login' : '/admin'} replace />
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

function HomeRedirect() {
  const { user } = useSession()
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <ToastProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SignInPage portal="TENANT" />} />
            <Route path="/admin" element={<SignInPage portal="STAFF" />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route index element={<HomeRedirect />} />

            <Route element={<RequireRole roles={['TENANT']} />}>
              <Route element={<Layout />}>
                <Route path="rooms/available" element={<BrowseRoomsPage />} />
                <Route path="my/reservations" element={<MyReservationsPage />} />
                <Route path="my/leases" element={<MyLeasesPage />} />
                <Route path="my/payments" element={<MyPaymentsPage />} />
                <Route path="my/maintenance" element={<MyMaintenancePage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['ADMIN', 'LANDLORD']} />}>
              <Route element={<Layout />}>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="leases" element={<LeasesPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="maintenance" element={<MaintenancePage />} />
              </Route>
            </Route>

            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route element={<Layout />}>
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="users" element={<UsersPage />} />
              </Route>
            </Route>

            <Route path="*" element={<HomeRedirect />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ToastProvider>
  )
}
