/**
 * @module EpisodeSidebar
 *
 * Sidebar panel for adding new episodes to a learning path editor.
 *
 * Key responsibilities:
 * - Provides a button to add a new blank episode to the canvas/list
 * - Shows a count of existing episodes in the current path
 */
'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface EpisodeSidebarProps {
  episodeCount: number
  onAddEpisode: () => void
}

export function EpisodeSidebar({ episodeCount, onAddEpisode }: EpisodeSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Episodes</h3>
          <span className="text-xs text-muted-foreground">{episodeCount} total</span>
        </div>
        <Button className="w-full gap-1" size="sm" onClick={onAddEpisode}>
          <Plus className="h-3.5 w-3.5" />
          Add Episode
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Add episodes and double-click to edit their content.
        </p>
      </div>
    </div>
  )
}
