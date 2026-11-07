import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { Card, ErrorBox, Field, ListState, Loading, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { addMonths, date, fullName, isoDate, money } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import type { Lease, LeaseStatus, Reservation } from '../../types'

type Filter = 'ALL' | LeaseStatus
const FILTERS: Filter[] = ['ALL', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']

export function LeasesPage() {
  const leases = useLoad(() => api.leases.list())
  const reservations = useLoad(() => api.reservations.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('ALL')

  const counts: Partial<Record<Filter, number>> = { ALL: leases.data?.length ?? 0 }
  for (const l of leases.data ?? []) counts[l.status] = (counts[l.status] ?? 0) + 1

  // Approved reservations that don't have a lease yet.
  const awaiting = (reservations.data ?? []).filter(
    (r) => r.status === 'APPROVED' && !(leases.data ?? []).some((l) => l.reservation?.id === r.id),
  )

  const reloadAll = () => Promise.all([leases.reload(), reservations.reload()])

  const activate = async (l: Lease) => {
    if (await run(() => api.leases.activate(l.id), `Lease activated. ${fullName(l.tenant)} is now an occupant of room ${l.room.roomNumber}.`))
      await reloadAll()
  }

  const terminate = async (l: Lease) => {
    if (!window.confirm(`Terminate ${fullName(l.tenant)}'s lease for room ${l.room.roomNumber}?`)) return
    if (await run(() => api.leases.terminate(l.id), 'Lease terminated.')) await reloadAll()
  }

  return (
    <>
      <PageHeader title="Leases" subtitle="Turn approved reservations into leases, then activate them when the tenant moves in." />

      <Card title="Approved reservations waiting for a lease">
        {reservations.loading && !reservations.data ? (
          <Loading />
        ) : reservations.error ? (
          <ErrorBox message={reservations.error} onRetry={() => void reservations.reload()} />
        ) : awaiting.length === 0 ? (
          <p className="muted">None right now.</p>
        ) : (
          <div className="stack">
            {awaiting.map((r) => (
              <CreateLeaseRow key={r.id} reservation={r} onCreated={() => void reloadAll()} />
            ))}
          </div>
        )}
      </Card>

      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={leases} empty="No leases yet.">
        {(list) => {
          const shown = list.filter((l) => filter === 'ALL' || l.status === filter).sort((a, b) => b.id - a.id)
          if (shown.length === 0) return <p className="muted state">Nothing here.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room</th>
                    <th>Period</th>
                    <th className="num">Monthly rent</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{fullName(l.tenant)}</strong>
                        <div className="muted small">{l.tenant.email}</div>
                      </td>
                      <td>Room {l.room.roomNumber}</td>
                      <td>
                        {date(l.startDate)} – {date(l.endDate)}
                      </td>
                      <td className="num">{money(l.monthlyRent)}</td>
                      <td>
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="actions">
                        {l.status === 'PENDING' && (
                          <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void activate(l)}>
                            Activate (move in)
                          </button>
                        )}
                        {(l.status === 'ACTIVE' || l.status === 'PENDING') && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void terminate(l)}>
                            Terminate
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

function CreateLeaseRow({ reservation, onCreated }: { reservation: Reservation; onCreated: () => void }) {
  const { run, busy } = useAction()
  const [start, setStart] = useState(isoDate())
  const [end, setEnd] = useState(addMonths(isoDate(), 6))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(
      () => api.leases.create({ reservationId: reservation.id, startDate: start, endDate: end || undefined }),
      `Lease created for ${fullName(reservation.tenant)}.`,
    )
    if (ok) onCreated()
  }

  return (
    <form className="lease-row" onSubmit={(e) => void submit(e)}>
      <div className="lease-row-who">
        <strong>{fullName(reservation.tenant)}</strong>
        <div className="muted small">
          Room {reservation.room.roomNumber} · {money(reservation.room.monthlyRate)}/month
        </div>
      </div>
      <Field label="Start date">
        <input required type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </Field>
      <Field label="End date">
        <input type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        Create lease
      </button>
    </form>
  )
}
