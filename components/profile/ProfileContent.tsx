/**
 * @module ProfileContent
 *
 * User profile page displaying account info, learning progress, and bookmarks.
 *
 * Key responsibilities:
 * - Shows user avatar, email, join date, and summary statistics
 * - Displays learning path progress grouped by graph with completed nodes
 * - Lists all bookmarks with podcast links, timestamps, and delete controls
 * - Provides sign-out and navigation to analytics
 */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Bookmark, Trash2, Clock, User, Calendar, CheckCircle2, GitBranch, BarChart3 } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'

interface BookmarkWithPodcast {
  id: string
  podcast_id: string
  timestamp_seconds: number
  note: string | null
  created_at: string
  podcast?: {
    id: string
    title: string
    thumbnail_url: string | null
    domain: Domain
  }
}

interface ProgressWithGraph {
  id: string
  graph_id: string
  node_id: string
  completed_at: string
  graph?: {
    id: string
    title: string
    domain: Domain
  }
  node?: {
    id: string
    label: string | null
    podcast?: {
      id: string
      title: string
    }
  }
}

interface ProfileContentProps {
  user: { id: string; email: string; createdAt: string }
  bookmarks: BookmarkWithPodcast[]
  progress: ProgressWithGraph[]
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function ProfileContent({ user, bookmarks: initialBookmarks, progress }: ProfileContentProps) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)

  const handleDeleteBookmark = async (id: string) => {
    const res = await fetch('/api/bookmarks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
      toast.success('Bookmark removed')
    } else {
      toast.error('Failed to remove bookmark')
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = user.email.split('@')[0].slice(0, 2).toUpperCase()
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  // Group progress by graph
  const progressByGraph = progress.reduce<Record<string, ProgressWithGraph[]>>((acc, progressEntry) => {
    const graphId = progressEntry.graph_id
    if (!acc[graphId]) acc[graphId] = []
    acc[graphId].push(progressEntry)
    return acc
  }, {})

  return (
    <>
      {/* Profile header */}
      <Card className="glass-card overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#60A5FA] via-[#818CF8] to-[#38BDF8]" />
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-[#60A5FA] to-[#818CF8] text-white text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold font-[family-name:var(--font-heading)]">{user.email}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {joinDate}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="h-3.5 w-3.5" />
                  {bookmarks.length} bookmarks
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" asChild>
                <Link href="/progress">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-green-500">{progress.length}</p>
            <p className="text-[11px] text-muted-foreground">Bulletins Done</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[#60A5FA]">{Object.keys(progressByGraph).length}</p>
            <p className="text-[11px] text-muted-foreground">Paths Started</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[#818CF8]">{bookmarks.length}</p>
            <p className="text-[11px] text-muted-foreground">Bookmarks</p>
          </CardContent>
        </Card>
      </div>

      {/* Learning path progress */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5 text-[#38BDF8]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Learning Progress</h2>
        </div>
        {Object.keys(progressByGraph).length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No progress yet. Start a learning path to track your progress.</p>
              <Link href="/learning-path" className="text-primary hover:underline text-sm mt-2 inline-block">
                Browse learning paths
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {Object.entries(progressByGraph).map(([graphId, entries]) => {
              const graph = entries[0]?.graph
              return (
                <Card key={graphId} className="glass-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Link href={`/learning-path/${graphId}`} className="hover:underline">
                        <CardTitle className="text-base">{graph?.title ?? 'Unknown path'}</CardTitle>
                      </Link>
                      {graph?.domain && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[graph.domain]}`}>
                          {graph.domain}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {entries.map((entry) => (
                        <Badge key={entry.id} variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                          {entry.node?.podcast?.title ?? entry.node?.label ?? 'Completed'}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {entries.length} bulletin{entries.length !== 1 ? 's' : ''} completed
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Separator />

      {/* Bookmarks */}
      <section id="bookmarks">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="h-5 w-5 text-[#60A5FA]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Bookmarks</h2>
        </div>
        {bookmarks.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No bookmarks yet. Listen to a bulletin and add bookmarks at key moments.</p>
              <Link href="/" className="text-primary hover:underline text-sm mt-2 inline-block">
                Browse bulletins
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="glass-card hover:border-primary/20 transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-start gap-3">
                    {bookmark.podcast?.thumbnail_url ? (
                      <img
                        src={bookmark.podcast.thumbnail_url}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-[#60A5FA]/30 to-[#38BDF8]/20 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/podcast/${bookmark.podcast_id}`}
                        className="text-sm font-medium hover:underline line-clamp-1"
                      >
                        {bookmark.podcast?.title ?? 'Unknown bulletin'}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-primary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(bookmark.timestamp_seconds)}
                        </span>
                        {bookmark.podcast?.domain && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${DOMAIN_COLORS[bookmark.podcast.domain]}`}>
                            {bookmark.podcast.domain}
                          </span>
                        )}
                      </div>
                      {bookmark.note && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bookmark.note}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
