import { useState, type FormEvent } from 'react'
import { api } from '../../api'
import { RoomCover, RoomPhotoEditor } from '../../components/RoomPhotos'
import { Card, Field, ListState, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { label, money } from '../../format'
import { useLoad } from '../../hooks'
import { useAction } from '../../toast'
import { ROOM_STATUSES, type Room, type RoomInput, type RoomStatus } from '../../types'

type Filter = 'ALL' | RoomStatus
const FILTERS: Filter[] = ['ALL', ...ROOM_STATUSES]
const ROOM_TYPES = ['Single', 'Double', 'Triple', 'Quad']

export function RoomsPage() {
  const rooms = useLoad(() => api.rooms.list())
  const { run, busy } = useAction()
  const [filter, setFilter] = useState<Filter>('ALL')
  // null = form closed, 'new' = adding, Room = editing that room
  const [editing, setEditing] = useState<Room | 'new' | null>(null)

  const counts: Partial<Record<Filter, number>> = { ALL: rooms.data?.length ?? 0 }
  for (const r of rooms.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1

  const remove = async (room: Room) => {
    if (!window.confirm(`Delete room ${room.roomNumber}? This can't be undone.`)) return
    if (await run(() => api.rooms.remove(room.id), `Room ${room.roomNumber} deleted.`)) await rooms.reload()
  }

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Add rooms, set rates and keep track of occupancy."
        actions={
          editing === null && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
              Add room
            </button>
          )
        }
      />

      {editing !== null && (
        <RoomForm
          key={editing === 'new' ? 'new' : editing.id}
          room={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, isNew) => {
            // A new room stays open in edit mode so photos can be added right away.
            setEditing(isNew ? saved : null)
            void rooms.reload()
          }}
          onPhotosChanged={() => void rooms.reload()}
        />
      )}

      <Tabs value={filter} options={FILTERS} onChange={setFilter} counts={counts} />

      <ListState state={rooms} empty="No rooms yet. Add the first one.">
        {(list) => {
          const shown = list
            .filter((r) => filter === 'ALL' || r.status === filter)
            .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
          if (shown.length === 0) return <p className="muted state">No {label(filter).toLowerCase()} rooms.</p>
          return (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Occupancy</th>
                    <th className="num">Monthly rate</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="room-cell">
                          <RoomCover room={r} className="room-thumb" />
                          <strong>{r.roomNumber}</strong>
                        </div>
                      </td>
                      <td>{r.type}</td>
                      <td>
                        <Occupancy used={r.currentOccupants} total={r.capacity} />
                      </td>
                      <td className="num">{money(r.monthlyRate)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="actions">
                        <button type="button" className="btn btn-small" onClick={() => setEditing(r)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void remove(r)}>
                          Delete
                        </button>
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

function Occupancy({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  return (
    <div className="occupancy">
      <div className="meter" aria-hidden="true">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="small">
        {used} / {total}
      </span>
    </div>
  )
}

function RoomForm({
  room,
  onClose,
  onSaved,
  onPhotosChanged,
}: {
  room: Room | null
  onClose: () => void
  onSaved: (saved: Room, isNew: boolean) => void
  onPhotosChanged: () => void
}) {
  const { run, busy } = useAction()
  const [form, setForm] = useState({
    roomNumber: room?.roomNumber ?? '',
    type: room?.type ?? 'Single',
    capacity: String(room?.capacity ?? 1),
    monthlyRate: String(room?.monthlyRate ?? ''),
    status: room?.status ?? ('AVAILABLE' as RoomStatus),
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const body: RoomInput = {
      roomNumber: form.roomNumber.trim(),
      type: form.type.trim(),
      capacity: Number(form.capacity),
      monthlyRate: Number(form.monthlyRate),
      status: form.status,
      currentOccupants: room?.currentOccupants ?? 0,
    }
    let saved: Room | undefined
    const ok = await run(
      async () => {
        saved = room ? await api.rooms.update(room.id, body) : await api.rooms.create(body)
      },
      room ? `Room ${body.roomNumber} updated.` : `Room ${body.roomNumber} added. You can add photos now.`,
    )
    if (ok && saved) onSaved(saved, !room)
  }

  return (
    <Card title={room ? `Edit room ${room.roomNumber}` : 'New room'}>
      <form onSubmit={(e) => void submit(e)}>
        <div className="form-grid">
          <Field label="Room number">
            <input required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} placeholder="e.g. 101" />
          </Field>
          <Field label="Type">
            <input required list="room-types" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <datalist id="room-types">
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Capacity (beds)">
            <input
              required
              type="number"
              min={Math.max(1, room?.currentOccupants ?? 1)}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </Field>
          <Field label="Monthly rate (₱)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyRate}
              onChange={(e) => setForm({ ...form, monthlyRate: e.target.value })}
            />
          </Field>
          {room && (
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}>
                {ROOM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : room ? 'Save changes' : 'Add room'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {room ? 'Close' : 'Cancel'}
          </button>
        </div>
      </form>

      <section className="form-section">
        <h3>Photos</h3>
        {room ? (
          <RoomPhotoEditor room={room} onChanged={onPhotosChanged} />
        ) : (
          <p className="muted small">Save the room first, then you can add photos here.</p>
        )}
      </section>
    </Card>
  )
}
