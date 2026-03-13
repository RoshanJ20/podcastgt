'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  GripVertical,
  Plus,
  X,
  Loader2,
  Music,
  ChevronUp,
  ChevronDown,
  Search,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'

interface Episode {
  id: string
  title: string
  domain: Domain
  year: number
  episode_order: number | null
  thumbnail_url: string | null
}

interface UnassignedPodcast {
  id: string
  title: string
  domain: Domain
  year: number
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
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [unassigned, setUnassigned] = useState<UnassignedPodcast[]>([])
  const [loadingUnassigned, setLoadingUnassigned] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [addingEpisodes, setAddingEpisodes] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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

  const fetchUnassigned = async () => {
    setLoadingUnassigned(true)
    try {
      const res = await fetch('/api/podcasts?content_type=learning_series&unassigned=true')
      if (res.ok) {
        const data = await res.json()
        setUnassigned(data)
      }
    } catch {
      toast.error('Failed to load available podcasts')
    } finally {
      setLoadingUnassigned(false)
    }
  }

  const handleOpenAddPanel = () => {
    setShowAddPanel(true)
    setSelectedIds(new Set())
    setSearchQuery('')
    fetchUnassigned()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selectedIds.size === 0) return
    setAddingEpisodes(true)
    try {
      const res = await fetch(`/api/playlists/${playlistId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcast_ids: Array.from(selectedIds) }),
      })
      if (!res.ok) throw new Error('Failed to add episodes')
      toast.success(`Added ${selectedIds.size} episode(s)`)
      setShowAddPanel(false)
      setSelectedIds(new Set())
      await fetchEpisodes()
    } catch {
      toast.error('Failed to add episodes')
    } finally {
      setAddingEpisodes(false)
    }
  }

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

  const filteredUnassigned = unassigned.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddPanel}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Episodes
          </Button>
        </div>
      </div>

      {/* Episode list */}
      {episodes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <Music className="h-8 w-8 mx-auto mb-2 opacity-40" />
          No episodes yet. Click &ldquo;Add Episodes&rdquo; to get started.
        </div>
      ) : (
        <div className="space-y-1.5">
          {episodes.map((episode, index) => (
            <div
              key={episode.id}
              className="flex items-center gap-3 p-3 rounded-lg glass-card group hover:border-[#8B5CF6]/20 transition-all"
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

              <span className="text-xs font-bold text-[#8B5CF6] w-6 text-center">
                {index + 1}
              </span>

              {episode.thumbnail_url ? (
                <img
                  src={episode.thumbnail_url}
                  alt=""
                  className="h-10 w-10 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                  <Music className="h-4 w-4 text-[#8B5CF6]/50" />
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

      {/* Add episodes panel */}
      {showAddPanel && (
        <Card className="glass-card border-[#8B5CF6]/20">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add Learning Series Episodes</p>
              <Button variant="ghost" size="icon" onClick={() => setShowAddPanel(false)} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search podcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {loadingUnassigned ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : filteredUnassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No unassigned learning series podcasts found.
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredUnassigned.map((podcast) => (
                  <button
                    key={podcast.id}
                    onClick={() => toggleSelect(podcast.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      selectedIds.has(podcast.id)
                        ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                        selectedIds.has(podcast.id)
                          ? 'bg-[#8B5CF6] border-[#8B5CF6]'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {selectedIds.has(podcast.id) && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {podcast.thumbnail_url ? (
                      <img src={podcast.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                        <Music className="h-3 w-3 text-[#8B5CF6]/50" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{podcast.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DOMAIN_COLORS[podcast.domain]}`}>
                          {podcast.domain}
                        </span>
                        <span className="text-xs text-muted-foreground">{podcast.year}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleAddSelected}
                  disabled={addingEpisodes}
                  className="btn-gradient px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center"
                >
                  {addingEpisodes && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                  Add to Playlist
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
