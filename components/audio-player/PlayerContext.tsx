/**
 * @module PlayerContext
 *
 * React context provider for sharing audio player state across components.
 *
 * Key responsibilities:
 * - Provides shared current playback time to transcript and bookmark components
 * - Exposes a seek handler for navigating to specific timestamps from external components
 * - Manages seek-to state with auto-reset to avoid stale seek commands
 */
'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface PlayerContextValue {
  currentTime: number
  seekTo: number | null
  setCurrentTime: (t: number) => void
  handleSeek: (t: number) => void
}

const PlayerContext = createContext<PlayerContextValue>({
  currentTime: 0,
  seekTo: null,
  setCurrentTime: () => null,
  handleSeek: () => null,
})

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState(0)
  const [seekTo, setSeekTo] = useState<number | null>(null)

  const handleSeek = useCallback((time: number) => {
    setSeekTo(time)
    setTimeout(() => setSeekTo(null), 100)
  }, [])

  return (
    <PlayerContext.Provider value={{ currentTime, seekTo, setCurrentTime, handleSeek }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePodcastPlayer() {
  return useContext(PlayerContext)
}
