import { useEffect, useRef, useState } from 'react'

/**
 * Instrument-style number. Eases toward the latest real value so live
 * counters "arrive" rather than jump — deliberate, non-jarring motion.
 * Pure rAF, zero deps.
 */
export function useTweenedNumber(target: number, durationMs = 380): number {
  const [display, setDisplay] = useState(target)
  const current = useRef(target)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const from = current.current
    const to = target
    if (from === to) return

    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      const value = from + (to - from) * eased
      current.current = value
      setDisplay(value)
      if (t < 1) {
        raf.current = requestAnimationFrame(step)
      } else {
        current.current = to
        setDisplay(to)
      }
    }
    raf.current = requestAnimationFrame(step)

    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
    }
  }, [target, durationMs])

  return display
}