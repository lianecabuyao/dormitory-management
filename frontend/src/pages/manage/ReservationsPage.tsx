import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { ListState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { dateTime, fullName, money } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import type { Reservation, ReservationStatus } from '../../types'

type Filter = 'ALL' | ReservationStatus
const FILTERS: Filter[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL']

export function ReservationsPage() {
  const reservations = useLoad(() => api.reservations.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('PENDING')

  const counts: Partial<Record<Filter, number>> = { ALL: reservations.data?.length ?? 0 }
  for (const r of reservations.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1

  const act = async (r: Reservation, action: 'approve' | 'reject' | 'cancel') => {
    if (action !== 'approve' && !window.confirm(`${action === 'reject' ? 'Reject' : 'Cancel'} ${fullName(r.tenant)}'s reservation?`)) return
    const done = { approve: 'approved', reject: 'rejected', cancel: 'cancelled' }[action]
    if (await run(() => api.reservations[action](r.id), `Reservation ${done}.`)) await reservations.reload()
  }

  return (
    <>
      <PageHeader
        title="Reservations"
        subtitle="Review room requests from tenants. After approving, create the lease on the Leases page."
        actions={
          <Link to="/leases" className="btn">
            Go to leases
          </Link>
        }
      />

      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={reservations} empty="No reservations yet.">
        {(list) => {
          const shown = list.filter((r) => filter === 'ALL' || r.status === filter).sort((a, b) => b.id - a.id)
          if (shown.length === 0) return <p className="muted state">Nothing here.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room</th>
                    <th>Requested</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{fullName(r.tenant)}</strong>
                        <div className="muted small">{r.tenant.email}</div>
                      </td>
                      <td>
                        Room {r.room.roomNumber}
                        <div className="muted small">
                          {r.room.type} · {money(r.room.monthlyRate)} · {r.room.currentOccupants}/{r.room.capacity} occupied
                        </div>
                      </td>
                      <td>{dateTime(r.reservationDate)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="actions">
                        {r.status === 'PENDING' && (
                          <>
                            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act(r, 'approve')}>
                              Approve
                            </button>
                            <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act(r, 'reject')}>
                              Reject
                            </button>
                          </>
                        )}
                        {r.status === 'APPROVED' && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void act(r, 'cancel')}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }}
      </ListState>
    </>
  )
}
