import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { usePlayer } from '../lib/usePlayer'
import { PlayerCard } from '../components/PlayerCard'
import { EventHistory } from '../components/EventHistory'
import { listPlayers, playerEvents, type GameEvent, type Player } from '../lib/api'

export function Game() {
  const { player, rank, inventory, loading } = usePlayer()
  const [events, setEvents] = useState<GameEvent[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!player) return
    let live = true
    const load = async () => {
      const [ev, all] = await Promise.all([playerEvents(player.id), listPlayers()])
      if (!live) return
      setEvents(ev)
      setPlayers(all)
    }
    load()
    const t = setInterval(load, 5000) // keep history fresh as others interact with you
    return () => {
      live = false
      clearInterval(t)
    }
  }, [player])

  if (loading) return <div className="app center muted" style={{ marginTop: 60 }}>Loading…</div>
  if (!player) return <Navigate to="/" replace />

  const nameOf = (id: string | null) => players.find((p) => p.id === id)?.name ?? 'someone'

  return (
    <div className="app">
      <PlayerCard player={player} rank={rank} inventory={inventory} />
      <div className="card">
        <div className="tracked muted" style={{ fontSize: 12 }}>📜 Your History</div>
        <EventHistory events={events} playerId={player.id} nameOf={nameOf} empty="Scan a marker to begin your story." />
      </div>
    </div>
  )
}
