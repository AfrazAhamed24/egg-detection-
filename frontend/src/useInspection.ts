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
          const data = JSON.parse(ev.data) as Partial<InspectionSnapshot>
          setSnap((prev) => ({ ...prev, ...data }))
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

  const crackRate =
    snap.total_eggs > 0 ? (snap.cracked_eggs / snap.total_eggs) * 100 : 0

  /* the line is actively inspecting: running and healthy, on a live link */
  const isLive = snap.running && !snap.error && connection === 'live'

  /*
   * Live inspection events. The backend exposes aggregates only (counts),
   * not a per-egg log, so this is deliberately empty today. The UI renders
   * this region's architecture without inventing data.
   */
  const events: InspectionEvent[] = []

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
  }
}