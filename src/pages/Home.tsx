import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSessionToken, clearSession } from '../lib/session'
import { getPlayerByToken } from '../lib/api'

export function Home() {
  const nav = useNavigate()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let live = true
    const token = getSessionToken()
    if (!token) {
      setChecked(true)
      return
    }
    // Only redirect if the token still maps to a real player. After a game reset the
    // player rows are gone, so a stale token would otherwise bounce us in a loop.
    getPlayerByToken(token).then((p) => {
      if (!live) return
      if (p) nav('/game', { replace: true })
      else {
        clearSession()
        setChecked(true)
      }
    })
    return () => {
      live = false
    }
  }, [nav])

  if (!checked) return <div className="app center muted" style={{ marginTop: 60 }}>Loading…</div>

  return (
    <div className="app center">
      <motion.div
        style={{ marginTop: 48 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          className="float"
          style={{ fontSize: 64, filter: 'drop-shadow(0 0 24px rgba(233,196,106,0.5))' }}
        >
          🧭
        </motion.div>
        <h1 className="display" style={{ letterSpacing: '0.16em', fontSize: 32 }}>Expedition 31</h1>
        <p className="tracked muted" style={{ fontSize: 13 }}>The Elemental Birthday Quest</p>
      </motion.div>

      <motion.div
        className="card"
        style={{ marginTop: 24, textAlign: 'left' }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <p>Choose your element. It decides what you are good at, who you can defeat, and how the world reacts to you.</p>
        <p className="muted">Some markers react differently depending on who you are. You will discover the rest as you play.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <Link className="btn primary" to="/register">Begin the Expedition</Link>
      </motion.div>
    </div>
  )
}
