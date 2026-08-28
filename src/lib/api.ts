/**
 * All database reads/writes and tag resolution live here. UI pages call these functions and
 * never touch Supabase directly. Reward math comes from src/game/scoring.ts.
 */

import type { Element } from '../game/elements'
import { MISSION_REWARD } from '../game/challenges'
import type { Phase } from '../game/phases'
import { canScan } from '../game/phases'
import {
  ARTIFACT_INFO,
  GROUP_WINDOW_SECONDS,
  getTag,
  type Artifact,
  type TagDef,
} from '../game/tags'
import {
  applyShield,
  resolveAlliance,
  resolveBattle,
  resolveChaos,
  resolveConvergence,
  resolveFinalGamble,
  STARTING_ENERGY,
  type Delta,
  type FinalChoice,
} from '../game/scoring'
import { supabase } from './supabase'

export interface Player {
  id: string
  name: string
  element: Element
  score: number
  frozen: boolean
  session_token: string
  created_at: string
}

export interface InventoryItem {
  id: string
  player_id: string
  artifact: Artifact
  used: boolean
  shield_active: boolean
}

export interface GameEvent {
  id: string
  type: string
  source_player: string | null
  target_player: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface TagResult {
  ok: boolean
  title: string
  message: string
  delta?: number
  /** Signals the UI to render an interactive step (pick target, choose share/betray, etc.). */
  interactive?: 'BATTLE_PICK' | 'ALLIANCE_WAIT' | 'GROUP_WAIT' | 'CONVERGENCE_CHOICE' | 'COLLAPSE_CHOICE' | 'CHAOS_ROLL'
  tag?: TagDef
}

// ── Players ──────────────────────────────────────────────────────────────

export async function getPlayerByToken(token: string): Promise<Player | null> {
  const { data } = await supabase.from('players').select('*').eq('session_token', token).maybeSingle()
  return (data as Player) ?? null
}

export async function registerPlayer(name: string, element: Element, token: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ name: name.trim(), element, session_token: token, score: STARTING_ENERGY })
    .select('*')
    .single()
  if (error) throw error
  return data as Player
}

export async function listPlayers(): Promise<Player[]> {
  const { data } = await supabase.from('players').select('*').order('score', { ascending: false })
  return (data as Player[]) ?? []
}

/** Leaderboard rows — public info only (name, element, score, rank). */
export interface LeaderRow {
  id: string
  name: string
  element: Element
  score: number
  rank: number
}

export async function leaderboard(): Promise<LeaderRow[]> {
  const players = await listPlayers()
  return players.map((p, i) => ({ id: p.id, name: p.name, element: p.element, score: p.score, rank: i + 1 }))
}

export async function playerRank(playerId: string): Promise<number> {
  const board = await leaderboard()
  return board.find((r) => r.id === playerId)?.rank ?? board.length
}

// ── Scoring primitives ─────────────────────────────────────────────────────

/** Apply a delta to one player, honoring an active shield for negatives. Returns new score. */
async function applyDelta(d: Delta): Promise<number> {
  const { data: player } = await supabase.from('players').select('id,score,frozen').eq('id', d.playerId).single()
  if (!player) return 0
  if ((player as Player).frozen) return (player as Player).score

  let amount = d.amount
  if (d.negative && amount < 0) {
    const { data: inv } = await supabase
      .from('inventory')
      .select('id,shield_active')
      .eq('player_id', d.playerId)
      .eq('shield_active', true)
      .limit(1)
      .maybeSingle()
    if (inv) {
      amount = applyShield(amount, 'block')
      await supabase.from('inventory').update({ shield_active: false }).eq('id', (inv as InventoryItem).id)
    }
  }
  const newScore = (player as Player).score + amount
  await supabase.from('players').update({ score: newScore }).eq('id', d.playerId)
  return newScore
}

async function logEvent(
  type: string,
  source: string | null,
  target: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await supabase.from('events').insert({ type, source_player: source, target_player: target, metadata: metadata ?? null })
}

async function alreadyScanned(playerId: string, code: string): Promise<boolean> {
  const { data } = await supabase
    .from('scans')
    .select('id')
    .eq('player_id', playerId)
    .eq('tag_code', code)
    .limit(1)
    .maybeSingle()
  return Boolean(data)
}

async function recordScan(playerId: string, code: string, result: Record<string, unknown>): Promise<void> {
  await supabase.from('scans').insert({ player_id: playerId, tag_code: code, result })
}

// ── Game state ──────────────────────────────────────────────────────────────

export async function getPhase(): Promise<Phase> {
  const { data } = await supabase.from('game_state').select('phase').eq('id', 1).single()
  return ((data as { phase: Phase })?.phase) ?? 'SETUP'
}

