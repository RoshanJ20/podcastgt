/**
 * @module BookmarkPanel
 *
 * Panel for managing timestamped bookmarks on a podcast episode.
 *
 * Key responsibilities:
 * - Displays a scrollable list of bookmarks with timestamps and notes
 * - Allows adding new bookmarks at the current playback position
 * - Supports deleting existing bookmarks via API
 * - Clicking a bookmark timestamp seeks the audio player to that position
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Bookmark, Plus, Trash2, Clock } from 'lucide-react'
import type { Bookmark as BookmarkType } from '@/lib/supabase/types'

interface BookmarkPanelProps {
  podcastId: string
  currentTime: number
  onSeek: (time: number) => void
  isLoggedIn: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function BookmarkPanel({ podcastId, currentTime, onSeek, isLoggedIn }: BookmarkPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([])
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/bookmarks')
      .then((response) => response.json())
      .then((data: BookmarkType[]) => {
        setBookmarks(data.filter((bookmark) => bookmark.podcast_id === podcastId))
      })
  }, [podcastId, isLoggedIn])

  const handleAdd = async () => {
    setAdding(true)
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podcast_id: podcastId, timestamp_seconds: currentTime, note }),
      })
      if (!res.ok) throw new Error()
      const bookmark = await res.json()
      setBookmarks((prev) =>
        [...prev, bookmark].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
      )
      setNote('')
      setShowForm(false)
      toast.success('Bookmark added')
    } catch (error) {
      console.error('[BookmarkPanel] Failed to add bookmark:', error)
      toast.error('Failed to add bookmark')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/bookmarks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
      toast.success('Bookmark removed')
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4 space-y-2">
        <Bookmark className="h-5 w-5 mx-auto opacity-40" />
        <p>Sign in to save bookmarks.</p>
        <a href="/login?redirectTo=/" className="text-primary hover:underline text-xs">Sign in</a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Bookmark className="h-4 w-4" />
          Bookmarks
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setShowForm((visible) => !visible)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add at {formatTime(currentTime)}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-2 p-3 rounded-lg glass-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(currentTime)}</span>
          </div>
          <Textarea
            placeholder="Add a note (optional)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={adding} className="btn-gradient h-7 px-4 rounded-md text-xs font-medium disabled:opacity-50">
              Save
            </button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="h-48">
        {bookmarks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No bookmarks yet.</p>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-start gap-2 p-2 rounded glass-card hover:border-primary/20 transition-colors"
              >
                <button
                  onClick={() => onSeek(bookmark.timestamp_seconds)}
                  className="text-xs font-mono text-primary hover:underline shrink-0 mt-0.5"
                >
                  {formatTime(bookmark.timestamp_seconds)}
                </button>
                <div className="flex-1 min-w-0">
                  {bookmark.note && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{bookmark.note}</p>
                  )}
                  {!bookmark.note && (
                    <p className="text-xs text-muted-foreground italic">No note</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(bookmark.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
