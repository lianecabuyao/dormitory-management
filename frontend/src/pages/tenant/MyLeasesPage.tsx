import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { Field, ListState, PageHeader, StatusBadge } from '../../components/ui'
import { date, money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Lease } from '../../types'

const PAYMENT_METHODS = ['Cash', 'GCash', 'Maya', 'Bank transfer', 'Card']

export function MyLeasesPage() {
  const user = useCurrentUser()
  const leases = useLoad(() => api.leases.byTenant(user.id), [user.id])

  return (
    <>
      <PageHeader title="My lease" subtitle="Your room assignment, rent and lease period." />
      <ListState state={leases} empty="You don't have a lease yet. Once your reservation is approved, the landlord will prepare one.">
        {(list) => (
          <div className="stack">
            {[...list]
              .sort((a, b) => b.id - a.id)
              .map((lease) => (
                <LeaseCard key={lease.id} lease={lease} />
              ))}
          </div>
        )}
      </ListState>
    </>
  )
}

function LeaseCard({ lease }: { lease: Lease }) {
  const [paying, setPaying] = useState(false)
  const canPay = lease.status === 'ACTIVE' || lease.status === 'PENDING'

  return (
    <section className="card">
      <div className="card-head">
        <h2>
          Room {lease.room.roomNumber} <span className="muted">· {lease.room.type}</span>
        </h2>
        <StatusBadge status={lease.status} />
      </div>
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
      </dl>
      {canPay && !paying && (
        <button type="button" className="btn btn-primary" onClick={() => setPaying(true)}>
          Pay rent
        </button>
      )}
      {canPay && paying && <PaymentForm lease={lease} onDone={() => setPaying(false)} />}
    </section>
  )
}

function PaymentForm({ lease, onDone }: { lease: Lease; onDone: () => void }) {
  const { run, busy } = useAction()
  const [amount, setAmount] = useState(String(lease.monthlyRent))
  const [method, setMethod] = useState(PAYMENT_METHODS[0])
  const [reference, setReference] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(
      () =>
        api.payments.create({
          leaseId: lease.id,
          amount: Number(amount),
          paymentMethod: method,
          referenceNumber: reference.trim() || undefined,
        }),
      'Payment submitted. It will show as pending until the landlord confirms it.',
    )
    if (ok) onDone()
  }

  return (
    <form className="inline-form" onSubmit={(e) => void submit(e)}>
      <div className="form-grid">
        <Field label="Amount (₱)">
          <input required type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
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
          {busy ? 'Submitting…' : 'Submit payment'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}
