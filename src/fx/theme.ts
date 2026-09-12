/**
 * Central visual theme lookups for the arcane UI. This wraps the game's source-of-truth data
 * (ELEMENT_INFO, TAG_THEME) so animation/skin components can resolve an accent + glow color for any
 * element or tag type without duplicating the game data. Logic files stay untouched.
 */

import { ELEMENT_INFO, type Element } from '../game/elements'
import { TAG_THEME, type TagType } from '../game/tags'

/** Accent hex for an element (mirrors the game's element colors). */
export function elementColor(el: Element): string {
  return ELEMENT_INFO[el].color
}

/** Accent hex for a tag type (mirrors the sticker theme accents). */
export function tagColor(type: TagType): string {
  return TAG_THEME[type].accent
}

/** A soft rgba glow derived from a hex color, for box-shadows / auras. */
export function glow(hex: string, alpha = 0.4): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** The particle preset key used by useParticles for a given tag type. */
export type ParticleKind =
  | Element // element bursts (fire/water/earth/air)
  | 'ARTIFACT'
  | 'MYSTERY'
  | 'CHAOS'
  | 'PORTAL'
  | 'LEGENDARY'
  | 'BATTLE'
  | 'ALLIANCE'
  | 'GOLD'

/**
 * Choose the particle burst for a reveal. Type-specific flavors take priority; otherwise the
 * player's element decides (energy, etc.).
 */
export function particleForReveal(type: TagType | undefined, element: Element): ParticleKind {
  switch (type) {
    case 'ARTIFACT':
      return 'ARTIFACT'
    case 'POISON':
      // No dedicated poison preset — the murky chaos burst reads as a curse well enough.
      return 'CHAOS'
    case 'MYSTERY':
      return 'MYSTERY'
    case 'CHAOS':
      return 'CHAOS'
    case 'PORTAL':
      return 'PORTAL'
    case 'LEGENDARY':
      return 'LEGENDARY'
    case 'BATTLE':
      return 'BATTLE'
    case 'ALLIANCE':
      return 'ALLIANCE'
    default:
      return element
  }
}
