import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { Card, ErrorBox, Field, ListState, Loading, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { addMonths, date, fullName, isoDate, money, monthsBetween } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import type { Bill, Lease, LeaseStatus, Reservation } from '../../types'

type Filter = 'ALL' | LeaseStatus
const FILTERS: Filter[] = ['ALL', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']

export function LeasesPage() {
  const leases = useLoad(() => api.leases.list())
  const reservations = useLoad(() => api.reservations.list())
  const bills = useLoad(() => api.bills.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('ALL')

  const counts: Partial<Record<Filter, number>> = { ALL: leases.data?.length ?? 0 }
  for (const l of leases.data ?? []) counts[l.status] = (counts[l.status] ?? 0) + 1

  // Approved reservations that don't have a lease yet.
  const awaiting = (reservations.data ?? []).filter(
    (r) => r.status === 'APPROVED' && !(leases.data ?? []).some((l) => l.reservation?.id === r.id),
  )

  const reloadAll = () => Promise.all([leases.reload(), reservations.reload(), bills.reload()])

  const billsOf = (l: Lease): Bill[] =>
    (bills.data ?? []).filter((b) => b.lease.id === l.id).sort((a, b) => a.monthNumber - b.monthNumber)

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
      <PageHeader title="Leases" subtitle="Turn approved reservations into leases. Once the tenant pays the first month, activate the lease on move-in." />

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
                    <th>Rent paid</th>
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
                        <RentProgress bills={billsOf(l)} />
                      </td>
                      <td>
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="actions">
                        {l.status === 'PENDING' &&
                          (billsOf(l)[0]?.status === 'PAID' ? (
                            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void activate(l)}>
                              Activate (move in)
                            </button>
                          ) : (
                            <span className="muted small">Waiting for first month's payment</span>
                          ))}
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

/** "2 of 6 paid", plus how many months are overdue or waiting for confirmation. */
function RentProgress({ bills }: { bills: Bill[] }) {
  const billed = bills.filter((b) => b.status !== 'CANCELLED')
  if (billed.length === 0) return <span className="muted">—</span>
  const paid = billed.filter((b) => b.status === 'PAID').length
  const overdue = billed.filter((b) => b.overdue).length
  const pending = billed.filter((b) => b.status === 'PENDING').length
  return (
    <>
      {paid} of {billed.length} paid
      {overdue > 0 && (
        <div className="small">
          <Link to="/billing" className="text-danger">
            {overdue} overdue →
          </Link>
        </div>
      )}
      {pending > 0 && (
        <div className="small">
          <Link to="/payments">{pending} to confirm →</Link>
        </div>
      )}
    </>
  )
}

const DEFAULT_LEASE_MONTHS = 6

function CreateLeaseRow({ reservation, onCreated }: { reservation: Reservation; onCreated: () => void }) {
  const { run, busy } = useAction()
  const [start, setStart] = useState(isoDate())
  const [end, setEnd] = useState(addMonths(isoDate(), DEFAULT_LEASE_MONTHS))
  const months = monthsBetween(start, end)

  const changeStart = (value: string) => {
    // Keep the lease length the same when the start date moves.
    const length = monthsBetween(start, end) || DEFAULT_LEASE_MONTHS
    setStart(value)
    if (value) setEnd(addMonths(value, length))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(
      () => api.leases.create({ reservationId: reservation.id, startDate: start, endDate: end }),
      `Lease created for ${fullName(reservation.tenant)} with ${months} monthly ${months === 1 ? 'bill' : 'bills'}.`,
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
        <input required type="date" value={start} onChange={(e) => changeStart(e.target.value)} />
      </Field>
      <Field
        label="End date"
        hint={months > 0 ? `${months} monthly ${months === 1 ? 'bill' : 'bills'} of ${money(reservation.room.monthlyRate)}` : undefined}
      >
        <input required type="date" min={addMonths(start, 1)} value={end} onChange={(e) => setEnd(e.target.value)} />
      </Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        Create lease
      </button>
    </form>
  )
}
