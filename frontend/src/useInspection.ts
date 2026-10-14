import { useCallback, useEffect, useRef, useState } from 'react'

export interface InspectionSnapshot {
  running: boolean
  total_eggs: number
  normal_eggs: number
  cracked_eggs: number
  fps: number
  active_tracks: number
  error: string | null
}

/** A single classified egg as revealed by the backend. */
export interface InspectionEvent {
  at: number
  label: 'GOOD' | 'CRACKED'
  track: number
}

const EMPTY: InspectionSnapshot = {
  running: false,
  total_eggs: 0,
  normal_eggs: 0,
  cracked_eggs: 0,
  fps: 0,
  active_tracks: 0,
  error: null,
}

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws'
const WS_URL = `${WS_PROTOCOL}://${window.location.host}/ws`

const EVENTS_KEY = 'egg_inspection_events'

function loadEventsFromStorage(): InspectionEvent[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveEventsToStorage(events: InspectionEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } catch {
    /* persist failure — non-fatal, UI continues with in-memory events */
  }
}

async function readStatus(): Promise<InspectionSnapshot> {
  const res = await fetch('/api/status')
  if (!res.ok) throw new Error(`status ${res.status}`)
  const data = await res.json()
  return { ...EMPTY, ...data, error: data.error ?? null }
}

export function useInspection() {
  const [snap, setSnap] = useState<InspectionSnapshot>(EMPTY)
  const [connection, setConnection] = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [busy, setBusy] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const [events, setEvents] = useState<InspectionEvent[]>(() => loadEventsFromStorage())

  useEffect(() => {
    saveEventsToStorage(events)
  }, [events])

  useEffect(() => {
    let disposed = false

    readStatus()
      .then((s) => {
        if (disposed) return
        setSnap(s)
      })
      .catch(() => {
        /* initial status fetch failure handled by WS state */
      })

    let socket: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      socket = new WebSocket(WS_URL)
      wsRef.current = socket

      socket.onopen = () => {
        setConnection('live')
        // Resync the snapshot after (re)connecting so a backend restart or a
        // dropped link can't leave the UI showing stale counters.
        readStatus()
          .then((s) => {
            if (disposed) return
            setSnap(s)
          })
          .catch(() => {
            /* keep current snapshot; WS frames will resync shortly */
          })
      }

      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { type?: string } & Partial<InspectionSnapshot> & {
            label?: string
            track?: number
            at?: number
          }
          if (data.type === 'egg_event' && data.label && data.track !== undefined) {
            const newEvent: InspectionEvent = {
              at: (data.at as number) ?? Date.now(),
              label: data.label as 'GOOD' | 'CRACKED',
              track: typeof data.track === 'number' ? data.track : 0,
            }
            setEvents((prev) => {
              const updated = [...prev, newEvent]
              saveEventsToStorage(updated)
              return updated
            })
          } else {
            setSnap((prev) => ({ ...prev, ...(data as Partial<InspectionSnapshot>) }))
          }
        } catch {
          /* ignore malformed frame */
        }
      }

      socket.onclose = () => {
        if (disposed) return
        setConnection('offline')
        retry = setTimeout(connect, 2000)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    return () => {
      disposed = true
      if (retry) clearTimeout(retry)
      if (socket) {
        socket.onclose = null
        socket.close()
      }
      wsRef.current = null
    }
  }, [])

  const post = useCallback(async (path: string) => {
    setBusy(true)
    try {
      const res = await fetch(path, { method: 'POST' })
      if (!res.ok) throw new Error(`${path} ${res.status}`)
      const data = await res.json()
      setSnap((prev) => ({ ...prev, ...data, error: data.error ?? null }))
    } catch (err) {
      // Surface a clear, non-crashing offline state instead of throwing
      // into the void. The operator can see the fault and retry.
      setSnap((prev) => ({
        ...prev,
        running: false,
        error: `Backend unavailable: ${err instanceof Error ? err.message : 'network error'}`,
      }))
    } finally {
      setBusy(false)
    }
  }, [])

  const start = useCallback(() => post('/api/camera/start'), [post])
  const stop = useCallback(() => post('/api/camera/stop'), [post])
  const reset = useCallback(() => post('/api/inspection/reset'), [post])

  const exportData = useCallback(() => {
    const payload = {
      timestamp: new Date().toISOString(),
      total_eggs: snap.total_eggs,
      normal_eggs: snap.normal_eggs,
      cracked_eggs: snap.cracked_eggs,
      crackRate: snap.total_eggs > 0 ? (snap.cracked_eggs / snap.total_eggs) * 100 : 0,
      fps: snap.fps,
      active_tracks: snap.active_tracks,
      error: snap.error,
      events: events.slice(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `egg-inspection-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snap, events])

  const crackRate =
    snap.total_eggs > 0 ? (snap.cracked_eggs / snap.total_eggs) * 100 : 0

  /* the line is actively inspecting: running and healthy, on a live link */
  const isLive = snap.running && !snap.error && connection === 'live'

  return {
    snap,
    crackRate,
    connection,
    isLive,
    events,
    busy,
    start,
    stop,
    reset,
    exportData,
  }
}