import { Link } from 'react-router-dom'
import { api } from '../../api'
import { ListState, PageHeader, StatusBadge } from '../../components/ui'
import { dateTime, money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Lease, Reservation } from '../../types'

/** What happens next for this reservation, based on its status and its lease (if any). */
function nextStep(r: Reservation, lease: Lease | undefined): string {
  if (r.remarks) return r.remarks
  if (lease) {
    switch (lease.status) {
      case 'PENDING':
        return 'Lease prepared. Pay your first month on My lease to move in.'
      case 'ACTIVE':
        return 'You have moved in. Your lease is active.'
      case 'EXPIRED':
        return 'Your lease has ended.'
      case 'TERMINATED':
        return 'Your lease was terminated.'
    }
  }
  switch (r.status) {
    case 'PENDING':
      return 'Waiting for admin review'
    case 'APPROVED':
      return 'Approved, waiting for your lease to be prepared'
    case 'REJECTED':
      return 'Not approved'
    case 'CANCELLED':
      return 'Cancelled'
  }
}

export function MyReservationsPage() {
  const user = useCurrentUser()
  const state = useLoad(async () => {
    const [reservations, leases] = await Promise.all([api.reservations.byTenant(user.id), api.leases.byTenant(user.id)])
    return reservations
      .sort((a, b) => b.id - a.id)
      .map((reservation) => ({ reservation, lease: leases.find((l) => l.reservation?.id === reservation.id) }))
  }, [user.id])
  const { run, busy } = useAction()

  const cancel = async (id: number) => {
    if (!window.confirm('Cancel this reservation?')) return
    if (await run(() => api.reservations.cancel(id), 'Reservation cancelled.')) await state.reload()
  }

  return (
    <>
      <PageHeader title="My reservations" subtitle="Track the rooms you've asked to reserve." />
      <ListState state={state} empty="You haven't reserved a room yet.">
        {(list) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Monthly rate</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map(({ reservation: r, lease }) => (
                  <tr key={r.id}>
                    <td>
                      <strong>Room {r.room.roomNumber}</strong>
                      <div className="muted small">{r.room.type}</div>
                    </td>
                    <td>{money(r.room.monthlyRate)}</td>
                    <td>{dateTime(r.reservationDate)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                      <div className="muted small">{nextStep(r, lease)}</div>
                    </td>
                    <td className="actions">
                      {lease ? (
                        <Link to="/my/leases" className="btn btn-small">
                          View lease
                        </Link>
                      ) : (
                        (r.status === 'PENDING' || r.status === 'APPROVED') && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void cancel(r.id)}>
                            Cancel
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListState>
    </>
  )
}
