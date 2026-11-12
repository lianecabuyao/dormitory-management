const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })

export function money(value: number | null | undefined): string {
  return value == null ? '—' : peso.format(value)
}

function parse(value: string): Date {
  // Plain dates ("2026-11-07") would be read as UTC midnight; treat them as local.
  return new Date(value.length === 10 ? `${value}T00:00:00` : value)
}

export function date(value: string | null | undefined): string {
  if (!value) return '—'
  const d = parse(value)
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = parse(value)
  return isNaN(d.getTime())
    ? value
    : d.toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Local date as yyyy-mm-dd, the format Spring expects for LocalDate. */
export function isoDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function addMonths(iso: string, months: number): string {
  const d = parse(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  // Jan 31 + 1 month = Feb 28/29 (like Java's plusMonths), not Mar 3.
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return isoDate(d)
}

export function fullName(u: { firstName: string; lastName: string }): string {
  return `${u.firstName} ${u.lastName}`
}

/** IN_PROGRESS -> "In progress" */
export function label(value: string): string {
  const s = value.replace(/_/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** "Month 2 · Dec 12 – Jan 11, 2027" */
export function billLabel(b: { monthNumber: number; periodStart: string; periodEnd: string }): string {
  return `Month ${b.monthNumber} · ${date(b.periodStart)} – ${date(b.periodEnd)}`
}

/** How many monthly bills a lease from `start` to `end` gets (matches the backend). */
export function monthsBetween(start: string, end: string): number {
  if (!start || !end || end <= start) return 0
  let n = 0
  while (n === 0 || addMonths(start, n) < end) n++
  return n
}
