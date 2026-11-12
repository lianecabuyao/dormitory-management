import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { PhotoGallery, RoomCover } from '../../components/RoomPhotos'
import { BillBadge, Field, ListState, Notice, PageHeader, StatusBadge } from '../../components/ui'
import { billLabel, date, money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Bill, Lease } from '../../types'

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank transfer', 'Card']

export function MyLeasesPage() {
  const user = useCurrentUser()
  const state = useLoad(async () => {
    const [leases, bills] = await Promise.all([api.leases.byTenant(user.id), api.bills.byTenant(user.id)])
    return leases
      .sort((a, b) => b.id - a.id)
      .map((lease) => ({
        lease,
        bills: bills.filter((b) => b.lease.id === lease.id).sort((a, b) => a.monthNumber - b.monthNumber),
      }))
  }, [user.id])

  return (
    <>
      <PageHeader title="My lease" subtitle="Your room, lease period and monthly rent." />
      <ListState state={state} empty="You don't have a lease yet. Once your reservation is approved, the landlord will prepare one.">
        {(list) => (
          <div className="stack">
            {list.map(({ lease, bills }) => (
              <LeaseCard key={lease.id} lease={lease} bills={bills} onChange={() => void state.reload()} />
            ))}
          </div>
        )}
      </ListState>
    </>
  )
}

function LeaseCard({ lease, bills, onChange }: { lease: Lease; bills: Bill[]; onChange: () => void }) {
  const [paying, setPaying] = useState<Bill | null>(null)
  const [viewing, setViewing] = useState(false)

  // Months are paid in order: only the earliest unpaid month has a Pay button.
  const nextToPay = bills.find((b) => b.status === 'UNPAID')
  const paid = bills.filter((b) => b.status === 'PAID').length
  const billed = bills.filter((b) => b.status !== 'CANCELLED').length
  const overdue = bills.filter((b) => b.overdue)
  const first = bills[0]

  return (
    <section className="card">
      <div className="card-head">
        <h2>
          Room {lease.room.roomNumber} <span className="muted">· {lease.room.type}</span>
        </h2>
        <StatusBadge status={lease.status} />
      </div>

      {lease.room.coverPhotoUrl && (
        <RoomCover room={lease.room} className="room-cover lease-cover" onOpen={() => setViewing(true)} />
      )}
      {viewing && <PhotoGallery room={lease.room} onClose={() => setViewing(false)} />}

      <dl className="facts">
        <div>
          <dt>Monthly rent</dt>
          <dd>{money(lease.monthlyRent)}</dd>
        </div>
        <div>
          <dt>Start</dt>
          <dd>{date(lease.startDate)}</dd>
        </div>
        <div>
          <dt>End</dt>
          <dd>{date(lease.endDate)}</dd>
        </div>
        {billed > 0 && (
          <div>
            <dt>Months paid</dt>
            <dd>
              {paid} of {billed}
            </dd>
          </div>
        )}
      </dl>

      {lease.status === 'PENDING' && first && <MoveInNotice first={first} />}
      {overdue.length > 0 && (
        <Notice tone="red">
          You have <strong>{overdue.length}</strong> overdue {overdue.length === 1 ? 'month' : 'months'} (
          {money(overdue.reduce((s, b) => s + b.amount, 0))}). Please pay as soon as possible.
        </Notice>
      )}

      {paying && (
        <PaymentForm
          bill={paying}
          onCancel={() => setPaying(null)}
          onDone={() => {
            setPaying(null)
            onChange()
          }}
        />
      )}

      {bills.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Due</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id}>
                  <td>{billLabel(b)}</td>
                  <td>{date(b.dueDate)}</td>
                  <td className="num">{money(b.amount)}</td>
                  <td>
                    <BillBadge bill={b} />
                  </td>
                  <td className="actions">
                    {b.id === nextToPay?.id && !paying && (
                      <button type="button" className="btn btn-small btn-primary" onClick={() => setPaying(b)}>
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

/** Explains what the tenant still has to do before they can move in. */
function MoveInNotice({ first }: { first: Bill }) {
  if (first.status === 'PAID') {
    return (
      <Notice tone="green">
        Your first month is paid. The landlord will activate your lease on your move-in day.
      </Notice>
    )
  }
  if (first.status === 'PENDING') {
    return (
      <Notice tone="amber">
        Your first payment is <strong>waiting for confirmation</strong>. Once the landlord confirms it, they can move you in.
      </Notice>
    )
  }
  return (
    <Notice tone="blue">
      <strong>Pay your first month ({money(first.amount)}, due {date(first.dueDate)})</strong> so the landlord can move you
      in.
    </Notice>
  )
}

function PaymentForm({ bill, onCancel, onDone }: { bill: Bill; onCancel: () => void; onDone: () => void }) {
  const { run, busy } = useAction()
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [reference, setReference] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(
      () =>
        api.payments.create({
          billId: bill.id,
          paymentMethod: method,
          referenceNumber: reference.trim() || undefined,
        }),
      'Payment submitted. It will show as awaiting confirmation until the landlord confirms it.',
    )
    if (ok) onDone()
  }

  return (
    <form className="bill-pay" onSubmit={(e) => void submit(e)}>
      <h3>
        Pay {billLabel(bill)}: {money(bill.amount)}
      </h3>
      <div className="form-grid">
        <Field label="Payment method">
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Reference number" hint={method === 'Cash' ? 'Optional for cash payments' : 'From your receipt or app'}>
          <input value={reference} onChange={(e) => setReference(e.target.value)} required={method !== 'Cash'} />
        </Field>
      </div>
      <div className="row-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Submitting…' : `Submit ${money(bill.amount)} payment`}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
