/**
 * The 20 physical tags (spec §7). Each has a stable `code` that appears in the NFC/QR URL
 * (`/#/tag?tag=CODE`). The tag itself carries no reward — the app decides the outcome based on
 * the scanning player's element and the tag's definition here.
 *
 * Distribution: 4 Energy, 3 Battle, 3 Alliance, 3 Artifact, 3 Mystery, 2 Legendary, 1 Chaos.
 * Plus 1 Portal tag for the Burza #4 → Bike Jesus transition (§22). Total = 20 codes.
 * Interactive markers (require a follow-up action): 3 Battle + 3 Alliance + Temple + Convergence
 * + Collapse + Chaos = 10.
 */

import type { Element } from './elements'

export type TagType =
  | 'ENERGY'
  | 'BATTLE'
  | 'ALLIANCE'
  | 'ARTIFACT'
  | 'MYSTERY'
  | 'LEGENDARY'
  | 'CHAOS'
  | 'PORTAL'

export type Artifact = 'FLAME_OF_RAGE' | 'HEART_OF_THE_OCEAN' | 'ANCIENT_ROOT' | 'EYE_OF_THE_STORM'

export interface TagDef {
  code: string
  type: TagType
  title: string
  /** Flavor / narrative text shown on scan. */
  description: string
  /**
   * ENERGY: per-element payout. Balanced so every element totals 400 across the 4 energy tags.
   */
  energy?: Record<Element, number>
  /** ARTIFACT: which artifact this tag grants. */
  artifact?: Artifact
  /** MYSTERY / LEGENDARY: requires a full group of all four elements via scan-window. */
  requiresGroup?: boolean
  /** Reward per player when a group tag resolves. */
  groupReward?: number
}

/** Base amounts for battle / alliance (spec §9, §11). */
export const BATTLE_WIN = 150
export const BATTLE_LOSS = 75
export const ALLIANCE_DIFFERENT = 100
export const ALLIANCE_SAME = 25

/** Scan-window duration for group/alliance tags, in seconds (§ decision). */
export const GROUP_WINDOW_SECONDS = 120

export const TAGS: TagDef[] = [
  // ── 💰 ENERGY (4) — balanced: each element sums to 400 across these four ──
  {
    code: 'A11F',
    type: 'ENERGY',
    title: '💎 Elemental Crystal',
    description: 'You found an elemental crystal, humming with raw energy.',
    energy: { FIRE: 100, WATER: 75, EARTH: 125, AIR: 100 },
  },
  {
    code: 'A22E',
    type: 'ENERGY',
    title: '🔥 Ember Cache',
    description: 'A cache of smouldering embers responds to your touch.',
    energy: { FIRE: 125, WATER: 100, EARTH: 100, AIR: 75 },
  },
  {
    code: 'A33S',
    type: 'ENERGY',
    title: '💧 Hidden Spring',
    description: 'A hidden spring bubbles up, its waters answering your call.',
    energy: { FIRE: 100, WATER: 125, EARTH: 75, AIR: 100 },
  },
  {
    code: 'A44Z',
    type: 'ENERGY',
    title: '🌪️ Zephyr Font',
    description: 'A font of swirling wind offers up its power.',
    energy: { FIRE: 75, WATER: 100, EARTH: 100, AIR: 125 },
  },

  // ── ⚔️ BATTLE (3) ── (identical mechanics; multiple tags let people duel in parallel)
  { code: 'B01D', type: 'BATTLE', title: '⚔️ Elemental Battle', description: 'Choose another explorer to challenge.' },
  { code: 'B02D', type: 'BATTLE', title: '⚔️ Elemental Battle', description: 'Choose another explorer to challenge.' },
  { code: 'B03D', type: 'BATTLE', title: '⚔️ Elemental Duel', description: 'Choose another explorer to challenge.' },

  // ── 🤝 ALLIANCE (3) ── pair scan-window; different elements rewarded more (§11)
  { code: 'C01R', type: 'ALLIANCE', title: '🌈 Elemental Balance', description: 'Find a player and both scan within the window.' },
  { code: 'C02R', type: 'ALLIANCE', title: '🌈 Elemental Balance', description: 'Find a player and both scan within the window.' },
  { code: 'C03R', type: 'ALLIANCE', title: '🌈 Elemental Harmony', description: 'Find a player and both scan within the window.' },

  // ── 🧿 ARTIFACT (3) — permanent one-time abilities (§17) ──
  { code: 'D01A', type: 'ARTIFACT', title: '🔥 Flame of Rage', description: 'Once per game: double your next attack.', artifact: 'FLAME_OF_RAGE' },
  { code: 'D02A', type: 'ARTIFACT', title: '💧 Heart of the Ocean', description: 'Once per game: protect yourself and another player from a negative effect.', artifact: 'HEART_OF_THE_OCEAN' },
  { code: 'D03A', type: 'ARTIFACT', title: '🌿 Ancient Root', description: 'Once per game: ignore a trap.', artifact: 'ANCIENT_ROOT' },

  // ── 🧩 MYSTERY (3) — one is the Temple group tag (§18) ──
  {
    code: 'E01T',
    type: 'MYSTERY',
    title: '🗿 The Ancient Temple',
    description: 'The four elements once lived in harmony. Gather one Fire, one Water, one Earth and one Air and all scan within the window.',
    requiresGroup: true,
    groupReward: 200,
  },
  { code: 'E02M', type: 'MYSTERY', title: '📜 Forgotten Scroll', description: 'An old scroll rewards the curious.', energy: { FIRE: 100, WATER: 100, EARTH: 100, AIR: 100 } },
  { code: 'E03M', type: 'MYSTERY', title: '🕯️ Whispering Shrine', description: 'The shrine grants a small boon to all who find it.', energy: { FIRE: 100, WATER: 100, EARTH: 100, AIR: 100 } },

  // ── 👑 LEGENDARY (2) — Bike Jesus only (§24, §25) ──
  {
    code: 'F01C',
    type: 'LEGENDARY',
    title: '⚡ Elemental Convergence',
    description: 'Requires all four elements. If united, the group must choose to SHARE or BETRAY.',
    requiresGroup: true,
    groupReward: 300,
  },
  {
    code: 'F02X',
    type: 'LEGENDARY',
    title: '☄️ The Collapse',
    description: 'You have discovered the final elemental weapon. Choose an element to destroy.',
  },

  // ── 🎲 CHAOS (1) — element doesn't matter (§26) ──
  { code: 'G01H', type: 'CHAOS', title: '🌀 Chaos', description: 'Your element does not matter here. Roll the dice of fate.' },

  // ── 🌑 PORTAL — the transition tag (§22) ──
  { code: 'P0RT', type: 'PORTAL', title: '🌑 The Portal', description: 'The expedition moves. Find the explorers of your element and walk together to the next location.' },
]

