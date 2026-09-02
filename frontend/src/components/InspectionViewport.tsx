import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Play, Square, RotateCcw, Aperture } from 'lucide-react'

interface InspectionViewportProps {
  isLive: boolean
  running: boolean
  error: string | null
  fps: number
  busy: boolean
  onStart: () => void
  onStop: () => void
  onReset: () => void
}

/* Optical frame — precise corner ticks, no thick border, no giant radius. */
function Frame({ active, faulty }: { active: boolean; faulty: boolean }) {
  const tone = faulty ? '#48302a' : active ? 'rgba(232,168,60,0.5)' : 'rgba(87,71,47,0.6)'
  return (
    <div
      className="pointer-events-none absolute inset-0 transition-colors duration-500"
      aria-hidden
      style={{
        color: tone,
        backgroundImage:
          'linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor),linear-gradient(currentColor,currentColor)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top left, top right, bottom left, bottom right',
        backgroundSize: '18px 18px',
      }}
    />
  )
}

/* Live feed — loaded only while the line runs, fading in on engage. */
function Feed({ running }: { running: boolean }) {
  return (
    <motion.img
      key={running ? 'live' : 'idle'}
      src={running ? '/api/video' : undefined}
      alt="Live inspection feed"
      initial={{ opacity: 0 }}
      animate={{ opacity: running ? 1 : 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="h-full w-full object-contain"
    />
  )
}

/* The empty chamber — a composed, intentional "ready for inspection". */
function ReadyChamber({ faulty, error, connecting }: { faulty: boolean; error: string | null; connecting: boolean }) {
  const title = connecting
    ? 'Starting inspection'
    : faulty
      ? 'Inspection fault'
      : 'INSPECTION LINE · STANDBY'

  const subtitle = connecting
    ? (error ?? 'Connecting camera · initializing vision engine')
    : faulty
      ? (error ?? 'The inspection feed is unavailable.') + ' Select Start to retry.'
      : 'Vision engine ready. Start an inspection to begin sensing eggs.'

  return (
    <motion.div
      key={connecting ? 'starting' : faulty ? 'fault' : 'ready'}
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* optical reticle — this is a sensing instrument; floated above the type */}
      <svg
        className={`pointer-events-none absolute left-1/2 top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 ${connecting ? 'text-visoft/60' : 'text-rule-2/60'}`}
        viewBox="0 0 200 200"
        fill="none"
        aria-hidden
      >
        <circle cx="100" cy="100" r="72" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 4" />
        <path d="M100 10v26M100 164v26M10 100h26M164 100h26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M100 96v8M96 100h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full border ${
          faulty ? 'border-bad/40 text-bad' : connecting ? 'border-visoft/40 text-visoft' : 'border-rule-2/60 text-tx-3'
        }`}
      >
        {connecting ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border border-visoft/30 border-t-visoft" style={{ animationDuration: '1s' }} aria-hidden />
        ) : (
          <Aperture className="h-5 w-5" strokeWidth={1.2} aria-hidden />
        )}
      </span>

      <div className="relative space-y-2">
        <p className={`text-[13.5px] font-medium tracking-wide ${faulty ? 'text-bad' : connecting ? 'text-visoft' : 'text-tx-1'}`}>
          {title}
        </p>
        <p className="mx-auto max-w-[360px] text-[12.5px] leading-relaxed text-tx-3">
          {subtitle}
        </p>
      </div>

      {!faulty && !connecting && (
        <div className="instr relative flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-tx-3">
          <span className="h-1 w-1 rounded-full bg-rule-2" />
          Vision engine ready
        </div>
      )}
    </motion.div>
  )
}

/* Machine controls — flight-instrument, seated on the feed, not a panel bar. */
function Console({
  running, busy, isLive, fps, onStart, onStop, onReset,
}: { running: boolean; busy: boolean; isLive: boolean; fps: number; onStart: () => void; onStop: () => void; onReset: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-4 px-6 pb-5">
      {/* live frame calibration + signal readout, product-facing */}
      <div className="scrim flex items-center gap-3 rounded-md px-3.5 py-2">
        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-visoft live-signal' : 'bg-tx-3'}`} />
        <span className="instr text-[10px] uppercase tracking-[0.2em] text-tx-1">
          {isLive ? 'Live capture' : running ? 'Acquiring' : 'Standby'}
        </span>
        <span className="h-3 w-px bg-rule-2" role="presentation" />
        <span className="instr text-[10px] uppercase tracking-[0.18em] text-tx-3">
          {running ? `${fps.toFixed(0)} fps` : '0 fps'}
        </span>
      </div>

      {/* controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          disabled={running || busy}
          className="flex h-9 items-center gap-2 rounded-md bg-visoft px-4 text-[12.5px] font-semibold text-room-0 transition-colors duration-150 hover:bg-[#f8d98b] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Play className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Start line
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onStop}
          disabled={!running || busy}
          className="flex h-9 items-center gap-2 rounded-md border border-rule-2 bg-room-1/70 px-3.5 text-[12.5px] font-medium text-tx-1 transition-colors duration-150 hover:border-bad/50 hover:text-bad disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Square className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Stop
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          disabled={busy}
          className="flex h-9 items-center gap-2 rounded-md px-2.5 text-[12.5px] font-medium text-tx-3 transition-colors duration-150 hover:text-tx-1 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
          Reset
        </motion.button>
      </div>
    </div>
  )
}

export function InspectionViewport({
  isLive, running, error, fps, busy, onStart, onStop, onReset,
}: InspectionViewportProps) {
  // A fault is signalled by an active error, whether or not the line is
  // still nominally running (model load failure or backend drop both count).
  const faulty = !!error

  // "Connecting" — a brief start-up cue shown when the line is told to run.
  // It is self-limiting and deliberately NOT coupled to the WebSocket-backed
  // `isLive`: the feed streams as soon as `running` is true, so the overlay
  // must never wait on a network link (which can lag without the camera
  // actually failing). A short timer dissolves it so the live video is always
  // revealed shortly after Start.
  const [pending, setPending] = useState(false)
  useEffect(() => {
    if (!running) return
    setPending(true)
    const t = setTimeout(() => setPending(false), 1500)
    return () => clearTimeout(t)
  }, [running])

  const connecting = pending
  const showEmpty = !running || connecting || faulty

  return (
    <section className="relative flex min-w-0 flex-1 overflow-hidden bg-room-1" aria-label="Inspection workspace">
      {/* reflected vision-light at the top of the chamber */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-vidim/5 to-transparent"
        aria-hidden
      />

      {/* the feed — always mounted; fades in/out with the line state */}
      <Feed running={running} />

      {/* low-voltage scan while frames classify */}
      {isLive && (
        <div
          className="scan pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(232,168,60,0.05), transparent)' }}
        />
      )}

      {/* optical frame */}
      <Frame active={isLive} faulty={faulty} />

      {/* composed standby / starting / fault chamber */}
      <AnimatePresence>{showEmpty && <ReadyChamber faulty={faulty} error={error} connecting={connecting} />}</AnimatePresence>

      {/* machine controls + live readout */}
      <Console running={running} busy={busy} isLive={isLive} fps={fps} onStart={onStart} onStop={onStop} onReset={onReset} />
    </section>
  )
}