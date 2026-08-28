import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePlayer } from '../lib/usePlayer'
import { submitFinalGamble } from '../lib/api'
import type { FinalChoice } from '../game/scoring'

const CHOICES: { key: FinalChoice; label: string; sub: string; cls: string }[] = [
  { key: 'STABILITY', label: '🛡️ Stability', sub: 'Keep your score.', cls: '' },
  { key: 'POWER', label: '🔥 Power', sub: '50%: +75%. Else −25%.', cls: '' },
  { key: 'CHAOS', label: '☄️ Chaos', sub: '33%: ×3. Else −50%.', cls: 'danger' },
]

export function Final() {
  const { player, loading, refresh } = usePlayer()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<{ newScore: number; won: boolean; choice: FinalChoice } | null>(null)

  if (loading) return <div className="app center muted" style={{ marginTop: 60 }}>Loading…</div>
  if (!player) return <Navigate to="/" replace />

  async function choose(choice: FinalChoice) {
    setBusy(true)
    const res = await submitFinalGamble(player!, choice)
    await refresh()
    setOutcome({ ...res, choice })
  }

  if (outcome) {
    return (
      <div className="app center">
        <div className="card">
          <h2>💥 The Elements Collapse</h2>
          <div className="energy" style={{ fontSize: 48 }}>{outcome.newScore}</div>
          <p className="muted">
            {outcome.choice === 'STABILITY'
              ? 'You held firm.'
              : outcome.won
                ? 'Your gamble paid off!'
                : 'The gamble did not favour you.'}
          </p>
        </div>
        <button className="btn primary" onClick={() => nav('/winner')}>See the champion 🏆</button>
      </div>
    )
  }

  return (
    <div className="app center">
      <div className="card">
        <h2 className="tracked">🌑 The Elemental Collapse</h2>
        <p className="muted">One final choice. Everyone chooses privately, then scores lock.</p>
        <div className="energy">⚡ {player.score}</div>
      </div>
      <div className="stack">
        {CHOICES.map((c) => (
          <button key={c.key} className={`btn ${c.cls}`} disabled={busy} onClick={() => choose(c.key)}>
            <div style={{ fontWeight: 800 }}>{c.label}</div>
            <div className="muted" style={{ fontSize: 13 }}>{c.sub}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
