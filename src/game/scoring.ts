/**
 * Pure scoring functions (spec §8–15, §24–26, §37). No I/O — callers apply the returned
 * deltas to the database. Keeping this pure makes the mechanics testable and keeps reward math
 * in one place (light anti-cheat: the browser still calls these, but they are centralized).
 */

import { beats, type Element } from './elements'
import { ALLIANCE_DIFFERENT, ALLIANCE_SAME, BATTLE_LOSS, BATTLE_WIN } from './tags'

export const STARTING_ENERGY = 100

/** A single score change to apply to one player. */
export interface Delta {
  playerId: string
  amount: number
  /** Whether this delta is negative and therefore shieldable. */
  negative?: boolean
}

/** Battle resolution (§9). Attacker picked defender; the circle decides the winner. */
export function resolveBattle(
  attacker: { id: string; element: Element },
  defender: { id: string; element: Element },
): { deltas: Delta[]; summary: string; attackerWon: boolean } {
  const attackerWins = beats(attacker.element, defender.element)
  const defenderWins = beats(defender.element, attacker.element)

  if (attackerWins) {
    return {
      attackerWon: true,
      summary: `${attacker.element} defeats ${defender.element}`,
      deltas: [
        { playerId: attacker.id, amount: BATTLE_WIN },
        { playerId: defender.id, amount: -BATTLE_LOSS, negative: true },
      ],
    }
  }
  if (defenderWins) {
    return {
      attackerWon: false,
      summary: `${defender.element} defeats ${attacker.element}`,
      deltas: [
        { playerId: attacker.id, amount: -BATTLE_LOSS, negative: true },
        { playerId: defender.id, amount: BATTLE_WIN },
      ],
    }
  }
  // Same or non-adjacent (only same is possible with 4 elements): a draw.
  return {
    attackerWon: false,
    summary: `${attacker.element} clashes with ${defender.element} — a draw`,
    deltas: [
      { playerId: attacker.id, amount: 0 },
      { playerId: defender.id, amount: 0 },
    ],
  }
}

/** Alliance resolution (§11): different elements are rewarded more than same. */
export function resolveAlliance(a: Element, b: Element): { each: number; different: boolean } {
  const different = a !== b
  return { each: different ? ALLIANCE_DIFFERENT : ALLIANCE_SAME, different }
}

/**
 * Apply a shield to a negative amount (§14–15). Water/Earth shields fully block; Earth "Roots"
 * halves. We model a single `shield_active` flag that fully blocks the next negative for
 * simplicity, but expose `mode` so callers can pick behaviour.
 */
export function applyShield(amount: number, mode: 'block' | 'half' = 'block'): number {
  if (amount >= 0) return amount
  return mode === 'block' ? 0 : Math.round(amount / 2)
}

export type FinalChoice = 'STABILITY' | 'POWER' | 'CHAOS'

/**
 * Final gamble (§37) with explicit odds:
 *   STABILITY: keep score.
 *   POWER:  50% → +75% of score, else −25%.
 *   CHAOS:  33% → ×3 (i.e. +200%), else −50%.
 * `roll` is a 0..1 random supplied by the caller so this stays pure/testable.
 */
export function resolveFinalGamble(score: number, choice: FinalChoice, roll: number): { newScore: number; won: boolean } {
  switch (choice) {
    case 'STABILITY':
      return { newScore: score, won: true }
    case 'POWER': {
      const won = roll < 0.5
      return { newScore: Math.round(score * (won ? 1.75 : 0.75)), won }
    }
    case 'CHAOS': {
      const won = roll < 1 / 3
      return { newScore: Math.round(score * (won ? 3 : 0.5)), won }
    }
  }
}

export type ChaosOutcome = 'PLUS_100' | 'MINUS_100' | 'JACKPOT' | 'HALVED'

/** Chaos tag (§26). Weighted so the +500 jackpot is rare. `roll` is 0..1. */
export function resolveChaos(score: number, roll: number): { outcome: ChaosOutcome; delta: number; newScore: number } {
  // 40% +100, 30% -100, 5% jackpot +500, 25% halve
  let outcome: ChaosOutcome
  if (roll < 0.4) outcome = 'PLUS_100'
  else if (roll < 0.7) outcome = 'MINUS_100'
  else if (roll < 0.75) outcome = 'JACKPOT'
  else outcome = 'HALVED'

  switch (outcome) {
    case 'PLUS_100':
      return { outcome, delta: 100, newScore: score + 100 }
    case 'MINUS_100':
      return { outcome, delta: -100, newScore: score - 100 }
    case 'JACKPOT':
      return { outcome, delta: 500, newScore: score + 500 }
    case 'HALVED': {
      const newScore = Math.round(score / 2)
      return { outcome, delta: newScore - score, newScore }
    }
  }
}

/** Convergence choice (§24). */
export function resolveConvergence(
  members: { id: string }[],
  betrayerId: string | null,
): Delta[] {
  if (!betrayerId) {
    // SHARE: everyone keeps +300.
    return members.map((m) => ({ playerId: m.id, amount: 300 }))
  }
  // BETRAY: betrayer +600, everyone else +150.
  return members.map((m) => ({ playerId: m.id, amount: m.id === betrayerId ? 600 : 150 }))
}
