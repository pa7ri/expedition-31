/**
 * Game phases (spec §20–25, §30, §37) and which tag types can be scanned in each.
 * Phases advance one-way via the admin panel.
 */

import type { TagType } from './tags'

export type Phase = 'SETUP' | 'BAR_1' | 'TRANSITION' | 'BAR_2' | 'FINAL' | 'ENDED'

export const PHASE_ORDER: Phase[] = ['SETUP', 'BAR_1', 'TRANSITION', 'BAR_2', 'FINAL', 'ENDED']

export const PHASE_LABEL: Record<Phase, string> = {
  SETUP: 'Setup — registration only',
  BAR_1: 'Bar 1 — Element Awakening',
  TRANSITION: 'Transition — the Portal',
  BAR_2: 'Bar 2 — Elemental War',
  FINAL: 'Final — the Collapse',
  ENDED: 'Ended',
}

/**
 * Which tag types are scannable in each phase.
 * PORTAL is the physical transition tag; ENERGY/BATTLE/ALLIANCE/ARTIFACT/MYSTERY run in both bars;
 * LEGENDARY only unlocks in Bar 2; CHAOS is available once the game is live.
 */
const SCANNABLE: Record<Phase, TagType[]> = {
  SETUP: [],
  BAR_1: ['ENERGY', 'BATTLE', 'ALLIANCE', 'ARTIFACT', 'MYSTERY', 'CHAOS'],
  TRANSITION: ['PORTAL'],
  BAR_2: ['ENERGY', 'BATTLE', 'ALLIANCE', 'ARTIFACT', 'MYSTERY', 'LEGENDARY', 'CHAOS'],
  FINAL: [],
  ENDED: [],
}

export function canScan(type: TagType, phase: Phase): boolean {
  return SCANNABLE[phase].includes(type)
}

export function nextPhase(phase: Phase): Phase | null {
  const i = PHASE_ORDER.indexOf(phase)
  return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : null
}
