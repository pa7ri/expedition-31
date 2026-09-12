import { animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../fx/useReducedMotion'

/**
 * Animated number that tweens from a start value to `value`. Used for energy totals and scan deltas.
 * Under reduced motion it snaps straight to the value. `prefix`/`sign` let callers render "+150" or
 * "⚡ 400".
 */
export function CountUp({
  value,
  from = 0,
  duration = 0.9,
  sign = false,
  className,
}: {
  value: number
  from?: number
  duration?: number
  sign?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : from)
  const started = useRef(false)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const controls = animate(started.current ? display : from, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    started.current = true
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced])

  const text = sign && display > 0 ? `+${display}` : `${display}`
  return <span className={className}>{text}</span>
}
