import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePlayer } from '../lib/usePlayer'
import { ELEMENT_INFO, type Element } from '../game/elements'
import type { TagType } from '../game/tags'
import { RevealCard } from '../components/fx/RevealCard'
import { ArcaneButton } from '../components/fx/ArcaneButton'
import { ElementPicker } from '../components/fx/ElementPicker'
import { Sigil } from '../components/fx/Sigil'
import { CountUp } from '../components/fx/CountUp'
import {
  joinGroup,
  listPlayers,
  resolveScan,
  submitBattle,
  submitChaos,
  submitCollapse,
  submitConvergence,
  submitPoison,
  declinePoison,
  type Player,
  type TagResult,
} from '../lib/api'

/** Result reveal shared by every flow — animated per tag type, with a themed particle burst. */
function ResultReveal({ result, element }: { result: TagResult; element: Element }) {
  const delta = result.delta
  const type = result.tag?.type
  return (
    <RevealCard tagType={type} element={element}>
      {type && <div className="reveal-kind">{type}</div>}
      <h2>{result.title}</h2>
      <p className="muted">{result.message}</p>
      {delta != null && delta !== 0 && (
        <div className={`reveal-delta ${delta > 0 ? 'pos' : 'neg'}`}>
          {delta > 0 ? '+' : '−'}
          <CountUp value={Math.abs(delta)} />
        </div>
      )}
    </RevealCard>
  )
}

export function Tag() {
  const [params] = useSearchParams()
  const code = (params.get('tag') ?? '').toUpperCase()
  const { player, loading, refresh } = usePlayer()
  const nav = useNavigate()

  const [result, setResult] = useState<TagResult | null>(null)
  const [busy, setBusy] = useState(true)

  // Resolve the scan exactly once per code. Without this guard, refresh() below swaps the
  // `player` reference and would re-run resolveScan — the second pass hits the "already
  // discovered" gate and clobbers the good reveal. We capture player via a ref so the effect
  // doesn't depend on it.
  const playerRef = useRef(player)
  useEffect(() => {
    playerRef.current = player
  }, [player])
  const resolvedFor = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return
    const p = playerRef.current
    if (!p) return
    if (resolvedFor.current === code) return
    resolvedFor.current = code
    if (!code) {
      setResult({ ok: false, title: 'No marker', message: 'This link has no marker code.' })
      setBusy(false)
      return
    }
    resolveScan(p, code).then((r) => {
      setResult(r)
      setBusy(false)
      if (!r.interactive) refresh()
    })
  }, [code, loading, refresh])

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
  if (result.ok && result.interactive === 'POISON_CHOICE') {
    return <PoisonFlow player={player} code={code} onResolved={(r) => setResult(r)} initial={result} />
  }

  return (
    <div className="app">
      <ResultReveal result={result} element={player.element} />
      <ArcaneButton variant="primary" onClick={done}>Continue</ArcaneButton>
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
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="reveal-kind" style={{ color: 'var(--fire)' }}>Battle</div>
        <h2>Elemental Battle</h2>
        <p className="muted">Choose another explorer to challenge.</p>
        <div className="stack" style={{ marginTop: 10 }}>
          {players.map((p) => (
            <ArcaneButton
              key={p.id}
              disabled={busy}
              accent={ELEMENT_INFO[p.element].color}
              onClick={async () => {
                setBusy(true)
                onResolved(await submitBattle(player, code, p.id))
              }}
            >
              {p.name} {ELEMENT_INFO[p.element].emoji}
            </ArcaneButton>
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

  // Which elements are gathered so far — pull from the status message's element hints if present.
  const type: TagType = kind === 'alliance' ? 'ALLIANCE' : 'MYSTERY'
  return (
    <div className="app">
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>{status.title}</h2>
        <GatheringSigils element={player.element} four={kind === 'group'} />
        <p className="muted">{status.message}</p>
        <div className="muted center" style={{ fontSize: 12 }}>
          {kind === 'alliance' ? 'Waiting for a partner to scan…' : 'Waiting for the elements to gather…'}
        </div>
        <span className="reveal-kind" style={{ color: type === 'ALLIANCE' ? 'var(--water)' : 'var(--earth)' }}>{status.tag?.type ?? type}</span>
      </div>
    </div>
  )
}

/** Pulsing element sigils that represent the gathering circle while waiting. */
function GatheringSigils({ element, four }: { element: Element; four: boolean }) {
  const els: Element[] = four ? ['FIRE', 'WATER', 'EARTH', 'AIR'] : [element, element]
  return (
    <div className="gather">
      {els.map((el, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 1, 0.4], scale: [0.94, 1.04, 0.94] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
        >
          <Sigil element={el} size={48} spin={false} />
        </motion.div>
      ))}
    </div>
  )
}

function ConvergenceChoice({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <RevealCard tagType="LEGENDARY" element={player.element}>
        <div className="reveal-kind">Convergence</div>
        <h2>The Elements Have United</h2>
        <p className="muted">+300 each if you share. Or one explorer betrays for +600 while the rest get +150.</p>
        <div className="stack" style={{ marginTop: 12 }}>
          <ArcaneButton disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitConvergence(code, null)) }}>
            SHARE — everyone keeps +300
          </ArcaneButton>
          <ArcaneButton variant="danger" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitConvergence(code, player.id)) }}>
            BETRAY — I take +600
          </ArcaneButton>
        </div>
      </RevealCard>
    </div>
  )
}

