import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { api } from '../api'
import { errorMessage } from '../hooks'
import { useAction } from '../toast'
import type { Room, RoomPhoto } from '../types'
import { ErrorBox, Loading } from './ui'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 5
const MAX_PHOTOS = 10

/**
 * The room's cover photo (or a placeholder). If `onOpen` is given the photo is
 * a button that opens the gallery.
 */
export function RoomCover({ room, onOpen, className = 'room-cover' }: { room: Room; onOpen?: () => void; className?: string }) {
  const content = room.coverPhotoUrl ? (
    <img src={room.coverPhotoUrl} alt={`Room ${room.roomNumber}`} loading="lazy" />
  ) : (
    <span className="room-cover-empty">No photo yet</span>
  )

  if (!onOpen || !room.coverPhotoUrl) return <div className={className}>{content}</div>
  return (
    <button type="button" className={`${className} room-cover-button`} onClick={onOpen} aria-label={`View photos of room ${room.roomNumber}`}>
      {content}
      <span className="room-cover-hint">View photos</span>
    </button>
  )
}

/** Full-screen photo viewer. Arrow keys move between photos, Escape closes. */
export function PhotoGallery({ room, onClose }: { room: Room; onClose: () => void }) {
  const [photos, setPhotos] = useState<RoomPhoto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let alive = true
    api.rooms
      .photos(room.id)
      .then((list) => {
        if (!alive) return
        // Start on the cover photo.
        setPhotos(list)
        setIndex(Math.max(0, list.findIndex((p) => p.cover)))
      })
      .catch((e: unknown) => alive && setError(errorMessage(e)))
    return () => {
      alive = false
    }
  }, [room.id])

  const count = photos?.length ?? 0
  const step = (delta: number) => count > 0 && setIndex((i) => (i + delta + count) % count)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const current = photos?.[index]

  return (
    <div className="gallery" role="dialog" aria-modal="true" aria-label={`Photos of room ${room.roomNumber}`} onClick={onClose}>
      <div className="gallery-inner" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-head">
          <strong>
            Room {room.roomNumber} · {room.type}
          </strong>
          {count > 0 && (
            <span className="muted small">
              {index + 1} / {count}
            </span>
          )}
          <button ref={closeRef} type="button" className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="gallery-stage">
          {error ? (
            <ErrorBox message={error} />
          ) : !photos ? (
            <Loading />
          ) : !current ? (
            <p className="muted">This room has no photos yet.</p>
          ) : (
            <>
              <img src={current.url} alt={`Room ${room.roomNumber}, photo ${index + 1} of ${count}`} />
              {count > 1 && (
                <>
                  <button type="button" className="gallery-nav prev" onClick={() => step(-1)} aria-label="Previous photo">
                    ‹
                  </button>
                  <button type="button" className="gallery-nav next" onClick={() => step(1)} aria-label="Next photo">
                    ›
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {count > 1 && (
          <div className="gallery-thumbs">
            {photos!.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={i === index ? 'active' : ''}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
              >
                <img src={p.url} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Upload photos, pick the cover and delete photos. Shown inside the Edit room form. */
export function RoomPhotoEditor({ room, onChanged }: { room: Room; onChanged: () => void }) {
  const { run, busy } = useAction()
  const [photos, setPhotos] = useState<RoomPhoto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.rooms
      .photos(room.id)
      .then(setPhotos)
      .catch((e: unknown) => setError(errorMessage(e)))
  }, [room.id])

  const apply = async (action: () => Promise<RoomPhoto[]>, success: string) => {
    let updated: RoomPhoto[] | undefined
    const ok = await run(async () => {
      updated = await action()
    }, success)
    if (ok && updated) {
      setPhotos(updated)
      onChanged()
    }
  }

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // allow picking the same file again
    if (files.length === 0) return

    const tooBig = files.find((f) => f.size > MAX_MB * 1024 * 1024)
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than ${MAX_MB} MB.`)
      return
    }
    setError(null)
    await apply(() => api.rooms.uploadPhotos(room.id, files), files.length === 1 ? 'Photo uploaded.' : `${files.length} photos uploaded.`)
  }

  const remove = async (p: RoomPhoto) => {
    if (!window.confirm('Delete this photo?')) return
    await apply(() => api.rooms.removePhoto(room.id, p.id), 'Photo deleted.')
  }

  const full = (photos?.length ?? 0) >= MAX_PHOTOS

  return (
    <>
      <p className="muted small">
        JPG, PNG or WebP, up to {MAX_MB} MB each, {MAX_PHOTOS} photos per room. The cover photo is the one tenants see first.
      </p>

      {error && <ErrorBox message={error} />}

      {!photos ? (
        !error && <Loading />
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <figure key={p.id} className={p.cover ? 'photo-tile is-cover' : 'photo-tile'}>
              <img src={p.url} alt={`Room ${room.roomNumber}`} />
              <figcaption>
                {p.cover ? (
                  <span className="badge tone-green">Cover</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-small"
                    disabled={busy}
                    onClick={() => void apply(() => api.rooms.setCoverPhoto(room.id, p.id), 'Cover photo updated.')}
                  >
                    Make cover
                  </button>
                )}
                <button type="button" className="btn btn-small btn-danger-ghost" disabled={busy} onClick={() => void remove(p)}>
                  Delete
                </button>
              </figcaption>
            </figure>
          ))}

          {!full && (
            <button type="button" className="photo-add" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? 'Uploading…' : '+ Add photos'}
            </button>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => void upload(e)} />
    </>
  )
}
