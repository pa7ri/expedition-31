import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePlayer } from '../lib/usePlayer'
import { submitFinalGamble } from '../lib/api'
import type { FinalChoice } from '../game/scoring'
import { ArcaneButton } from '../components/fx/ArcaneButton'
import { RevealCard } from '../components/fx/RevealCard'
import { ParticleReveal } from '../components/fx/ParticleReveal'
import { CountUp } from '../components/fx/CountUp'
import { listContainer, listItem } from '../fx/variants'

const CHOICES: { key: FinalChoice; label: string; sub: string; accent: string; variant: 'default' | 'danger' }[] = [
  { key: 'STABILITY', label: '🛡️ Stability', sub: 'Keep your score.', accent: '#4caf6d', variant: 'default' },
  { key: 'POWER', label: '🔥 Power', sub: '50%: +75%. Else −25%.', accent: '#ff5b35', variant: 'default' },
  { key: 'CHAOS', label: '☄️ Chaos', sub: '33%: ×3. Else −50%.', accent: '#b98cff', variant: 'danger' },
]

export function Final() {
  const { player, loading, refresh } = usePlayer()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<{ newScore: number; won: boolean; choice: FinalChoice; from: number } | null>(null)

  if (loading) return <div className="app center muted" style={{ marginTop: 60 }}>Loading…</div>
  if (!player) return <Navigate to="/" replace />

  async function choose(choice: FinalChoice) {
    setBusy(true)
    const from = player!.score
    const res = await submitFinalGamble(player!, choice)
    await refresh()
    setOutcome({ ...res, choice, from })
  }

  if (outcome) {
    return (
      <div className="app center">
        <ParticleReveal kind={outcome.won ? 'LEGENDARY' : 'CHAOS'} play />
        <RevealCard tagType="LEGENDARY" element={player.element} accent={outcome.won ? '#e9c46a' : '#ff4d6d'}>
          <h2>💥 The Elements Collapse</h2>
          <div className="energy display" style={{ fontSize: 48 }}>
            <CountUp value={outcome.newScore} from={outcome.from} />
          </div>
          <p className="muted">
            {outcome.choice === 'STABILITY'
              ? 'You held firm.'
              : outcome.won
                ? 'Your gamble paid off!'
                : 'The gamble did not favour you.'}
          </p>
        </RevealCard>
        <ArcaneButton variant="primary" onClick={() => nav('/winner')}>See the champion 🏆</ArcaneButton>
      </div>
    )
  }

  return (
    <div className="app center">
      <div className="card">
        <h2 className="display tracked">🌑 The Elemental Collapse</h2>
        <p className="muted">One final choice. Everyone chooses privately, then scores lock.</p>
        <div className="energy display">⚡ {player.score}</div>
      </div>
      <motion.div className="stack" variants={listContainer} initial="initial" animate="enter">
        {CHOICES.map((c) => (
          <motion.div key={c.key} variants={listItem}>
            <ArcaneButton variant={c.variant} accent={c.accent} disabled={busy} onClick={() => choose(c.key)}>
              <div style={{ fontWeight: 800 }}>{c.label}</div>
              <div className="muted" style={{ fontSize: 13, fontWeight: 400 }}>{c.sub}</div>
            </ArcaneButton>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
