import { motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import type { Element } from '../../game/elements'
import type { TagType } from '../../game/tags'
import { revealVariants, battleShake } from '../../fx/variants'
import { particleForReveal, tagColor, glow } from '../../fx/theme'
import { useReducedMotion } from '../../fx/useReducedMotion'
import { useParticles } from './useParticles'

/**
 * The signature "marker reveal" card. Animates in with a per-tag-type variant and fires a matching
 * elemental particle burst on mount. Under reduced motion it collapses to a plain fade and skips
 * particles. Used by Tag.tsx for every scan outcome, and reusable for any themed reveal.
 */
export function RevealCard({
  tagType,
  element,
  accent,
  children,
  className = '',
}: {
  tagType?: TagType
  element: Element
  accent?: string
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  const { canvasRef, burst } = useParticles(!reduced)
  const c = accent ?? (tagType ? tagColor(tagType) : '#f5c451')

  useEffect(() => {
    if (reduced) return
    // Small delay so the burst lands as the card settles.
    const t = setTimeout(() => burst(particleForReveal(tagType, element)), 140)
    return () => clearTimeout(t)
  }, [tagType, element, burst, reduced])

  const variants = reduced
    ? { initial: { opacity: 0 }, enter: { opacity: 1, transition: { duration: 0.2 } } }
    : revealVariants(tagType)

  return (
    <div className="reveal-wrap">
      <canvas ref={canvasRef} className="reveal-canvas" aria-hidden />
      <motion.div
        className={`card reveal-card ${className}`}
        style={{ ['--rev' as string]: c, ['--rev-glow' as string]: glow(c, 0.4), transformPerspective: 900 }}
        variants={variants}
        initial="initial"
        animate="enter"
      >
        {!reduced && tagType === 'BATTLE' ? (
          <motion.div animate={battleShake}>{children}</motion.div>
        ) : (
          children
        )}
      </motion.div>
    </div>
  )
}
