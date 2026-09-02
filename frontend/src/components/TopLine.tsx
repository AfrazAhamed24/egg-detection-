import { motion, AnimatePresence } from 'motion/react'
import type { InspectionSnapshot } from '../useInspection'

/* Product mark — a single, precise optical egg profile. */
function Mark() {
  return (
    <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden>
      <ellipse cx="14" cy="14.6" rx="7.3" ry="9.6" transform="rotate(-7 14 14.6)" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="14" cy="12.2" rx="4.6" ry="6.2" transform="rotate(-7 14 12.2)" stroke="currentColor" strokeWidth="0.7" opacity="0.5" strokeDasharray="1.5 3" strokeLinecap="round" />
    </svg>
  )
}

interface TopLineProps {
  isLive: boolean
  running: boolean
  connection: 'connecting' | 'live' | 'offline'
  fps: number
  snap: InspectionSnapshot
}

function state(running: boolean, isLive: boolean, connection: string) {
  if (running && isLive) return { key: 'live', word: 'Live', tone: 'text-visoft' }
  if (running && connection === 'live') return { key: 'wait', word: 'Locking', tone: 'text-cmute' }
  if (running) return { key: 'fault', word: 'Fault', tone: 'text-bad' }
  return { key: 'ready', word: 'Ready', tone: 'text-tx-2' }
}

const LINK_TEXT: Record<string, string> = {
  connecting: 'Linking',
  live: 'Connected',
  offline: 'Offline',
}

export function TopLine({ isLive, running, connection, fps, snap }: TopLineProps) {
  const s = state(running, isLive, connection)
  const link = LINK_TEXT[connection]

  return (
    <div className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-6 px-6">
      {/* identity */}
      <div className="flex items-center gap-3">
        <span className="text-vidim">
          <Mark />
        </span>
        <div className="flex flex-col gap-[5px] leading-none">
          <span className="text-[13.5px] font-semibold tracking-tight text-tx-0">Egg Inspection</span>
          <span className="text-[8.5px] font-medium uppercase tracking-[0.28em] text-tx-3">Vision Workstation</span>
        </div>
      </div>

      {/* machine-state telemetry — a composed readout, edge-aligned */}
      <div className="flex items-center gap-7 text-[11px]">
        {/* inspection state */}
        <div className="flex items-center gap-2">
          <span className={`relative h-1.5 w-1.5 rounded-full ${running ? (isLive ? 'bg-visoft live-signal' : 'bg-cmute') : 'bg-tx-3'}`} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={s.key}
              className={`font-medium ${s.tone}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
            >
              Inspection · {s.word}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-4 w-px bg-rule-1" role="presentation" />

        {/* vision engine */}
        <div className="flex items-center gap-1.5">
          <span className="tel-label">Vision</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={snap.error ? 'err' : running ? 'eng' : 'rdy'}
              className={`instr text-[11px] ${snap.error ? 'text-bad' : running ? 'text-tx-1' : 'text-tx-2'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {snap.error ? 'ERR' : running ? 'ACTIVE' : 'READY'}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-4 w-px bg-rule-1" role="presentation" />

        {/* camera */}
        <div className="flex items-center gap-1.5">
          <span className="tel-label">Camera</span>
          <span className={`instr text-[11px] ${connection === 'live' ? 'text-tx-1' : 'text-tx-3'}`}>
            {link}
          </span>
        </div>

        <div className="h-4 w-px bg-rule-1" role="presentation" />

        {/* processing */}
        <div className="flex items-center gap-1.5">
          <span className="tel-label">Processing</span>
          <span className="instr text-[11px] text-tx-1">{running ? `${fps.toFixed(0)} fps` : '—'}</span>
        </div>
      </div>
    </div>
  )
}