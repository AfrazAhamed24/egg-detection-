import { motion } from 'motion/react'
import { useTweenedNumber } from '../motionPrimitives'
import type { InspectionSnapshot } from '../useInspection'

/**
 * InstrumentationReadout — the inspection findings as instrument output,
 * not stat-cards. A single optical counter ledge: TOTAL weight, the two
 * outcome channels, and a defect-rate signal that only gains weight when
 * defects actually exist.
 */

function Counter({ value, tone, label, live, primary = false }: {
  value: string
  tone: string
  label: string
  live: boolean
  primary?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tel-label">{label}</span>
      <div className="relative">
        <span
          className={`instr inline-block font-light leading-none ${primary ? 'text-3xl' : 'text-[22px]'} ${tone}`}
          style={{ letterSpacing: '0.04em' }}
        >
          {value}
        </span>
        {live && label === 'Total' && (
          <span className="absolute -right-3 top-1.5 h-1.5 w-1.5 rounded-full bg-visoft live-signal" />
        )}
      </div>
    </div>
  )
}

const GOOD = { tone: 'text-ok', marker: 'bg-ok' }
const BAD = { tone: 'text-bad', marker: 'bg-bad' }

export function InstrumentationReadout({ snap, crackRate, isLive }: {
  snap: InspectionSnapshot
  crackRate: number
  isLive: boolean
}) {
  const totalT = useTweenedNumber(snap.total_eggs, 420)
  const goodT = useTweenedNumber(snap.normal_eggs, 420)
  const badT = useTweenedNumber(snap.cracked_eggs, 420)

  const total = Math.round(totalT).toString().padStart(5, '0')
  const good = Math.round(goodT).toString().padStart(4, '0')
  const bad = Math.round(badT).toString().padStart(4, '0')
  const rate = crackRate.toFixed(1).padStart(3, '0')
  const rateN = Math.min(100, crackRate)
  const hasDefects = snap.cracked_eggs > 0

  return (
    <div className="relative z-10 flex h-28 shrink-0 items-center justify-between gap-10 border-t border-rule-1 px-7">
      {/* gentle inlay divider behind the counter ledge */}
      <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-rule-2/60 to-transparent" aria-hidden />

      {/* TOTAL — the counter of record */}
      <Counter value={total} tone="text-tx-0" label="Total inspected" live={isLive} primary />

      <div className="h-12 w-px bg-rule-1" role="presentation" />

      {/* GOOD / CRACKED channels */}
      <Counter value={good} tone={GOOD.tone} label="Good" live={isLive} />
      <Counter value={bad} tone={hasDefects ? BAD.tone : 'text-tx-2'} label="Cracked" live={isLive} />

      <div className="h-12 w-px bg-rule-1" role="presentation" />

      {/* CRACK RATE — a signal that only speaks when there is something to say */}
      <div className="flex w-[200px] min-w-[200px] flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="tel-label">Crack rate</span>
          <span className={`instr text-xl font-light leading-none ${hasDefects ? 'text-bad' : 'text-tx-2'}`} style={{ letterSpacing: '0.04em' }}>
            {rate}
            <span className="text-[10px] text-tx-3">%</span>
          </span>
        </div>
        <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-rule-0">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${rateN}%`, backgroundColor: hasDefects ? '#e56d5f' : '#57472f' }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.2em] text-tx-3">
          <span>Norm</span>
          <span>Thres</span>
        </div>
      </div>

      {/* live telemetry chips — edge metadata */}
      <div className="ml-auto hidden items-center gap-5 lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-tx-3" />
          <span className="tel-label">Active tracks</span>
          <span className="instr text-[12px] text-tx-1">{snap.active_tracks}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-visoft live-signal' : 'bg-tx-3'}`} />
          <span className="tel-label">Link</span>
          <span className="instr text-[12px] text-tx-1">{isLive ? 'LIVE' : 'IDLE'}</span>
        </div>
      </div>
    </div>
  )
}