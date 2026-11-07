import { useState } from 'react'
import { api } from '../../api'
import { ListState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { dateTime, fullName } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import type { MaintenanceRequest, MaintenanceStatus } from '../../types'

type Filter = 'OPEN' | 'ALL' | MaintenanceStatus
const FILTERS: Filter[] = ['OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED', 'ALL']

function matches(m: MaintenanceRequest, f: Filter) {
  if (f === 'ALL') return true
  if (f === 'OPEN') return m.status === 'PENDING' || m.status === 'IN_PROGRESS'
  return m.status === f
}

export function MaintenancePage() {
  const requests = useLoad(() => api.maintenance.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('OPEN')

  const list = requests.data ?? []
  const counts = Object.fromEntries(FILTERS.map((f) => [f, list.filter((m) => matches(m, f)).length])) as Record<Filter, number>

  const act = async (m: MaintenanceRequest, action: 'start' | 'resolve' | 'cancel') => {
    if (action === 'cancel' && !window.confirm(`Cancel "${m.title}"?`)) return
    const done = { start: 'Work started.', resolve: 'Marked as resolved.', cancel: 'Request cancelled.' }[action]
    if (await run(() => api.maintenance[action](m.id), done)) await requests.reload()
  }

  return (
    <>
      <PageHeader title="Maintenance" subtitle="Issues reported by tenants." />
      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={requests} empty="No maintenance requests yet.">
        {(all) => {
          const shown = all.filter((m) => matches(m, filter)).sort((a, b) => b.id - a.id)
          if (shown.length === 0) return <p className="muted state">Nothing here.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Room</th>
                    <th>Tenant</th>
                    <th>Reported</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => (
                    <tr key={m.id}>
                      <td className="issue">
                        <strong>{m.title}</strong>
                        <div className="muted small clamp">{m.description}</div>
                      </td>
                      <td>Room {m.room.roomNumber}</td>
                      <td>{fullName(m.tenant)}</td>
                      <td>
                        {dateTime(m.createdAt)}
                        {m.resolvedAt && <div className="muted small">Resolved {dateTime(m.resolvedAt)}</div>}
                      </td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="actions">
                        {m.status === 'PENDING' && (
                          <button type="button" className="btn btn-small btn-primary" disabled={busy} onClick={() => void act(m, 'start')}>
                            Start work
                          </button>
                        )}
                        {(m.status === 'PENDING' || m.status === 'IN_PROGRESS') && (
                          <>
                            <button type="button" className="btn btn-small" disabled={busy} onClick={() => void act(m, 'resolve')}>
                              Resolve
                            </button>
                            <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void act(m, 'cancel')}>
                              Cancel
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
