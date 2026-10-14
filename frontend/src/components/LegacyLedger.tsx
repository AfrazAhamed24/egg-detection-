import { motion } from 'motion/react'

import type { InspectionEvent } from '../useInspection'

/* Legacy Ledger — displays per-egg inspection events from localStorage.
   Renders a collapsible row for each event. Empty state shows placeholder.
   Designed to be compact and scannable, matching the industrial aesthetic. */

interface LedgerProps {
  events: unknown[]
  running: boolean
}

export function Ledger({ events, running }: LedgerProps) {
  const actualEvents = Array.isArray(events) ? events : []

  return (
    <footer className="flex h-24 shrink-0 items-center justify-between border-t border-rule-1 bg-room-0 px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-tx-3">
          Inspection log
        </span>
        <span className="h-1 w-1 rounded-full bg-rule-2" />
      </div>

      {/* Event count summary */}
      <div className="text-right">
        <span className="text-[10px] text-tx-3">
          {actualEvents.length} events
        </span>
      </div>

      {/* Event list — only renders when there are events */}
      {actualEvents.length > 0 && (
        <div className="overflow-y-auto max-h-32 w-64 rounded-lg bg-room-1 border border-rule-1/60 p-3 text-[9px] text-tx-3">
          {actualEvents.map((ev, i) => {
            const castedEv = ev as unknown as InspectionEvent
            const date = new Date(typeof castedEv.at === 'number' ? castedEv.at : Date.now())
            const label = String(castedEv.label).toUpperCase()
            const track = typeof castedEv.track === 'number' ? castedEv.track : '?'
            return (
              <motion.div
                key={i}
                className="flex items-center justify-between px-2 py-1 border-b border-rule-0/40 last:border-0"
                animate={{ opacity: [0, 1], transition: { duration: 0.15 } }}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${label === 'CRACKED' ? 'bg-bad' : 'bg-ok'}`} />
                  <span>{label}</span>
                  <span>{track}</span>
                </span>
                <span className="text-[9px]">
                  {date.toLocaleTimeString()}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* placeholder when no events */}
      {actualEvents.length === 0 && (
        <motion.span className="instr text-[10px] uppercase tracking-[0.2em] text-tx-3">
          {running ? 'Recording' : 'Awaiting feed'}
        </motion.span>
      )}
    </footer>
  )
}