import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { usePhase } from '../lib/usePhase'
import { PHASE_ANNOUNCEMENT, type Phase } from '../game/phases'
import { glow } from '../fx/theme'

/** Accent color per phase so the Portal/War/Collapse announcements each feel distinct. */
const PHASE_ACCENT: Record<Phase, string> = {
  SETUP: '#e9c46a',
  BAR_1: '#e9c46a',
  TRANSITION: '#5b3fb0',
  BAR_2: '#c0392b',
  FINAL: '#3aa0ff',
  ENDED: '#e9c46a',
}

/**
 * Global overlay: when the host advances the phase, every player sees a full-screen announcement
 * banner. On ENDED it routes everyone to the champion reveal. Mounted once at the app root.
 */
export function PhaseAnnouncer() {
  const { phase, previous } = usePhase()
  const nav = useNavigate()
  const [banner, setBanner] = useState<{ title: string; body: string; accent: string } | null>(null)

  useEffect(() => {
    if (!phase || previous === null) return // ignore the initial load
    const a = PHASE_ANNOUNCEMENT[phase]
    if (a) setBanner({ ...a, accent: PHASE_ACCENT[phase] })
    if (phase === 'ENDED') {
      const t = setTimeout(() => nav('/winner'), 2600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(t)
  }, [phase, previous, nav])

  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          className="announce-overlay"
          onClick={() => setBanner(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="announce-card"
            style={{ ['--ann' as string]: banner.accent, ['--ann-glow' as string]: glow(banner.accent, 0.5) }}
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            <div className="announce-title">{banner.title}</div>
            <div className="announce-body">{banner.body}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
