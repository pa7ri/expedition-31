import { Navigate } from 'react-router-dom'
import { usePlayer } from '../lib/usePlayer'
import { PlayerCard } from '../components/PlayerCard'

export function Game() {
  const { player, rank, inventory, loading } = usePlayer()

  if (loading) return <div className="app center muted" style={{ marginTop: 60 }}>Loading…</div>
  if (!player) return <Navigate to="/" replace />

  return (
    <div className="app">
      <PlayerCard player={player} rank={rank} inventory={inventory} />
      <div className="card muted" style={{ fontSize: 13 }}>
        Scan markers around you to gain Energy, battle rivals, form alliances and find artifacts.
        Your element shapes every outcome.
      </div>
    </div>
  )
}
