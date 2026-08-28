import { useCallback, useEffect, useState } from 'react'
import {
  adminAdjust,
  adminCompleteMission,
  adminResetGame,
  adminSetFrozen,
  adminSetTagActive,
  getPhase,
  listEvents,
  listPlayers,
  setPhase,
  type GameEvent,
  type Player,
} from '../lib/api'
import { ELEMENT_INFO } from '../game/elements'
import { PHASE_LABEL, PHASE_ORDER, nextPhase, type Phase } from '../game/phases'
import { TAGS } from '../game/tags'
import { QRSheet } from '../components/QRSheet'

export function Admin() {
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<GameEvent[]>([])
  const [phase, setPhaseState] = useState<Phase>('SETUP')
  const [tab, setTab] = useState<'players' | 'phases' | 'tags' | 'events' | 'qr'>('players')

  const refresh = useCallback(async () => {
    const [p, e, ph] = await Promise.all([listPlayers(), listEvents(60), getPhase()])
    setPlayers(p)
    setEvents(e)
    setPhaseState(ph)
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  const nameOf = (id: string | null) => players.find((p) => p.id === id)?.name ?? '—'

  return (
    <div className="app" style={{ maxWidth: 640 }}>
      <div className="row no-print">
        <h2>🧑‍✈️ Admin</h2>
        <span className="pill">{PHASE_LABEL[phase]}</span>
      </div>

      <div className="row no-print" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {(['players', 'phases', 'tags', 'events', 'qr'] as const).map((t) => (
          <button key={t} className={`btn ${tab === t ? 'primary' : 'ghost'}`} style={{ width: 'auto', flex: 1 }} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'players' && (
        <div className="card no-print">
          {players.map((p) => (
            <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="row">
                <div>
                  <strong>{p.name}</strong> {ELEMENT_INFO[p.element].emoji}{' '}
                  {p.frozen && <span className="muted">❄️ frozen</span>}
                </div>
                <div className="lb-score">{p.score}</div>
              </div>
              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
                {[+50, +100, -50, -100].map((amt) => (
                  <button key={amt} className="btn" style={{ width: 'auto', flex: 1, padding: '8px 10px' }}
                    onClick={async () => { await adminAdjust(p.id, amt); refresh() }}>
                    {amt > 0 ? `+${amt}` : amt}
                  </button>
                ))}
                <button className="btn" style={{ width: 'auto', padding: '8px 10px' }}
                  onClick={async () => { await adminSetFrozen(p.id, !p.frozen); refresh() }}>
                  {p.frozen ? 'Unfreeze' : 'Freeze'}
                </button>
                <button className="btn" style={{ width: 'auto', padding: '8px 10px' }}
                  onClick={async () => { await adminCompleteMission(p.id); refresh() }}>
                  Mission +150
                </button>
              </div>
            </div>
          ))}
          {players.length === 0 && <div className="muted">No players yet.</div>}
        </div>
      )}

      {tab === 'phases' && (
        <div className="card no-print">
          <p className="muted">Advance the expedition. Tags are gated by phase.</p>
          <div className="stack">
            {PHASE_ORDER.map((ph) => (
              <button key={ph} className={`btn ${ph === phase ? 'primary' : ''}`}
                onClick={async () => { await setPhase(ph); refresh() }}>
                {PHASE_LABEL[ph]}
              </button>
            ))}
          </div>
          {nextPhase(phase) && (
            <button className="btn primary" style={{ marginTop: 12 }}
              onClick={async () => { await setPhase(nextPhase(phase)!); refresh() }}>
              ▶ Advance to {PHASE_LABEL[nextPhase(phase)!]}
            </button>
          )}
        </div>
      )}

      {tab === 'tags' && (
        <div className="card no-print">
          {TAGS.map((t) => (
            <div key={t.code} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <code>{t.code}</code> — {t.title} <span className="muted">({t.type})</span>
              </div>
              <button className="btn" style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => adminSetTagActive(t.code, true)}>
                Enable
              </button>
              <button className="btn ghost" style={{ width: 'auto', padding: '6px 12px' }}
                onClick={() => adminSetTagActive(t.code, false)}>
                Disable
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="card no-print">
          {events.map((e) => (
            <div key={e.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
              <span><strong>{e.type}</strong> {nameOf(e.source_player)} {e.target_player ? `→ ${nameOf(e.target_player)}` : ''}</span>
              <span className="muted">{new Date(e.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {events.length === 0 && <div className="muted">No events yet.</div>}
        </div>
      )}

      {tab === 'qr' && (
        <div>
          <div className="no-print" style={{ marginBottom: 12 }}>
            <button className="btn" onClick={() => window.print()}>🖨️ Print QR sheet</button>
            <p className="muted" style={{ fontSize: 12 }}>Print, cut out, and place each QR at its marker. Also write the same URL to the matching NFC tag.</p>
          </div>
          <QRSheet />
        </div>
      )}

      <div className="card no-print" style={{ borderColor: 'var(--danger)' }}>
        <div className="row">
          <span className="muted">Danger zone</span>
        </div>
        <button className="btn danger" style={{ marginTop: 8 }}
          onClick={async () => {
            if (confirm('Reset the game? This deletes all players, scores, scans and events.')) {
              await adminResetGame()
              refresh()
            }
          }}>
          Reset game
        </button>
        <button className="btn danger" style={{ marginTop: 8 }}
          onClick={async () => { if (confirm('End the game and lock scores?')) { await setPhase('ENDED'); refresh() } }}>
          End game
        </button>
      </div>
    </div>
  )
}