export async function setPhase(phase: Phase): Promise<void> {
  await supabase.from('game_state').update({ phase }).eq('id', 1)
}

// ── Tag resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a simple (non-interactive) scan: energy, artifact, or opening an interactive flow.
 * Interactive tags return `interactive` and the caller drives the follow-up (see functions below).
 */
export async function resolveScan(player: Player, code: string): Promise<TagResult> {
  const tag = getTag(code)
  if (!tag) return { ok: false, title: 'Unknown marker', message: 'This marker is not part of the expedition.' }

  const phase = await getPhase()
  if (!canScan(tag.type, phase)) {
    return { ok: false, title: tag.title, message: 'This marker is dormant right now. Come back later.', tag }
  }

  // One-scan enforcement for non-group tags.
  const groupish = tag.type === 'ALLIANCE' || tag.requiresGroup
  if (!groupish && (await alreadyScanned(player.id, code))) {
    return { ok: false, title: tag.title, message: 'You have already discovered this marker.', tag }
  }

  switch (tag.type) {
    case 'ENERGY':
    case 'MYSTERY':
      if (tag.requiresGroup) return { ok: true, title: tag.title, message: tag.description, interactive: 'GROUP_WAIT', tag }
      return resolveEnergy(player, tag)
    case 'ARTIFACT':
      return resolveArtifact(player, tag)
    case 'BATTLE':
      return { ok: true, title: tag.title, message: tag.description, interactive: 'BATTLE_PICK', tag }
    case 'ALLIANCE':
      return { ok: true, title: tag.title, message: tag.description, interactive: 'ALLIANCE_WAIT', tag }
    case 'LEGENDARY':
      if (tag.code === 'F01C') return { ok: true, title: tag.title, message: tag.description, interactive: 'GROUP_WAIT', tag }
      return { ok: true, title: tag.title, message: tag.description, interactive: 'COLLAPSE_CHOICE', tag }
    case 'CHAOS':
      return { ok: true, title: tag.title, message: tag.description, interactive: 'CHAOS_ROLL', tag }
    case 'PORTAL':
      await recordScan(player.id, code, { type: 'PORTAL' })
      await logEvent('PORTAL', player.id, null)
      return { ok: true, title: tag.title, message: 'The portal accepts you. Gather your element and cross together.', tag }
  }
}

async function resolveEnergy(player: Player, tag: TagDef): Promise<TagResult> {
  const amount = tag.energy ? tag.energy[player.element] : 0
  await applyDelta({ playerId: player.id, amount })
  await recordScan(player.id, tag.code, { type: 'ENERGY', amount })
  await logEvent('ENERGY', player.id, null, { code: tag.code, amount })
  return { ok: true, title: tag.title, message: `${tag.description}`, delta: amount, tag }
}

async function resolveArtifact(player: Player, tag: TagDef): Promise<TagResult> {
  const artifact = tag.artifact!
  const { error } = await supabase.from('inventory').insert({ player_id: player.id, artifact })
  if (error) {
    // unique(player_id, artifact) → already owned.
    return { ok: false, title: tag.title, message: 'You already carry this artifact.', tag }
  }
  await recordScan(player.id, tag.code, { type: 'ARTIFACT', artifact })
  await logEvent('ARTIFACT', player.id, null, { artifact })
  const info = ARTIFACT_INFO[artifact]
  return { ok: true, title: tag.title, message: `${info.emoji} You obtained the ${info.name}. ${tag.description}`, tag }
}

// ── Interactive follow-ups ───────────────────────────────────────────────────

/** BATTLE: attacker picks a defender. */
export async function submitBattle(attacker: Player, code: string, defenderId: string): Promise<TagResult> {
  const tag = getTag(code)!
  if (await alreadyScanned(attacker.id, code)) {
    return { ok: false, title: tag.title, message: 'You have already fought at this marker.', tag }
  }
  const { data: def } = await supabase.from('players').select('*').eq('id', defenderId).single()
  const defender = def as Player
  const { deltas, summary, attackerWon } = resolveBattle(
    { id: attacker.id, element: attacker.element },
    { id: defender.id, element: defender.element },
  )
  for (const d of deltas) await applyDelta(d)
  await recordScan(attacker.id, code, { type: 'BATTLE', defenderId, summary })
  await logEvent('BATTLE', attacker.id, defender.id, { summary, attackerWon })
  const mine = deltas.find((d) => d.playerId === attacker.id)!.amount
  return {
    ok: true,
    title: tag.title,
    message: `${summary}. ${attackerWon ? 'Victory!' : mine < 0 ? 'You were defeated.' : 'A draw.'}`,
    delta: mine,
    tag,
  }
}

