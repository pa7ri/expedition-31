import { useCallback, useEffect, useState } from 'react'
import { getPlayerByToken, getInventory, playerRank, type InventoryItem, type Player } from '../lib/api'
import { getSessionToken, clearSession } from '../lib/session'

/** Loads the logged-in player (by localStorage token) plus rank and inventory, with a refresh(). */
export function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [rank, setRank] = useState(1)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getSessionToken()
    if (!token) {
      setPlayer(null)
      setLoading(false)
      return
    }
    const p = await getPlayerByToken(token)
    if (!p) {
      // Token points at a player that no longer exists (e.g. the game was reset).
      // Drop the stale session so we don't ping-pong between Home and Game.
      clearSession()
      setPlayer(null)
      setLoading(false)
      return
    }
    setPlayer(p)
    const [r, inv] = await Promise.all([playerRank(p.id), getInventory(p.id)])
    setRank(r)
    setInventory(inv)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { player, rank, inventory, loading, refresh, setPlayer }
}
