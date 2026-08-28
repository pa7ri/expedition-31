import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ELEMENTS, ELEMENT_INFO, type Element } from '../game/elements'
import { registerPlayer } from '../lib/api'
import { newSessionToken, setSessionToken } from '../lib/session'

export function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [element, setElement] = useState<Element | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!name.trim() || !element) return
    setBusy(true)
    setError(null)
    try {
      const token = newSessionToken()
      await registerPlayer(name, element, token)
      setSessionToken(token)
      nav('/game', { replace: true })
    } catch {
      setError('Could not register. Try a different name.')
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <div className="center" style={{ marginTop: 12 }}>
        <h2 className="tracked">Welcome, Explorer</h2>
      </div>

      <div className="card">
        <label className="tracked muted" style={{ fontSize: 12 }}>Choose your name</label>
        <input
          className="input"
          style={{ marginTop: 8 }}
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your explorer name"
        />
      </div>

      <div className="card">
        <label className="tracked muted" style={{ fontSize: 12 }}>Choose your element</label>
        <div className="elements" style={{ marginTop: 10 }}>
          {ELEMENTS.map((el) => {
            const info = ELEMENT_INFO[el]
            return (
              <div
                key={el}
                className={`element-tile ${element === el ? 'selected' : ''}`}
                data-el={el}
                onClick={() => setElement(el)}
              >
                <span className="emoji">{info.emoji}</span>
                <span className="name">{info.label}</span>
              </div>
            )
          })}
        </div>
        {element && <p className="muted" style={{ marginTop: 12 }}>{ELEMENT_INFO[element].personality}</p>}
        <p className="muted" style={{ fontSize: 12 }}>⚠️ Once chosen, your element cannot be changed.</p>
      </div>

      {error && <div className="notice">{error}</div>}

      <button className="btn primary" disabled={!name.trim() || !element || busy} onClick={submit}>
        {busy ? 'Awakening…' : 'Awaken my element ⚡'}
      </button>
    </div>
  )
}
