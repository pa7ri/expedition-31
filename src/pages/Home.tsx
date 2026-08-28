import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
      <div style={{ marginTop: 40 }}>
        <div style={{ fontSize: 56 }}>🧭</div>
        <h1 className="tracked">Expedition 31</h1>
        <p className="muted">The Elemental Birthday Quest</p>
      </div>
      <div className="card" style={{ marginTop: 24, textAlign: 'left' }}>
        <p>Choose your element. It decides what you are good at, who you can defeat, and how the world reacts to you.</p>
        <p className="muted">Some markers react differently depending on who you are. You will discover the rest as you play.</p>
      </div>
      <Link className="btn primary" to="/register">Begin the Expedition ⚡</Link>
    </div>
  )
}
