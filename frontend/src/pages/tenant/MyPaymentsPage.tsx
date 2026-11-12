import { Link } from 'react-router-dom'
import { api } from '../../api'
import { ListState, PageHeader, StatusBadge } from '../../components/ui'
import { billLabel, dateTime, money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'

export function MyPaymentsPage() {
  const user = useCurrentUser()
  const payments = useLoad(() => api.payments.byTenant(user.id), [user.id])

  const totalPaid = (payments.data ?? []).filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)

  return (
    <>
      <PageHeader
        title="My payments"
        subtitle={payments.data?.length ? `Total confirmed: ${money(totalPaid)}` : 'Your rent payment history.'}
        actions={
          <Link to="/my/leases" className="btn btn-primary">
            Pay rent
          </Link>
        }
      />
      <ListState state={payments} empty="No payments yet.">
        {(list) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room</th>
                  <th>For</th>
                  <th className="num">Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...list]
                  .sort((a, b) => b.id - a.id)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{dateTime(p.paymentDate)}</td>
                      <td>Room {p.lease.room.roomNumber}</td>
                      <td>{p.bill ? billLabel(p.bill) : '—'}</td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{p.paymentMethod ?? '—'}</td>
                      <td className="mono">{p.referenceNumber ?? '—'}</td>
                      <td>
                        <StatusBadge status={p.status} />
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
