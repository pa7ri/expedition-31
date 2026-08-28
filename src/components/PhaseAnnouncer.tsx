import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePhase } from '../lib/usePhase'
import { PHASE_ANNOUNCEMENT } from '../game/phases'

/**
 * Global overlay: when the host advances the phase, every player sees a full-screen announcement
 * banner. On ENDED it routes everyone to the champion reveal. Mounted once at the app root.
 */
export function PhaseAnnouncer() {
  const { phase, previous } = usePhase()
  const nav = useNavigate()
  const [banner, setBanner] = useState<{ title: string; body: string } | null>(null)

  useEffect(() => {
    if (!phase || previous === null) return // ignore the initial load
    const a = PHASE_ANNOUNCEMENT[phase]
    if (a) setBanner(a)
    if (phase === 'ENDED') {
      const t = setTimeout(() => nav('/winner'), 2600)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setBanner(null), 4000)
    return () => clearTimeout(t)
  }, [phase, previous, nav])

  if (!banner) return null
  return (
    <div className="announce-overlay" onClick={() => setBanner(null)}>
      <div className="announce-card">
        <div className="announce-title">{banner.title}</div>
        <div className="announce-body">{banner.body}</div>
      </div>
    </div>
  )
}