/**
 * ALLIANCE / group scan-window. First scanner opens a session; later scanners join. When the
 * required members are present the session resolves and everyone is rewarded once.
 */
export async function joinGroup(player: Player, code: string): Promise<TagResult> {
  const tag = getTag(code)!
  const now = Date.now()

  // Find an open, unresolved, unexpired session for this tag.
  const { data: sessions } = await supabase
    .from('group_sessions')
    .select('*')
    .eq('tag_code', code)
    .eq('resolved', false)
    .order('opened_at', { ascending: false })
    .limit(1)

  type GS = { id: string; members: { player_id: string; element: Element; name: string }[]; expires_at: string }
  let session = (sessions as GS[] | null)?.[0]

  if (!session || new Date(session.expires_at).getTime() < now) {
    const expires = new Date(now + GROUP_WINDOW_SECONDS * 1000).toISOString()
    const { data } = await supabase
      .from('group_sessions')
      .insert({ tag_code: code, expires_at: expires, members: [] })
      .select('*')
      .single()
    session = data as GS
  }

  const members = session.members ?? []
  if (!members.some((m) => m.player_id === player.id)) {
    members.push({ player_id: player.id, element: player.element, name: player.name })
    await supabase.from('group_sessions').update({ members }).eq('id', session.id)
  }

  const isAlliance = tag.type === 'ALLIANCE'
  if (isAlliance) {
    // Need any two players; reward on the pair.
    if (members.length >= 2) {
      return await resolveGroupSession(session.id, tag, members)
    }
    return { ok: true, title: tag.title, message: `Waiting for a partner… (${members.length}/2). Have them scan within ${GROUP_WINDOW_SECONDS}s.`, interactive: 'ALLIANCE_WAIT', tag }
  }

  // requiresGroup: need all four elements.
  const distinct = new Set(members.map((m) => m.element))
  if (distinct.size >= 4) {
    return await resolveGroupSession(session.id, tag, members)
  }
  const have = [...distinct].join(' ')
  return {
    ok: true,
    title: tag.title,
    message: `The elements gather (${distinct.size}/4: ${have}). Bring the missing elements to scan within ${GROUP_WINDOW_SECONDS}s.`,
    interactive: tag.code === 'F01C' ? 'CONVERGENCE_CHOICE' : 'GROUP_WAIT',
    tag,
  }
}

async function resolveGroupSession(
  sessionId: string,
  tag: TagDef,
  members: { player_id: string; element: Element; name: string }[],
): Promise<TagResult> {
  await supabase.from('group_sessions').update({ resolved: true }).eq('id', sessionId)

  if (tag.type === 'ALLIANCE') {
    const [a, b] = members
    const { each, different } = resolveAlliance(a.element, b.element)
    for (const m of members.slice(0, 2)) {
      await applyDelta({ playerId: m.player_id, amount: each })
      await recordScan(m.player_id, tag.code, { type: 'ALLIANCE', each, different })
    }
    await logEvent('ALLIANCE', a.player_id, b.player_id, { each, different })
    return { ok: true, title: tag.title, message: different ? `Elemental balance! Different elements. +${each} each.` : `Same element. +${each} each.`, delta: each, tag }
  }

  if (tag.code === 'F01C') {
    // Convergence resolves interactively (share/betray) — the UI calls submitConvergence.
    return { ok: true, title: tag.title, message: 'The four elements have united! The group must now choose: SHARE or BETRAY.', interactive: 'CONVERGENCE_CHOICE', tag }
  }

  // Temple / generic full-group reward.
  const reward = tag.groupReward ?? 200
  for (const m of members) {
    await applyDelta({ playerId: m.player_id, amount: reward })
    await recordScan(m.player_id, tag.code, { type: 'GROUP', reward })
  }
  await logEvent('GROUP', members[0].player_id, null, { code: tag.code, reward, size: members.length })
  return { ok: true, title: tag.title, message: `The four elements unite! +${reward} each.`, delta: reward, tag }
}

/** Convergence choice (§24): pass betrayerId=null for SHARE, or a player id for BETRAY. */
export async function submitConvergence(code: string, betrayerId: string | null): Promise<TagResult> {
  const tag = getTag(code)!
  const { data: sessions } = await supabase
    .from('group_sessions')
    .select('*')
    .eq('tag_code', code)
    .order('opened_at', { ascending: false })
    .limit(1)
  const session = (sessions as { members: { player_id: string }[] }[] | null)?.[0]
  if (!session) return { ok: false, title: tag.title, message: 'No convergence group found.', tag }

  const deltas = resolveConvergence(session.members.map((m) => ({ id: m.player_id })), betrayerId)
  for (const d of deltas) {
    await applyDelta(d)
    await recordScan(d.playerId, code, { type: 'CONVERGENCE', amount: d.amount, betrayerId })
  }
  await logEvent('CONVERGENCE', betrayerId, null, { betrayerId, share: !betrayerId })
  return {
    ok: true,
    title: tag.title,
    message: betrayerId ? 'Betrayal! One explorer takes +600, the rest +150.' : 'The group shares the power. +300 each.',
    tag,
  }
}

