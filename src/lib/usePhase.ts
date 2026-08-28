import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { getPhase } from './api'
import type { Phase } from '../game/phases'

/**
 * Live game phase via Supabase Realtime. Subscribes to updates on the singleton game_state row so
 * every player learns of a phase change within moments of the host clicking it. Falls back to an
 * initial fetch and a slow poll in case Realtime is unavailable on the project.
 */
export function usePhase(): { phase: Phase | null; previous: Phase | null } {
  const [phase, setPhaseValue] = useState<Phase | null>(null)
  const prevRef = useRef<Phase | null>(null)
  const [previous, setPrevious] = useState<Phase | null>(null)

  useEffect(() => {
    let live = true
    const update = (next: Phase) => {
      if (!live) return
      setPhaseValue((cur) => {
        if (cur !== next) {
          prevRef.current = cur
          setPrevious(cur)
        }
        return next
      })
    }

    getPhase().then(update)

    const channel = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
        (payload) => update((payload.new as { phase: Phase }).phase),
      )
      .subscribe()

    // Safety net if Realtime isn't enabled: poll slowly.
    const t = setInterval(() => getPhase().then(update), 8000)

    return () => {
      live = false
      clearInterval(t)
      supabase.removeChannel(channel)
    }
  }, [])

  return { phase, previous }
}
