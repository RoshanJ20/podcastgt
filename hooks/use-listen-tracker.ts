'use client'

import { useRef, useCallback } from 'react'

const LISTEN_THRESHOLD_SECONDS = 10

interface ListenTrackerOptions {
  podcastId?: string
  episodeId?: string
  graphId?: string
}

/**
 * Tracks cumulative playback time and records a 'listen' activity
 * after the user has listened for at least 10 seconds.
 * Fires at most once per mount to avoid duplicate records.
 *
 * Call `onTimeUpdate` from the audio player's time update handler.
 * Call `onPlay` when playback starts to begin tracking.
 */
export function useListenTracker({ podcastId, episodeId, graphId }: ListenTrackerOptions) {
  const recorded = useRef(false)
  const lastTime = useRef<number | null>(null)
  const accumulated = useRef(0)

  const recordListen = useCallback(() => {
    if (recorded.current) return
    recorded.current = true

    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'listen',
        episode_id: episodeId ?? null,
        graph_id: graphId ?? null,
        metadata: podcastId ? { podcast_id: podcastId } : {},
      }),
    }).catch(() => {})
  }, [podcastId, episodeId, graphId])

  const onTimeUpdate = useCallback(
    (currentTime: number) => {
      if (recorded.current) return

      if (lastTime.current !== null) {
        const delta = currentTime - lastTime.current
        // Only count forward progress within a reasonable range (handles seeks/pauses)
        if (delta > 0 && delta < 2) {
          accumulated.current += delta
        }
      }
      lastTime.current = currentTime

      if (accumulated.current >= LISTEN_THRESHOLD_SECONDS) {
        recordListen()
      }
    },
    [recordListen],
  )

  const onPlay = useCallback(() => {
    // Reset lastTime so the first timeupdate after play doesn't count the gap
    lastTime.current = null
  }, [])

  return { onTimeUpdate, onPlay }
}