/** COLLAPSE (§25): destroy one element — all its players lose 150. */
export async function submitCollapse(player: Player, code: string, target: Element): Promise<TagResult> {
  const tag = getTag(code)!
  if (await alreadyScanned(player.id, code)) {
    return { ok: false, title: tag.title, message: 'The weapon has already been used by you.', tag }
  }
  const { data } = await supabase.from('players').select('id').eq('element', target)
  const victims = (data as { id: string }[]) ?? []
  for (const v of victims) await applyDelta({ playerId: v.id, amount: -150, negative: true })
  await recordScan(player.id, code, { type: 'COLLAPSE', target })
  await logEvent('COLLAPSE', player.id, null, { target, count: victims.length })
  return { ok: true, title: tag.title, message: `☄️ The Collapse strikes ${target}! ${victims.length} explorer(s) lose 150.`, tag }
}

/** CHAOS (§26): weighted dice. */
export async function submitChaos(player: Player, code: string): Promise<TagResult> {
  const tag = getTag(code)!
  if (await alreadyScanned(player.id, code)) {
    return { ok: false, title: tag.title, message: 'Chaos does not answer twice.', tag }
  }
  const { outcome, delta } = resolveChaos(player.score, Math.random())
  await applyDelta({ playerId: player.id, amount: delta, negative: delta < 0 })
  await recordScan(player.id, code, { type: 'CHAOS', outcome, delta })
  await logEvent('CHAOS', player.id, null, { outcome, delta })
  const label: Record<string, string> = {
    PLUS_100: 'Fortune smiles: +100!',
    MINUS_100: 'A cruel wind: −100.',
    JACKPOT: '🏆 JACKPOT! +500!',
    HALVED: '🥶 The chaos halves your score.',
  }
  return { ok: true, title: tag.title, message: label[outcome], delta, tag }
}

// ── Inventory / artifacts ────────────────────────────────────────────────────

export async function getInventory(playerId: string): Promise<InventoryItem[]> {
  const { data } = await supabase.from('inventory').select('*').eq('player_id', playerId)
  return (data as InventoryItem[]) ?? []
}

/** Grant a shield to self (used by Water/Earth defensive artifacts). */
export async function activateShield(playerId: string, artifact: Artifact): Promise<void> {
  await supabase.from('inventory').update({ shield_active: true, used: true }).eq('player_id', playerId).eq('artifact', artifact)
  await logEvent('SHIELD', playerId, null, { artifact })
}

// ── Final gamble (§37) ───────────────────────────────────────────────────────

export async function submitFinalGamble(player: Player, choice: FinalChoice): Promise<{ newScore: number; won: boolean }> {
  const { newScore, won } = resolveFinalGamble(player.score, choice, Math.random())
  await supabase.from('players').update({ score: newScore }).eq('id', player.id)
  await logEvent('FINAL_GAMBLE', player.id, null, { choice, won, from: player.score, to: newScore })
  return { newScore, won }
}

// ── Admin ─────────────────────────────────────────────────────────────────

export async function adminAdjust(playerId: string, amount: number): Promise<void> {
  const { data } = await supabase.from('players').select('score').eq('id', playerId).single()
  const score = ((data as { score: number })?.score ?? 0) + amount
  await supabase.from('players').update({ score }).eq('id', playerId)
  await logEvent('ADMIN_ADJUST', null, playerId, { amount })
}

export async function adminSetFrozen(playerId: string, frozen: boolean): Promise<void> {
  await supabase.from('players').update({ frozen }).eq('id', playerId)
  await logEvent('ADMIN_FREEZE', null, playerId, { frozen })
}

export async function adminCompleteMission(playerId: string): Promise<void> {
  await adminAdjust(playerId, MISSION_REWARD)
  await logEvent('MISSION_COMPLETE', null, playerId, { reward: MISSION_REWARD })
}

export async function adminSetTagActive(code: string, active: boolean): Promise<void> {
  await supabase.from('tags').update({ active }).eq('code', code)
}

export async function listEvents(limit = 50): Promise<GameEvent[]> {
  const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(limit)
  return (data as GameEvent[]) ?? []
}

/** Reset the game: wipe players/scans/inventory/events/groups and return to SETUP. */
export async function adminResetGame(): Promise<void> {
  await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('scans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('group_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('players').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await setPhase('SETUP')
}
