import type { GameEvent } from '../lib/api'

export interface FormattedEvent {
  icon: string
  text: string
  /** Energy change for this player, if any. */
  delta?: number
  time: string
}

/**
 * Turn a raw event row into a readable line from `playerId`'s perspective.
 * `nameOf` resolves the *other* player's id to a display name.
 */
export function formatEvent(e: GameEvent, playerId: string, nameOf: (id: string | null) => string): FormattedEvent {
  const m = (e.metadata ?? {}) as Record<string, unknown>
  const isSource = e.source_player === playerId
  const num = (v: unknown) => (typeof v === 'number' ? v : undefined)
  const time = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  switch (e.type) {
    case 'ENERGY':
      return { icon: '⚡', text: 'Found energy', delta: num(m.amount), time }
    case 'ARTIFACT':
      return { icon: '🧿', text: `Obtained ${String(m.artifact ?? 'an artifact').replace(/_/g, ' ').toLowerCase()}`, time }
    case 'BATTLE': {
      const other = nameOf(isSource ? e.target_player : e.source_player)
      const delta = isSource ? num(m.sourceAmount) : num(m.targetAmount)
      const won = delta != null && delta > 0
      const verb = isSource ? (won ? 'Defeated' : delta === 0 ? 'Drew with' : 'Lost to') : won ? 'Defeated' : delta === 0 ? 'Drew with' : 'Was defeated by'
      return { icon: '⚔️', text: `${verb} ${other}`, delta, time }
    }
    case 'ALLIANCE': {
      const other = nameOf(isSource ? e.target_player : e.source_player)
      return { icon: '🤝', text: `Allied with ${other}`, delta: num(m.each), time }
    }
    case 'GROUP':
      return { icon: '🗿', text: 'United the four elements', delta: num(m.amount ?? m.reward), time }
    case 'CONVERGENCE':
      return {
        icon: '⚡',
        text: m.betrayed ? 'Betrayed the convergence' : m.share ? 'Shared the convergence' : 'Survived a betrayal',
        delta: num(m.amount),
        time,
      }
    case 'COLLAPSE':
      return m.triggered
        ? { icon: '☄️', text: `Unleashed the Collapse on ${String(m.target ?? '')}`, time }
        : { icon: '☄️', text: 'Struck by the Collapse', delta: num(m.amount), time }
    case 'CHAOS':
      return { icon: '🌀', text: `Chaos: ${String(m.outcome ?? '').replace(/_/g, ' ').toLowerCase()}`, delta: num(m.delta), time }
    case 'SHIELD':
      return { icon: '🛡️', text: 'Raised a shield', time }
    case 'FINAL_GAMBLE':
      return { icon: '🎲', text: `Final gamble (${String(m.choice ?? '')})`, delta: num(m.to) != null && num(m.from) != null ? (m.to as number) - (m.from as number) : undefined, time }
    case 'PORTAL':
      return { icon: '🌑', text: 'Crossed the portal', time }
    case 'ADMIN_ADJUST':
      return { icon: '🛠️', text: 'Host adjustment', delta: num(m.amount), time }
    case 'ADMIN_FREEZE':
      return { icon: m.frozen ? '❄️' : '🔥', text: m.frozen ? 'Frozen by host' : 'Unfrozen by host', time }
    case 'MISSION_COMPLETE':
      return { icon: '🕵️', text: 'Completed secret mission', delta: num(m.reward), time }
    default:
      return { icon: '•', text: e.type.replace(/_/g, ' ').toLowerCase(), time }
  }
}

/** Renders a player's event history as a list. */
export function EventHistory({
  events,
  playerId,
  nameOf,
  empty = 'No activity yet.',
}: {
  events: GameEvent[]
  playerId: string
  nameOf: (id: string | null) => string
  empty?: string
}) {
  if (events.length === 0) return <div className="muted" style={{ marginTop: 6 }}>{empty}</div>
  return (
    <ul className="history">
      {events.map((e) => {
        const f = formatEvent(e, playerId, nameOf)
        return (
          <li key={e.id} className="history-row">
            <span className="history-icon">{f.icon}</span>
            <span className="history-text">{f.text}</span>
            {f.delta != null && f.delta !== 0 && (
              <span className={`history-delta ${f.delta > 0 ? 'pos' : 'neg'}`}>{f.delta > 0 ? `+${f.delta}` : f.delta}</span>
            )}
            <span className="history-time muted">{f.time}</span>
          </li>
        )
      })}
    </ul>
  )
}
