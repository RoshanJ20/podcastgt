'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  GripVertical,
  Plus,
  X,
  Loader2,
  Music,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'
import { UploadForm } from './UploadForm'

interface Episode {
  id: string
  title: string
  domain: Domain
  year: number
  episode_order: number | null
  thumbnail_url: string | null
}

interface PlaylistEpisodeManagerProps {
  playlistId: string
  playlistTitle: string
}

export function PlaylistEpisodeManager({ playlistId, playlistTitle }: PlaylistEpisodeManagerProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchEpisodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`)
      if (res.ok) {
        const data = await res.json()
        setEpisodes(data)
      }
    } catch {
      toast.error('Failed to load episodes')
    } finally {
      setLoading(false)
    }
  }, [playlistId])

  useEffect(() => {
    fetchEpisodes()
  }, [fetchEpisodes])

  const handleRemove = async (podcastId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcast_id: podcastId }),
      })
      if (!res.ok) throw new Error('Failed to remove episode')
      setEpisodes((prev) => prev.filter((e) => e.id !== podcastId))
      toast.success('Episode removed')
    } catch {
      toast.error('Failed to remove episode')
    }
  }

  const moveEpisode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= episodes.length) return
    const newEpisodes = [...episodes]
    const temp = newEpisodes[index]
    newEpisodes[index] = newEpisodes[newIndex]
    newEpisodes[newIndex] = temp
    setEpisodes(newEpisodes)
    setHasChanges(true)
  }

  const saveOrder = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: episodes.map((e) => e.id) }),
      })
      if (!res.ok) throw new Error('Failed to save order')
      toast.success('Episode order saved')
      setHasChanges(false)
    } catch {
      toast.error('Failed to save order')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadSuccess = () => {
    setUploadOpen(false)
    fetchEpisodes()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading episodes...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Episodes in &ldquo;{playlistTitle}&rdquo;
        </h3>
        <div className="flex gap-2">
          {hasChanges && (
            <button
              onClick={saveOrder}
              disabled={saving}
              className="btn-gradient px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center"
            >
              {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
              Save Order
            </button>
          )}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5" />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Upload Episode
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload Episode to &ldquo;{playlistTitle}&rdquo;</DialogTitle>
              </DialogHeader>
              <UploadForm
                defaultPlaylistId={playlistId}
                onSuccess={handleUploadSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Episode list */}
      {episodes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <Music className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No episodes yet. Click &ldquo;Upload Episode&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-1.5">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              className="flex items-center gap-3 p-3 rounded-lg glass-card group hover:border-[#60A5FA]/20 transition-all"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveEpisode(index, 'up')}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                <button
                  onClick={() => moveEpisode(index, 'down')}
                  disabled={index === episodes.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-xs font-bold text-[#60A5FA] w-6 text-center">
                {index + 1}
              </span>

              {episode.thumbnail_url ? (
                <img
                  src={episode.thumbnail_url}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-[#60A5FA]/10 flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-[#60A5FA]/50" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{episode.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DOMAIN_COLORS[episode.domain]}`}>
                    {episode.domain}
                  </span>
                  <span className="text-xs text-muted-foreground">{episode.year}</span>
                </div>
              </div>

              <button
                onClick={() => handleRemove(episode.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                title="Remove from playlist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
