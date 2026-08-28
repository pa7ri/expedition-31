/**
 * The element system — the single source of truth for elemental relationships.
 *
 * The circle (per spec §10):
 *   🔥 FIRE  >  🌪️ AIR  >  🌿 EARTH  >  💧 WATER  >  🔥 FIRE
 * Each element BEATS the next one clockwise, and LOSES to the previous one.
 * (The diagram in §1 of the brief is superseded by this circle.)
 */

export type Element = 'FIRE' | 'WATER' | 'EARTH' | 'AIR'

export const ELEMENTS: Element[] = ['FIRE', 'WATER', 'EARTH', 'AIR']

/** Clockwise circle used for beat/lose resolution. */
const CIRCLE: Element[] = ['FIRE', 'AIR', 'EARTH', 'WATER']

export interface ElementInfo {
  key: Element
  label: string
  emoji: string
  /** CSS accent color (hex). */
  color: string
  /** Short personality line shown at registration. */
  personality: string
  /** One-time artifact granted to this element's flavor. */
  artifactName: string
}

export const ELEMENT_INFO: Record<Element, ElementInfo> = {
  FIRE: {
    key: 'FIRE',
    label: 'Fire',
    emoji: '🔥',
    color: '#ff5b35',
    personality: 'Aggressive, risky, competitive. Fire attacks, steals and gambles.',
    artifactName: 'Flame of Rage',
  },
  WATER: {
    key: 'WATER',
    label: 'Water',
    emoji: '💧',
    color: '#3aa0ff',
    personality: 'Diplomatic, cooperative, adaptable. Water forms alliances and protects.',
    artifactName: 'Heart of the Ocean',
  },
  EARTH: {
    key: 'EARTH',
    label: 'Earth',
    emoji: '🌿',
    color: '#4caf6d',
    personality: 'Defensive, stable, resourceful. Earth protects points and resists traps.',
    artifactName: 'Ancient Root',
  },
  AIR: {
    key: 'AIR',
    label: 'Air',
    emoji: '🌪️',
    color: '#b98cff',
    personality: 'Fast, chaotic, unpredictable. Air moves, steals clues and manipulates.',
    artifactName: 'Eye of the Storm',
  },
}

/** The element that `el` defeats. */
export function beatsElement(el: Element): Element {
  const i = CIRCLE.indexOf(el)
  return CIRCLE[(i + 1) % CIRCLE.length]
}

/** The element that defeats `el`. */
export function losesToElement(el: Element): Element {
  const i = CIRCLE.indexOf(el)
  return CIRCLE[(i - 1 + CIRCLE.length) % CIRCLE.length]
}

/** True if attacker beats defender in the circle. */
export function beats(attacker: Element, defender: Element): boolean {
  return beatsElement(attacker) === defender
}

export function elementEmoji(el: Element): string {
  return ELEMENT_INFO[el].emoji
}

export function elementLabel(el: Element): string {
  return ELEMENT_INFO[el].label
}

/** Human-readable power summary for the profile card (spec §3). */
export function powerLines(el: Element): { defeats: string; vulnerable: string } {
  const info = ELEMENT_INFO[el]
  const strong = ELEMENT_INFO[beatsElement(el)]
  const weak = ELEMENT_INFO[losesToElement(el)]
  return {
    defeats: `${info.emoji} ${info.label} can defeat ${strong.emoji} ${strong.label}`,
    vulnerable: `${info.emoji} ${info.label} is vulnerable to ${weak.emoji} ${weak.label}`,
  }
}
