import { useEffect, useState } from 'react'
import { leaderboard, type LeaderRow } from '../lib/api'
import { ELEMENT_INFO } from '../game/elements'

export function Winner() {
  const [champ, setChamp] = useState<LeaderRow | null>(null)
  useEffect(() => {
    leaderboard().then((rows) => setChamp(rows[0] ?? null))
  }, [])

  if (!champ) return <div className="app center muted" style={{ marginTop: 60 }}>Calculating the collapse…</div>

  const info = ELEMENT_INFO[champ.element]
  return (
    <div className="app center">
      <div className="card" style={{ marginTop: 40, borderColor: info.color, boxShadow: `0 0 40px ${info.color}44` }}>
        <div style={{ fontSize: 64 }}>🏆</div>
        <div className="tracked" style={{ color: 'var(--gold)' }}>Elemental Champion</div>
        <div style={{ fontSize: 34, fontWeight: 900, margin: '10px 0' }}>{champ.name}</div>
        <div style={{ fontSize: 22 }}>{info.emoji} {info.label}</div>
        <div className="energy" style={{ fontSize: 48, marginTop: 12 }}>{champ.score}</div>
        <div className="muted">ENERGY</div>
      </div>
      <p className="tracked" style={{ marginTop: 24 }}>The real expedition starts now. 🐘</p>
    </div>
  )
}
