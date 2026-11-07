import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { ErrorBox, Loading, PageHeader, StatusBadge } from '../components/ui'
import { dateTime, fullName, label, money } from '../format'
import { useLoad } from '../hooks'
import { SAMPLE_ACCOUNTS, seedSampleData } from '../seed'
import { useCurrentUser } from '../session'
import { useAction } from '../toast'

/** Lets an admin fill an empty dormitory with sample rooms and accounts for testing. */
function SampleDataCard({ onLoaded }: { onLoaded: () => void }) {
  const { run, busy } = useAction()
  const [loaded, setLoaded] = useState(false)

  const load = async () => {
    if (await run(seedSampleData, 'Sample data loaded.')) {
      setLoaded(true)
      onLoaded()
    }
  }

  if (loaded) {
    return (
      <section className="card">
        <div className="card-head">
          <h2>Sample accounts</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Password</th>
                <th>Signs in at</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ACCOUNTS.map((a) => (
                <tr key={a.email}>
                  <td>{a.name}</td>
                  <td>{label(a.role)}</td>
                  <td className="mono">{a.email}</td>
                  <td className="mono">{a.password}</td>
                  <td className="mono">{a.signInAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <section className="card setup-card">
      <h2>No rooms yet</h2>
      <p className="muted">
        Add rooms on the Rooms page, or load sample data (5 rooms, 1 landlord, 2 tenants) to try the app.
      </p>
      <div className="row-actions">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void load()}>
          {busy ? 'Loading…' : 'Load sample data'}
        </button>
        <Link to="/rooms" className="btn">
          Add rooms
        </Link>
      </div>
    </section>
  )
}

export function DashboardPage() {
  const user = useCurrentUser()
  const [sampleLoaded, setSampleLoaded] = useState(false)
  const state = useLoad(async () => {
    const [rooms, reservations, leases, payments, maintenance] = await Promise.all([
      api.rooms.list(),
      api.reservations.list(),
      api.leases.list(),
      api.payments.list(),
      api.maintenance.list(),
    ])
    return { rooms, reservations, leases, payments, maintenance }
  })

  if (state.loading && !state.data) return <Loading />
  if (state.error || !state.data) return <ErrorBox message={state.error ?? 'No data'} onRetry={() => void state.reload()} />

  const { rooms, reservations, leases, payments, maintenance } = state.data
  const beds = rooms.reduce((s, r) => s + r.capacity, 0)
  const occupied = rooms.reduce((s, r) => s + r.currentOccupants, 0)
  const pendingReservations = reservations.filter((r) => r.status === 'PENDING')
  const approvedWithoutLease = reservations.filter(
    (r) => r.status === 'APPROVED' && !leases.some((l) => l.reservation?.id === r.id),
  )
  const pendingPayments = payments.filter((p) => p.status === 'PENDING')
  const openMaintenance = maintenance.filter((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
  const collected = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const isAdmin = user.role === 'ADMIN'
  // Keep the card visible after loading so the sample logins stay on screen.
  const showSample = isAdmin && (rooms.length === 0 || sampleLoaded)

  const tiles = [
    { label: 'Rooms available', value: `${rooms.filter((r) => r.status === 'AVAILABLE').length} / ${rooms.length}`, to: '/rooms' },
    { label: 'Beds occupied', value: `${occupied} / ${beds}`, to: '/rooms' },
    { label: 'Active leases', value: leases.filter((l) => l.status === 'ACTIVE').length, to: '/leases' },
    { label: 'Rent collected', value: money(collected), to: '/payments' },
  ]

  const todo = [
    isAdmin && { count: pendingReservations.length, text: 'reservations waiting for approval', to: '/reservations' },
    { count: approvedWithoutLease.length, text: 'approved reservations need a lease', to: '/leases' },
    { count: leases.filter((l) => l.status === 'PENDING').length, text: 'leases waiting to be activated', to: '/leases' },
    { count: pendingPayments.length, text: 'payments to confirm', to: '/payments' },
    { count: openMaintenance.length, text: 'open maintenance requests', to: '/maintenance' },
  ].filter((t): t is { count: number; text: string; to: string } => Boolean(t))

  return (
    <>
      <PageHeader title={`Good day, ${user.firstName}`} subtitle="Here's what's happening in the dormitory." />

      {showSample && (
        <SampleDataCard
          onLoaded={() => {
            setSampleLoaded(true)
            void state.reload()
          }}
        />
      )}

      <div className="tiles">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="tile">
            <span className="tile-label">{t.label}</span>
            <span className="tile-value">{t.value}</span>
          </Link>
        ))}
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h2>Needs attention</h2>
          </div>
          <ul className="todo">
            {todo.map((t) => (
              <li key={t.text} className={t.count === 0 ? 'done' : ''}>
                <Link to={t.to}>
                  <span className="todo-count">{t.count}</span>
                  {t.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Latest maintenance</h2>
            <Link to="/maintenance" className="small">
              View all
            </Link>
          </div>
          {openMaintenance.length === 0 ? (
            <p className="muted">No open requests.</p>
          ) : (
            <ul className="mini-list">
              {[...openMaintenance]
                .sort((a, b) => b.id - a.id)
                .slice(0, 5)
                .map((m) => (
                  <li key={m.id}>
                    <div>
                      <strong>{m.title}</strong>
                      <div className="muted small">
                        Room {m.room.roomNumber} · {fullName(m.tenant)} · {dateTime(m.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
