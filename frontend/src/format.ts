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
  d.setMonth(d.getMonth() + months)
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
