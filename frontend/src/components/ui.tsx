import type { ReactNode } from 'react'
import { label } from '../format'
import type { LoadState } from '../hooks'
import type { BillStatus } from '../types'

const TONES: Record<string, string> = {
  AVAILABLE: 'green',
  APPROVED: 'green',
  ACTIVE: 'green',
  PAID: 'green',
  RESOLVED: 'green',
  PENDING: 'amber',
  RESERVED: 'amber',
  IN_PROGRESS: 'blue',
  OCCUPIED: 'blue',
  REJECTED: 'red',
  FAILED: 'red',
  MAINTENANCE: 'red',
  CANCELLED: 'gray',
  EXPIRED: 'gray',
  TERMINATED: 'gray',
  REFUNDED: 'gray',
  TENANT: 'blue',
  ADMIN: 'violet',
  LANDLORD: 'green',
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge tone-${TONES[status] ?? 'gray'}`}>{label(status)}</span>
}

const BILL_BADGES: Record<BillStatus, { tone: string; text: string }> = {
  UNPAID: { tone: 'gray', text: 'Unpaid' },
  PENDING: { tone: 'amber', text: 'Awaiting confirmation' },
  PAID: { tone: 'green', text: 'Paid' },
  CANCELLED: { tone: 'gray', text: 'Cancelled' },
}

/** Status of a monthly bill; unpaid bills past their due date show as "Overdue". */
export function BillBadge({ bill }: { bill: { status: BillStatus; overdue: boolean } }) {
  const { tone, text } = bill.overdue ? { tone: 'red', text: 'Overdue' } : BILL_BADGES[bill.status]
  return <span className={`badge tone-${tone}`}>{text}</span>
}

/** A highlighted message box, e.g. "Pay your first month to move in." */
export function Notice({ tone = 'blue', children }: { tone?: 'blue' | 'amber' | 'green' | 'red'; children: ReactNode }) {
  return <div className={`notice tone-${tone}`}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Loading() {
  return <p className="muted state">Loading…</p>
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

/** Renders loading / error / empty states for a list, otherwise calls `children`. */
export function ListState<T>({
  state,
  empty,
  children,
}: {
  state: LoadState<T[]>
  empty: ReactNode
  children: (rows: T[]) => ReactNode
}) {
  if (state.loading && !state.data) return <Loading />
  if (state.error) return <ErrorBox message={state.error} onRetry={() => void state.reload()} />
  if (!state.data || state.data.length === 0) return <Empty>{empty}</Empty>
  return <>{children(state.data)}</>
}

export function Field({ label: text, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{text}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/** Small segmented control used to filter lists by status. */
export function Tabs<T extends string>({
  value,
  options,
  onChange,
  counts,
}: {
  value: T
  options: T[]
  onChange: (v: T) => void
  counts?: Partial<Record<T, number>>
}) {
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          aria-selected={o === value}
          className={o === value ? 'tab active' : 'tab'}
          onClick={() => onChange(o)}
        >
          {label(o)}
          {counts?.[o] != null && <span className="tab-count">{counts[o]}</span>}
        </button>
      ))}
    </div>
  )
}
