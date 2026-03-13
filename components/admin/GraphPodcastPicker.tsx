'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Upload } from 'lucide-react'
import { UploadForm } from './UploadForm'
import type { Podcast } from '@/lib/supabase/types'

type PodcastSummary = Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain'>

interface GraphPodcastPickerProps {
  podcasts: PodcastSummary[]
  usedPodcastIds: Set<string>
  onAddPodcast: (podcast: PodcastSummary) => void
  onPodcastCreated?: (podcast: PodcastSummary) => void
}

export function GraphPodcastPicker({
  podcasts,
  usedPodcastIds,
  onAddPodcast,
  onPodcastCreated,
}: GraphPodcastPickerProps) {
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return podcasts
    const q = search.toLowerCase()
    return podcasts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q)
    )
  }, [podcasts, search])

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Add Bulletins</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setUploadOpen(true)}>
            <Upload className="h-3 w-3" />
            New
          </Button>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Bulletin</DialogTitle>
              </DialogHeader>
              <UploadForm
                onSuccess={(podcast) => {
                  setUploadOpen(false)
                  onPodcastCreated?.(podcast as PodcastSummary)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search bulletins…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.map((podcast) => {
            const isUsed = usedPodcastIds.has(podcast.id)
            return (
              <div
                key={podcast.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent group text-sm"
              >
                {podcast.thumbnail_url && (
                  <img
                    src={podcast.thumbnail_url}
                    alt=""
                    className="w-6 h-6 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{podcast.title}</p>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                    {podcast.domain}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  disabled={isUsed}
                  onClick={() => onAddPodcast(podcast)}
                  title={isUsed ? 'Already on canvas' : 'Add to canvas'}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                {isUsed && (
                  <span className="text-[10px] text-muted-foreground shrink-0">Added</span>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No bulletins found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
