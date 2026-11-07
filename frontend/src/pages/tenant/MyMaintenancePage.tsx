import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { Card, Empty, Field, ListState, PageHeader, StatusBadge } from '../../components/ui'
import { dateTime } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Room } from '../../types'

export function MyMaintenancePage() {
  const user = useCurrentUser()
  const requests = useLoad(() => api.maintenance.byTenant(user.id), [user.id])
  const leases = useLoad(() => api.leases.byTenant(user.id), [user.id])
  const { run, busy } = useAction()

  // Tenants can report issues for rooms they currently lease.
  const myRooms: Room[] = []
  for (const l of leases.data ?? []) {
    if ((l.status === 'ACTIVE' || l.status === 'PENDING') && !myRooms.some((r) => r.id === l.room.id)) myRooms.push(l.room)
  }

  const cancel = async (id: number) => {
    if (!window.confirm('Cancel this maintenance request?')) return
    if (await run(() => api.maintenance.cancel(id), 'Request cancelled.')) await requests.reload()
  }

  return (
    <>
      <PageHeader title="Maintenance" subtitle="Report a problem in your room and follow its progress." />

      <Card title="Report an issue">
        {leases.loading && !leases.data ? (
          <p className="muted">Loading…</p>
        ) : myRooms.length === 0 ? (
          <Empty>You can report issues once you have a lease for a room.</Empty>
        ) : (
          <ReportForm rooms={myRooms} tenantId={user.id} onCreated={() => void requests.reload()} />
        )}
      </Card>

      <h2 className="section-title">My requests</h2>
      <ListState state={requests} empty="You haven't reported any issues.">
        {(list) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Room</th>
                  <th>Reported</th>
                  <th>Resolved</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...list]
                  .sort((a, b) => b.id - a.id)
                  .map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.title}</strong>
                        <div className="muted small clamp">{m.description}</div>
                      </td>
                      <td>Room {m.room.roomNumber}</td>
                      <td>{dateTime(m.createdAt)}</td>
                      <td>{dateTime(m.resolvedAt)}</td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="actions">
                        {m.status === 'PENDING' && (
                          <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void cancel(m.id)}>
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

function ReportForm({ rooms, tenantId, onCreated }: { rooms: Room[]; tenantId: number; onCreated: () => void }) {
  const { run, busy } = useAction()
  const [roomId, setRoomId] = useState(rooms[0].id)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(
      () => api.maintenance.create({ tenantId, roomId, title: title.trim(), description: description.trim() }),
      'Issue reported. You can track its progress below.',
    )
    if (ok) {
      setTitle('')
      setDescription('')
      onCreated()
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)}>
      <div className="form-grid">
        <Field label="Room">
          <select value={roomId} onChange={(e) => setRoomId(Number(e.target.value))}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber}
              </option>
            ))}
          </select>
        </Field>
        <Field label="What's the problem?">
          <input required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking faucet" />
        </Field>
      </div>
      <Field label="Details">
        <textarea
          required
          rows={3}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Where is it, and when did it start?"
        />
      </Field>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}
