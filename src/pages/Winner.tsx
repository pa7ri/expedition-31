import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { leaderboard, type LeaderRow } from '../lib/api'
import { ELEMENT_INFO } from '../game/elements'
import { Sigil } from '../components/fx/Sigil'
import { CountUp } from '../components/fx/CountUp'
import { ParticleReveal } from '../components/fx/ParticleReveal'
import { glow } from '../fx/theme'

export function Winner() {
  const [champ, setChamp] = useState<LeaderRow | null>(null)
  useEffect(() => {
    leaderboard().then((rows) => setChamp(rows[0] ?? null))
  }, [])

  if (!champ) return <div className="app center muted" style={{ marginTop: 60 }}>Calculating the collapse…</div>

  const info = ELEMENT_INFO[champ.element]
  return (
    <div className="app center">
      {/* Sustained gold + element particle rain for the crowning. */}
      <ParticleReveal kind="GOLD" play repeat />
      <ParticleReveal kind={champ.element} play repeat />

      <motion.div
        className="card"
        style={{ marginTop: 40, borderColor: info.color, boxShadow: `0 0 60px -6px ${glow(info.color, 0.5)}`, ['--el-glow' as string]: glow(info.color, 0.35) }}
        initial={{ opacity: 0, scale: 0.7, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      >
        <div className="profile-aura" aria-hidden />
        <motion.div
          style={{ fontSize: 64 }}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 14 }}
        >
          🏆
        </motion.div>
        <div className="tracked" style={{ color: 'var(--gold)' }}>Elemental Champion</div>
        <div className="center" style={{ margin: '12px 0 6px' }}>
          <Sigil element={champ.element} size={92} />
        </div>
        <div className="display" style={{ fontSize: 34, fontWeight: 900, margin: '6px 0' }}>{champ.name}</div>
        <div style={{ fontSize: 20 }}>{info.emoji} {info.label}</div>
        <div className="energy display" style={{ fontSize: 48, marginTop: 12 }}>
          <CountUp value={champ.score} duration={1.4} />
        </div>
        <div className="muted">ENERGY</div>
      </motion.div>
      <motion.p
        className="tracked"
        style={{ marginTop: 24 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        The real expedition starts now. 🐘
      </motion.p>
    </div>
  )
}
