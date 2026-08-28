import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { getSessionToken } from '../lib/session'

export function Home() {
  const nav = useNavigate()
  useEffect(() => {
    if (getSessionToken()) nav('/game', { replace: true })
  }, [nav])

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