// ── Collapse ─────────────────────────────────────────────────────────────
function CollapseFlow({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<Element | null>(null)
  return (
    <div className="app">
      <RevealCard tagType="LEGENDARY" element={player.element} accent="#c0392b">
        <div className="reveal-kind" style={{ color: '#ff5b35' }}>The Collapse</div>
        <h2>The Collapse</h2>
        <p className="muted">You wield the final elemental weapon. Choose an element to destroy — all its players lose 150.</p>
        <div style={{ marginTop: 12 }}>
          <ElementPicker
            selected={target}
            disabled={busy}
            labelFor={(el) => `Destroy ${ELEMENT_INFO[el].label}`}
            onSelect={async (el) => {
              if (busy) return
              setTarget(el)
              setBusy(true)
              onResolved(await submitCollapse(player, code, el))
            }}
          />
        </div>
      </RevealCard>
    </div>
  )
}

// ── Chaos ────────────────────────────────────────────────────────────────
function ChaosFlow({ player, code, onResolved }: { player: Player; code: string; onResolved: (r: TagResult) => void }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <RevealCard tagType="CHAOS" element={player.element}>
        <div className="reveal-kind">Chaos</div>
        <h2>Chaos</h2>
        <p className="muted">Your element does not matter here. Roll the dice of fate.</p>
        <motion.div
          style={{ fontSize: 64, margin: '10px 0' }}
          animate={busy ? { rotate: [0, 360, 720, 900] } : { rotate: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        >
          🎲
        </motion.div>
        <ArcaneButton variant="primary" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitChaos(player, code)) }}>
          Roll
        </ArcaneButton>
      </RevealCard>
    </div>
  )
}

// ── Poison ───────────────────────────────────────────────────────────────
function PoisonFlow({ player, code, onResolved, initial }: { player: Player; code: string; onResolved: (r: TagResult) => void; initial: TagResult }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="app">
      <RevealCard tagType="POISON" element={player.element}>
        <div className="reveal-kind" style={{ color: 'var(--poison, #7bb342)' }}>Poison</div>
        <h2>{initial.title}</h2>
        <p className="muted">{initial.message}</p>
        <div className="stack" style={{ marginTop: 12 }}>
          <ArcaneButton variant="danger" disabled={busy} onClick={async () => { setBusy(true); onResolved(await submitPoison(player, code)) }}>
            Take it
          </ArcaneButton>
          <ArcaneButton disabled={busy} onClick={async () => { setBusy(true); onResolved(await declinePoison(player, code)) }}>
            Walk away
          </ArcaneButton>
        </div>
      </RevealCard>
    </div>
  )
}
