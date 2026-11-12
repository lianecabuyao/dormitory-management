import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { PhotoGallery, RoomCover } from '../../components/RoomPhotos'
import { ListState, Notice, PageHeader } from '../../components/ui'
import { money } from '../../format'
import { useLoad } from '../../hooks'
import { useCurrentUser } from '../../session'
import { useAction } from '../../toast'
import type { Room } from '../../types'

export function BrowseRoomsPage() {
  const user = useCurrentUser()
  const rooms = useLoad(() => api.rooms.available())
  const mine = useLoad(async () => {
    const [reservations, leases] = await Promise.all([api.reservations.byTenant(user.id), api.leases.byTenant(user.id)])
    return { reservations, leases }
  }, [user.id])
  const { run, busy } = useAction()
  const [viewing, setViewing] = useState<Room | null>(null)

  // One room per tenant (the backend enforces the same rule).
  const openLease = mine.data?.leases.find((l) => l.status === 'PENDING' || l.status === 'ACTIVE')
  const openReservation = mine.data?.reservations.find(
    (r) =>
      r.status === 'PENDING' ||
      (r.status === 'APPROVED' && !mine.data?.leases.some((l) => l.reservation?.id === r.id)),
  )
  const canReserve = Boolean(mine.data) && !openLease && !openReservation

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

      {openLease ? (
        <Notice tone="blue">
          You already have a room: <strong>Room {openLease.room.roomNumber}</strong>. You can reserve another room once your
          current lease ends. <Link to="/my/leases">View my lease</Link>
        </Notice>
      ) : openReservation ? (
        <Notice tone="amber">
          You have a reservation in progress for <strong>Room {openReservation.room.roomNumber}</strong>. To choose a
          different room, cancel it first on <Link to="/my/reservations">My reservations</Link>.
        </Notice>
      ) : null}

      <ListState state={rooms} empty="No rooms are available at the moment. Check back later.">
        {(list) => (
          <div className="room-grid">
            {list.map((room) => {
              const free = room.capacity - room.currentOccupants
              const thisOne = openReservation?.room.id === room.id
              return (
                <article key={room.id} className="room-card">
                  <RoomCover room={room} onOpen={() => setViewing(room)} />
                  <div className="room-card-body">
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
                      disabled={busy || !canReserve || free <= 0}
                      onClick={() => void reserve(room)}
                    >
                      {thisOne ? 'Reservation submitted' : 'Reserve'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </ListState>

      {viewing && <PhotoGallery room={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}
