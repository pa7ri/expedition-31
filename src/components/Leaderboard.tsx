import { motion } from 'framer-motion'
import type { LeaderRow } from '../lib/api'
import { ELEMENT_INFO } from '../game/elements'
import { glow } from '../fx/theme'
import { listContainer, listItem } from '../fx/variants'

const MEDAL = ['🥇', '🥈', '🥉']

export function Leaderboard({ rows, highlightId }: { rows: LeaderRow[]; highlightId?: string }) {
  return (
    <div className="card">
      <div className="tracked center display" style={{ color: 'var(--gold)' }}>🏆 Expedition</div>
      <motion.div style={{ marginTop: 10 }} variants={listContainer} initial="initial" animate="enter">
        {rows.map((r) => {
          const info = ELEMENT_INFO[r.element]
          const isSelf = r.id === highlightId
          return (
            <motion.div
              className={`lb-row ${isSelf ? 'lb-self' : ''}`}
              key={r.id}
              variants={listItem}
              style={{ ['--el' as string]: info.color, boxShadow: r.rank <= 3 ? `inset 3px 0 0 ${glow(info.color, 0.8)}` : undefined }}
            >
              <div className="lb-rank">{MEDAL[r.rank - 1] ?? r.rank}</div>
              <div>
                <span style={{ fontWeight: 700 }}>{r.name}</span>{' '}
                <span title={info.label}>{info.emoji}</span>
              </div>
              <div className="lb-score">{r.score}</div>
            </motion.div>
          )
        })}
        {rows.length === 0 && <div className="muted center">No explorers yet.</div>}
      </motion.div>
    </div>
  )
}
