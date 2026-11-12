import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { BillBadge, ListState, PageHeader, Tabs } from '../../components/ui'
import { billLabel, date, fullName, money } from '../../format'
import { useLoad } from '../../hooks'
import type { Bill } from '../../types'

type Filter = 'OVERDUE' | 'UNPAID' | 'PENDING' | 'PAID' | 'CANCELLED' | 'ALL'
const FILTERS: Filter[] = ['OVERDUE', 'UNPAID', 'PENDING', 'PAID', 'CANCELLED', 'ALL']

function matches(b: Bill, filter: Filter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'OVERDUE') return b.overdue
  return b.status === filter
}

/** Every monthly rent bill, so staff can see who owes what. */
export function BillingPage() {
  const bills = useLoad(() => api.bills.list())
  const [filter, setFilter] = useState<Filter>('OVERDUE')

  const list = bills.data ?? []
  const counts: Partial<Record<Filter, number>> = {}
  for (const f of FILTERS) counts[f] = list.filter((b) => matches(b, f)).length

  const overdueTotal = list.filter((b) => b.overdue).reduce((s, b) => s + b.amount, 0)

  return (
    <>
      <PageHeader
        title="Billing"
        subtitle={
          overdueTotal > 0
            ? `${money(overdueTotal)} in overdue rent. Bills are created automatically for each month of a lease.`
            : 'Bills are created automatically for each month of a lease.'
        }
      />
      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={bills} empty="No bills yet. They appear when you create a lease.">
        {(all) => {
          const shown = all
            .filter((b) => matches(b, filter))
            .sort((a, b) => (filter === 'PAID' ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate)))
          if (shown.length === 0) return <p className="muted state">Nothing here.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room</th>
                    <th>Month</th>
                    <th>Due</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{fullName(b.lease.tenant)}</strong>
                        <div className="muted small">{b.lease.tenant.contactNumber ?? b.lease.tenant.email}</div>
                      </td>
                      <td>Room {b.lease.room.roomNumber}</td>
                      <td>{billLabel(b)}</td>
                      <td>{date(b.dueDate)}</td>
                      <td className="num">{money(b.amount)}</td>
                      <td>
                        <BillBadge bill={b} />
                      </td>
                      <td className="actions">
                        {b.status === 'PENDING' && (
                          <Link to="/payments" className="btn btn-small">
                            Review payment
                          </Link>
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
