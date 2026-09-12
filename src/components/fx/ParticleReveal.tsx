import { useEffect } from 'react'
import type { ParticleKind } from '../../fx/theme'
import { useReducedMotion } from '../../fx/useReducedMotion'
import { useParticles } from './useParticles'

/**
 * A standalone full-screen particle burst not attached to a card. Fires once whenever `play` flips
 * to true — used for moments like awakening at registration or a winner celebration. No-ops under
 * reduced motion.
 */
export function ParticleReveal({
  kind,
  play,
  repeat = false,
}: {
  kind: ParticleKind
  play: boolean
  /** When true, keeps bursting on an interval while `play` stays true (e.g. winner rain). */
  repeat?: boolean
}) {
  const reduced = useReducedMotion()
  const { canvasRef, burst } = useParticles(!reduced)

  useEffect(() => {
    if (!play || reduced) return
    burst(kind)
    if (!repeat) return
    const t = setInterval(() => burst(kind), 900)
    return () => clearInterval(t)
  }, [play, kind, repeat, burst, reduced])

  return <canvas ref={canvasRef} className="reveal-canvas" aria-hidden />
}
