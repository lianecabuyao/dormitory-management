import { useState } from 'react'
import { api } from '../../api'
import { ListState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { dateTime, fullName, money } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import type { Payment, PaymentStatus } from '../../types'

type Filter = 'ALL' | PaymentStatus
const FILTERS: Filter[] = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'ALL']

export function PaymentsPage() {
  const payments = useLoad(() => api.payments.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('PENDING')

  const counts: Partial<Record<Filter, number>> = { ALL: payments.data?.length ?? 0 }
  for (const p of payments.data ?? []) counts[p.status] = (counts[p.status] ?? 0) + 1

  const confirm = async (p: Payment) => {
    if (await run(() => api.payments.confirm(p.id), `Payment of ${money(p.amount)} confirmed.`)) await payments.reload()
  }

  const fail = async (p: Payment) => {
    if (!window.confirm(`Mark ${fullName(p.tenant)}'s payment of ${money(p.amount)} as failed?`)) return
    if (await run(() => api.payments.fail(p.id), 'Payment marked as failed.')) await payments.reload()
  }

  return (
    <>
      <PageHeader title="Payments" subtitle="Check submitted rent payments against your records, then confirm them." />
      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={payments} empty="No payments yet.">
        {(list) => {
          const shown = list.filter((p) => filter === 'ALL' || p.status === filter).sort((a, b) => b.id - a.id)
          if (shown.length === 0) return <p className="muted state">Nothing here.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room</th>
                    <th className="num">Amount</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{fullName(p.tenant)}</strong>
                      </td>
                      <td>Room {p.lease.room.roomNumber}</td>
                      <td className="num">{money(p.amount)}</td>
                      <td>{p.paymentMethod ?? '—'}</td>
                      <td className="mono">{p.referenceNumber ?? '—'}</td>
                      <td>{dateTime(p.paymentDate)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="actions">
                        {p.status === 'PENDING' && (
                          <>
                            <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void confirm(p)}>
                              Confirm
                            </button>
                            <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void fail(p)}>
                              Mark failed
                            </button>
                          </>
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
