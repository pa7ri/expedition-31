/**
 * Framer-motion variant presets shared across the arcane UI. Keeping them in one place makes the
 * reveal animations consistent and easy to tune. All variants animate transform/opacity only
 * (compositor-friendly) so they stay smooth on phones.
 */

import type { Variants, Transition, TargetAndTransition } from 'framer-motion'
import type { TagType } from '../game/tags'

const spring: Transition = { type: 'spring', stiffness: 320, damping: 24 }

/** Route-level page transition. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
}

/** Generic card rise-in used by most panels. */
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.98 },
  enter: { opacity: 1, y: 0, scale: 1, transition: spring },
}

/** Staggered list container + item, for history rows / leaderboard / choice cards. */
export const listContainer: Variants = {
  enter: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}
export const listItem: Variants = {
  initial: { opacity: 0, x: -14 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

/** Press feedback for buttons/tiles. */
export const pressable = {
  whileTap: { scale: 0.96 },
  whileHover: { scale: 1.015 },
}

/**
 * The reveal animation for a scanned marker, chosen by tag type. Each returns a Variants object
 * with `initial` and `enter`. Under reduced motion the caller collapses these to a plain fade.
 */
export function revealVariants(type: TagType | undefined): Variants {
  switch (type) {
    case 'BATTLE':
      // Clash: snap in from a slight zoom with a shake handled separately.
      return {
        initial: { opacity: 0, scale: 1.15 },
        enter: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 18 } },
      }
    case 'ARTIFACT':
      // Rise from below, opening like a chest.
      return {
        initial: { opacity: 0, y: 40, rotateX: 55 },
        enter: { opacity: 1, y: 0, rotateX: 0, transition: { ...spring, stiffness: 260 } },
      }
    case 'MYSTERY':
      // Fog dissolve: blur-like fade + gentle rise (blur via CSS filter on the element).
      return {
        initial: { opacity: 0, scale: 1.06, filter: 'blur(10px)' },
        enter: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: 'easeOut' } },
      }
    case 'CHAOS':
      // Spin-in like a tumbling die.
      return {
        initial: { opacity: 0, rotate: -140, scale: 0.5 },
        enter: { opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 16 } },
      }
    case 'PORTAL':
      // Spiral warp inward.
      return {
        initial: { opacity: 0, rotate: 90, scale: 0.3 },
        enter: { opacity: 1, rotate: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
      }
    case 'LEGENDARY':
      // Grand starburst emergence.
      return {
        initial: { opacity: 0, scale: 0.6, y: 20 },
        enter: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
      }
    case 'ALLIANCE':
      // Two halves converging → settle.
      return {
        initial: { opacity: 0, scale: 0.9 },
        enter: { opacity: 1, scale: 1, transition: { ...spring } },
      }
    case 'ENERGY':
    default:
      // Flip/rise reveal.
      return {
        initial: { opacity: 0, y: 30, rotateX: 40 },
        enter: { opacity: 1, y: 0, rotateX: 0, transition: spring },
      }
  }
}

/** A subtle shake keyframe track for battle reveals (transform only). */
export const battleShake: TargetAndTransition = {
  x: [0, -8, 7, -5, 4, 0],
  transition: { duration: 0.42, ease: 'easeInOut' },
}