export const TAG_BY_CODE: Record<string, TagDef> = Object.fromEntries(TAGS.map((t) => [t.code, t]))

export function getTag(code: string): TagDef | undefined {
  return TAG_BY_CODE[code.toUpperCase()]
}

export const ARTIFACT_INFO: Record<Artifact, { emoji: string; name: string }> = {
  FLAME_OF_RAGE: { emoji: '🔥', name: 'Flame of Rage' },
  HEART_OF_THE_OCEAN: { emoji: '💧', name: 'Heart of the Ocean' },
  ANCIENT_ROOT: { emoji: '🌿', name: 'Ancient Root' },
  EYE_OF_THE_STORM: { emoji: '🌪️', name: 'Eye of the Storm' },
}

/**
 * Visual theme per tag type, used by the printable sticker sheet. Each type gets an emblem,
 * a short kind label and an accent hue so the physical stickers read like a fantasy card set.
 */
export const TAG_THEME: Record<TagType, { emblem: string; kind: string; accent: string; hint: string }> = {
  ENERGY: { emblem: '💎', kind: 'Energy Relic', accent: '#e0a53a', hint: 'Scan to absorb its power' },
  BATTLE: { emblem: '⚔️', kind: 'Battle Rune', accent: '#c0392b', hint: 'Scan, then choose a rival' },
  ALLIANCE: { emblem: '🤝', kind: 'Alliance Seal', accent: '#2e86c1', hint: 'Two must scan together' },
  ARTIFACT: { emblem: '🧿', kind: 'Ancient Artifact', accent: '#8e44ad', hint: 'Claim a one-time power' },
  MYSTERY: { emblem: '🧩', kind: 'Mystery Sigil', accent: '#16a085', hint: 'Fortune favours the curious' },
  LEGENDARY: { emblem: '👑', kind: 'Legendary Mark', accent: '#b7791f', hint: 'Bike Jesus only — immense power' },
  CHAOS: { emblem: '🎲', kind: 'Chaos Glyph', accent: '#d35400', hint: 'Roll the dice of fate' },
  PORTAL: { emblem: '🌀', kind: 'The Portal', accent: '#5b3fb0', hint: 'Cross to the next realm' },
}
