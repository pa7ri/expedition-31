/**
 * Secret element missions (spec §19). Each player gets one private mission based on their element,
 * worth +150 when completed. Completion is confirmed by the admin (auto-detection would require
 * intent-reading the game does not have), keeping this simple and un-gameable.
 */

import type { Element } from './elements'

export const MISSION_REWARD = 150

export const SECRET_MISSION: Record<Element, string> = {
  FIRE: 'Convince someone to challenge you in a battle.',
  WATER: 'Form an alliance with someone from another element.',
  EARTH: 'Successfully protect another player from a negative effect.',
  AIR: 'Get someone to change their plan.',
}
