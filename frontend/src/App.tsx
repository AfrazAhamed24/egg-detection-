import { useInspection } from './useInspection'
import { TopLine } from './components/TopLine'
import { InspectionViewport } from './components/InspectionViewport'
import { InstrumentationReadout } from './components/InstrumentationReadout'

export default function App() {
  const { snap, crackRate, connection, isLive, events, busy, start, stop, reset } = useInspection()

  return (
    <div className="flex h-screen w-screen select-none flex-col overflow-hidden bg-room-0 text-tx-0">
      <TopLine
        isLive={isLive}
        running={snap.running}
        connection={connection}
        fps={snap.fps}
        snap={snap}
      />

      {/* the instrument — full bleeed, camera dominates everything */}
      <main id="bay" className="relative flex min-h-0 flex-1 flex-col">
        <InspectionViewport
          isLive={isLive}
          running={snap.running}
          error={snap.error}
          fps={snap.fps}
          busy={busy}
          onStart={start}
          onStop={stop}
          onReset={reset}
        />

        {/* inspection findings */}
        <InstrumentationReadout snap={snap} crackRate={crackRate} isLive={isLive} />
      </main>

      {/* architectural inspection-log region — reserved, empty until the
          backend exposes per-egg events. */}
      <Ledger events={events} running={snap.running} />

      {/* faint hairline to lower the whole stage to the deck */}
      <div className="h-px w-full bg-room-0" aria-hidden />
    </div>
  )
}

/* A slim, architectural ledger housing the inspection log. Framed to exist,
   rendered empty until real event data arrives — no invented records. */
function Ledger({ events, running }: { events: unknown[]; running: boolean }) {
  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-rule-1 bg-room-0 px-6">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-medium uppercase tracking-[0.24em] text-tx-3">Inspection log</span>
        <span className="h-1 w-1 rounded-full bg-rule-2" />
      </div>
      {events.length === 0 ? (
        <AnimatedPlaceholder running={running} />
      ) : null}
    </footer>
  )
}

function AnimatedPlaceholder({ running }: { running: boolean }) {
  return (
    <span className="instr text-[10px] uppercase tracking-[0.2em] text-tx-3">
      {running ? 'Recording' : 'Awaiting feed'}
    </span>
  )
}