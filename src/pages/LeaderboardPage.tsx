import { useEffect, useState } from 'react'
import { leaderboard, type LeaderRow } from '../lib/api'
import { Leaderboard } from '../components/Leaderboard'
import { usePlayer } from '../lib/usePlayer'

export function LeaderboardPage() {
  const { player } = usePlayer()
  const [rows, setRows] = useState<LeaderRow[]>([])

  useEffect(() => {
    let live = true
    const load = () => leaderboard().then((r) => live && setRows(r))
    load()
    const t = setInterval(load, 5000) // light polling so ranks stay fresh at the party
    return () => {
      live = false
      clearInterval(t)
    }
  }, [])

  return (
    <div className="app">
      <Leaderboard rows={rows} highlightId={player?.id} />
      <p className="muted center" style={{ fontSize: 12 }}>Only name, element and score are public. Missions and artifacts stay secret.</p>
    </div>
  )
}
