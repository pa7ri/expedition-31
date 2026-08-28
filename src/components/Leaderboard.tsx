import type { LeaderRow } from '../lib/api'
import { ELEMENT_INFO } from '../game/elements'

const MEDAL = ['🥇', '🥈', '🥉']

export function Leaderboard({ rows, highlightId }: { rows: LeaderRow[]; highlightId?: string }) {
  return (
    <div className="card">
      <div className="tracked center" style={{ color: 'var(--gold)' }}>🏆 Expedition</div>
      <div style={{ marginTop: 10 }}>
        {rows.map((r) => (
          <div
            className="lb-row"
            key={r.id}
            style={r.id === highlightId ? { background: 'rgba(245,196,81,0.06)', borderRadius: 8 } : undefined}
          >
            <div className="lb-rank">{MEDAL[r.rank - 1] ?? r.rank}</div>
            <div>
              <span style={{ fontWeight: 700 }}>{r.name}</span>{' '}
              <span title={ELEMENT_INFO[r.element].label}>{ELEMENT_INFO[r.element].emoji}</span>
            </div>
            <div className="lb-score">{r.score}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="muted center">No explorers yet.</div>}
      </div>
    </div>
  )
}
