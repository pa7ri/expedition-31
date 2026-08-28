import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlayer } from '../lib/usePlayer'
import { ELEMENTS, ELEMENT_INFO, type Element } from '../game/elements'
import {
  joinGroup,
  listPlayers,
  resolveScan,
  submitBattle,
  submitChaos,
  submitCollapse,
  submitConvergence,
  type Player,
  type TagResult,
} from '../lib/api'

/** Result banner shared by every flow. */
function ResultBanner({ result }: { result: TagResult }) {
  const delta = result.delta
  const cls = delta == null ? '' : delta > 0 ? 'win' : delta < 0 ? 'lose' : ''
  return (
    <div className={`card banner ${cls}`}>
      <h2>{result.title}</h2>
      <p className="muted">{result.message}</p>
      {delta != null && delta !== 0 && (
        <div className={`delta ${delta > 0 ? 'pos' : 'neg'}`}>{delta > 0 ? `+${delta}` : delta}</div>
      )}
    </div>
  )
}

export function Tag() {
  const [params] = useSearchParams()
  const code = (params.get('tag') ?? '').toUpperCase()
  const { player, loading, refresh } = usePlayer()
  const nav = useNavigate()

  const [result, setResult] = useState<TagResult | null>(null)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!player) return
    if (!code) {
      setResult({ ok: false, title: 'No marker', message: 'This link has no marker code.' })
      setBusy(false)
      return
    }
    resolveScan(player, code).then((r) => {
      setResult(r)
      setBusy(false)
      if (!r.interactive) refresh()
    })
  }, [code, player, loading, refresh])

  if (loading || busy) return <div className="app center muted" style={{ marginTop: 60 }}>Reading the marker…</div>

  if (!player) {
    return (
      <div className="app center">
        <div className="card">
          <h2>Join the expedition first</h2>
          <p className="muted">You need to choose your element before scanning markers.</p>
          <Link className="btn primary" to={`/register`}>Register</Link>
        </div>
      </div>
    )
  }

  if (!result) return null

  const done = () => {
    refresh()
    nav('/game')
  }

  // Interactive flows.
  if (result.ok && result.interactive === 'BATTLE_PICK') {
    return <BattleFlow player={player} code={code} onResolved={(r) => setResult(r)} />
  }
  if (result.ok && result.interactive === 'ALLIANCE_WAIT') {
    return <GroupFlow player={player} code={code} kind="alliance" onResolved={(r) => setResult(r)} initial={result} />
  }
  if (result.ok && (result.interactive === 'GROUP_WAIT' || result.interactive === 'CONVERGENCE_CHOICE')) {
    return <GroupFlow player={player} code={code} kind="group" onResolved={(r) => setResult(r)} initial={result} />
  }
  if (result.ok && result.interactive === 'COLLAPSE_CHOICE') {
    return <CollapseFlow player={player} code={code} onResolved={(r) => setResult(r)} />
  }
  if (result.ok && result.interactive === 'CHAOS_ROLL') {
    return <ChaosFlow player={player} code={code} onResolved={(r) => setResult(r)} />
  }

  return (
    <div className="app">
      <ResultBanner result={result} />
      <button className="btn primary" onClick={done}>Continue</button>
    </div>
  )
}

// ── Battle ────────────────────────────────────────────────────────────────
function BattleFlow({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [players, setPlayers] = useState<Player[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    listPlayers().then((all) => setPlayers(all.filter((p) => p.id !== player.id)))
  }, [player.id])

  return (
    <div className="app">
      <div className="card">
        <h2>⚔️ Elemental Battle</h2>
        <p className="muted">Choose another explorer to challenge.</p>
        <div className="stack" style={{ marginTop: 10 }}>
          {players.map((p) => (
            <button
              key={p.id}
              className="btn"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                onResolved(await submitBattle(player, code, p.id))
              }}
            >
              {p.name} {ELEMENT_INFO[p.element].emoji}
            </button>
          ))}
          {players.length === 0 && <div className="muted">No rivals yet.</div>}
        </div>
      </div>
    </div>
  )
}

// ── Alliance / group (scan-window) ─────────────────────────────────────────
function GroupFlow({
  player,
  code,
  kind,
  onResolved,
  initial,
}: {
  player: Player
  code: string
  kind: 'alliance' | 'group'
  onResolved: (r: TagResult) => void
  initial: TagResult
}) {
  const [status, setStatus] = useState<TagResult>(initial)
  const [convergenceReady, setConvergenceReady] = useState(false)

  // Poll the group session so members see progress and auto-resolve.
  useEffect(() => {
    let live = true
    const poll = async () => {
      const r = await joinGroup(player, code)
      if (!live) return
      setStatus(r)
      if (r.delta != null) {
        onResolved(r) // resolved with a reward
      } else if (r.interactive === 'CONVERGENCE_CHOICE') {
        setConvergenceReady(true)
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => {
      live = false
      clearInterval(t)
    }
  }, [player, code, onResolved])

  if (convergenceReady) {
    return <ConvergenceChoice player={player} code={code} onResolved={onResolved} />
  }

  return (
    <div className="app">
      <div className="card">
        <h2>{status.title}</h2>
        <p className="muted">{status.message}</p>
        <div className="muted center" style={{ fontSize: 12 }}>
          {kind === 'alliance' ? 'Waiting for a partner to scan…' : 'Waiting for the elements to gather…'}
        </div>
      </div>
    </div>
  )
}

function ConvergenceChoice({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <div className="card center">
        <h2>⚡ The Elements Have United</h2>
        <p className="muted">+300 each if you share. Or one explorer betrays for +600 while the rest get +150.</p>
        <div className="stack" style={{ marginTop: 12 }}>
          <button className="btn" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitConvergence(code, null)) }}>
            🤝 SHARE — everyone keeps +300
          </button>
          <button className="btn danger" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitConvergence(code, player.id)) }}>
            😈 BETRAY — I take +600
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Collapse ─────────────────────────────────────────────────────────────
function CollapseFlow({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <div className="card center">
        <h2>☄️ The Collapse</h2>
        <p className="muted">You wield the final elemental weapon. Choose an element to destroy — all its players lose 150.</p>
        <div className="elements" style={{ marginTop: 12 }}>
          {ELEMENTS.map((el: Element) => (
            <button
              key={el}
              className="element-tile"
              data-el={el}
              disabled={busy}
              onClick={async () => { setBusy(true); onResolved(await submitCollapse(player, code, el)) }}
            >
              <span className="emoji">{ELEMENT_INFO[el].emoji}</span>
              <span className="name">Destroy {ELEMENT_INFO[el].label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Chaos ────────────────────────────────────────────────────────────────
function ChaosFlow({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <div className="card center">
        <h2>🌀 Chaos</h2>
        <p className="muted">Your element does not matter here. Roll the dice of fate.</p>
        <button className="btn primary" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitChaos(player, code)) }}>
          🎲 Roll
        </button>
      </div>
    </div>
  )
}
