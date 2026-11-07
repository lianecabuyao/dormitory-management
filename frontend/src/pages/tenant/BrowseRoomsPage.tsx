import { Link } from 'react-router-dom'
import { api } from '../../api'
import { ListState, PageHeader } from '../../components/ui'
import { money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Room } from '../../types'

export function BrowseRoomsPage() {
  const user = useCurrentUser()
  const rooms = useLoad(() => api.rooms.available())
  const mine = useLoad(() => api.reservations.byTenant(user.id), [user.id])
  const { run, busy } = useAction()

  // Rooms this tenant already has an open reservation for.
  const reservedRoomIds = new Set(
    (mine.data ?? []).filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').map((r) => r.room.id),
  )

  const reserve = async (room: Room) => {
    const ok = await run(
      () => api.reservations.create(user.id, room.id),
      `Reservation for room ${room.roomNumber} submitted. An admin will review it.`,
    )
    if (ok) await Promise.all([rooms.reload(), mine.reload()])
  }

  return (
    <>
      <PageHeader
        title="Find a room"
        subtitle="Rooms that are open for reservation right now."
        actions={
          <Link to="/my/reservations" className="btn">
            My reservations
          </Link>
        }
      />

      <ListState state={rooms} empty="No rooms are available at the moment. Check back later.">
        {(list) => (
          <div className="room-grid">
            {list.map((room) => {
              const free = room.capacity - room.currentOccupants
              const already = reservedRoomIds.has(room.id)
              return (
                <article key={room.id} className="room-card">
                  <div className="room-card-top">
                    <span className="room-number">Room {room.roomNumber}</span>
                    <span className="room-type">{room.type}</span>
                  </div>
                  <div className="room-price">
                    {money(room.monthlyRate)}
                    <span className="muted"> / month</span>
                  </div>
                  <dl className="room-facts">
                    <div>
                      <dt>Capacity</dt>
                      <dd>{room.capacity}</dd>
                    </div>
                    <div>
                      <dt>Beds free</dt>
                      <dd>{free}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={busy || already || free <= 0}
                    onClick={() => void reserve(room)}
                  >
                    {already ? 'Reservation submitted' : 'Reserve'}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </ListState>
    </>
  )
}
