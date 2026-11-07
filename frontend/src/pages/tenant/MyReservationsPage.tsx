import { api } from '../../api'
import { ListState, PageHeader, StatusBadge } from '../../components/ui'
import { dateTime, money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'

const NEXT_STEP: Record<string, string> = {
  PENDING: 'Waiting for admin review',
  APPROVED: 'Approved, waiting for your lease to be prepared',
  REJECTED: 'Not approved',
  CANCELLED: 'Cancelled',
}

export function MyReservationsPage() {
  const user = useCurrentUser()
  const reservations = useLoad(() => api.reservations.byTenant(user.id), [user.id])
  const { run, busy } = useAction()

  const cancel = async (id: number) => {
    if (!window.confirm('Cancel this reservation?')) return
    if (await run(() => api.reservations.cancel(id), 'Reservation cancelled.')) await reservations.reload()
  }

  return (
    <>
      <PageHeader title="My reservations" subtitle="Track the rooms you've asked to reserve." />
      <ListState state={reservations} empty="You haven't reserved a room yet.">
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
                {[...list]
                  .sort((a, b) => b.id - a.id)
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>Room {r.room.roomNumber}</strong>
                        <div className="muted small">{r.room.type}</div>
                      </td>
                      <td>{money(r.room.monthlyRate)}</td>
                      <td>{dateTime(r.reservationDate)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                        <div className="muted small">{r.remarks || NEXT_STEP[r.status]}</div>
                      </td>
                      <td className="actions">
                        {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void cancel(r.id)}>
                            Cancel
                          </button>
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
