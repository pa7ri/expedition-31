import { ELEMENT_INFO, powerLines } from '../game/elements'
import type { Player, InventoryItem } from '../lib/api'
import { ARTIFACT_INFO } from '../game/tags'
import { SECRET_MISSION } from '../game/challenges'
import { ElementBadge } from './ElementBadge'

export function PlayerCard({
  player,
  rank,
  inventory,
}: {
  player: Player
  rank: number
  inventory: InventoryItem[]
}) {
  const info = ELEMENT_INFO[player.element]
  const power = powerLines(player.element)
  return (
    <div className="card profile" style={{ borderColor: info.color }}>
      <div className="center tracked muted" style={{ fontSize: 12 }}>🧭 Birthday Quest</div>
      <div className="center name" style={{ marginTop: 8 }}>{player.name}</div>
      <div className="center" style={{ margin: '8px 0' }}>
        <ElementBadge element={player.element} />
      </div>
      <div className="row" style={{ marginTop: 6 }}>
        <div>
          <div className="energy">⚡ {player.score}</div>
          <div className="muted" style={{ fontSize: 12 }}>ENERGY</div>
        </div>
        <div className="center">
          <div style={{ fontSize: 28, fontWeight: 800 }}>#{rank}</div>
          <div className="muted" style={{ fontSize: 12 }}>RANK</div>
        </div>
      </div>

      <div className="divider" />
      <div className="tracked muted" style={{ fontSize: 12 }}>Your Power</div>
      <div style={{ marginTop: 6 }}>{power.defeats}</div>
      <div className="muted">{power.vulnerable}</div>

      <div className="divider" />
      <div className="tracked muted" style={{ fontSize: 12 }}>🎒 Inventory</div>
      {inventory.length === 0 ? (
        <div className="muted" style={{ marginTop: 6 }}>Empty</div>
      ) : (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {inventory.map((it) => (
            <li key={it.id}>
              {ARTIFACT_INFO[it.artifact].emoji} {ARTIFACT_INFO[it.artifact].name}
              {it.shield_active ? ' — 🛡️ shield active' : it.used ? ' — used' : ''}
            </li>
          ))}
        </ul>
      )}

      <div className="divider" />
      <div className="tracked muted" style={{ fontSize: 12 }}>🕵️ Secret Mission</div>
      <div style={{ marginTop: 6 }}>{SECRET_MISSION[player.element]}</div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Complete it for +150 (confirmed by the host).</div>
    </div>
  )
}
