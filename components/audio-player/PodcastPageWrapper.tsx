'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, ListMusic } from 'lucide-react'
import Link from 'next/link'
import { PlayerProvider, usePodcastPlayer } from './PlayerContext'
import { AudioPlayer } from './AudioPlayer'
import { TranscriptViewer } from './TranscriptViewer'
import { BookmarkPanel } from './BookmarkPanel'
import type { Podcast, TranscriptSegment } from '@/lib/supabase/types'

interface Props {
  podcast: Podcast & { playlist?: { id: string; title: string } | null }
  isLoggedIn: boolean
}

function InnerLayout({ podcast, isLoggedIn }: Props) {
  const { currentTime, seekTo, setCurrentTime, handleSeek } = usePodcastPlayer()
  const transcript = podcast.transcript
  const segments = (transcript?.segments as TranscriptSegment[]) ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Podcast header */}
        <div className="flex gap-4">
          <div className="shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-muted">
            {podcast.thumbnail_url ? (
              <img
                src={podcast.thumbnail_url}
                alt={podcast.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <span className="text-2xl font-bold text-primary/30">{podcast.domain}</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{podcast.domain}</Badge>
              <Badge variant="secondary">{podcast.year}</Badge>
              {podcast.content_type === 'learning_series' && <Badge>Learning Series</Badge>}
            </div>
            <h1 className="text-xl font-bold leading-snug">{podcast.title}</h1>
            {podcast.description && (
              <p className="text-sm text-muted-foreground">{podcast.description}</p>
            )}
            {podcast.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {podcast.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Audio player */}
        <AudioPlayer
          shortUrl={podcast.audio_short_url}
          longUrl={podcast.audio_long_url}
          onTimeUpdate={setCurrentTime}
          seekTo={seekTo}
        />

        {/* Mobile: transcript + bookmarks inline */}
        <div className="lg:hidden">
          <Tabs defaultValue="transcript">
            <TabsList className="w-full">
              <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
            </TabsList>
            <TabsContent value="transcript" className="mt-3">
              <TranscriptViewer
                segments={segments}
                fullText={transcript?.full_text}
                currentTime={currentTime}
                onSeek={handleSeek}
              />
            </TabsContent>
            <TabsContent value="bookmarks" className="mt-3">
              <BookmarkPanel
                podcastId={podcast.id}
                currentTime={currentTime}
                onSeek={handleSeek}
                isLoggedIn={isLoggedIn}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Playlist link */}
        {podcast.playlist && (
          <Card>
            <CardContent className="pt-4">
              <Link
                href={`/playlist/${podcast.playlist.id}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <ListMusic className="h-4 w-4" />
                <span>
                  Part of: <span className="font-medium">{podcast.playlist.title}</span>
                </span>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Bulletin */}
        {podcast.bulletin_url && (
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Bulletin</p>
              <p className="text-xs text-muted-foreground">
                Download the full PDF report for this podcast.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <a href={podcast.bulletin_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Right sidebar: desktop transcript + bookmarks */}
      <div className="hidden lg:block space-y-4 sticky top-20">
        <Tabs defaultValue="transcript">
          <TabsList className="w-full">
            <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
          </TabsList>
          <TabsContent value="transcript" className="mt-3">
            <TranscriptViewer
              segments={segments}
              fullText={transcript?.full_text}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          </TabsContent>
          <TabsContent value="bookmarks" className="mt-3">
            <BookmarkPanel
              podcastId={podcast.id}
              currentTime={currentTime}
              onSeek={handleSeek}
              isLoggedIn={isLoggedIn}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export function PodcastPageWrapper(props: Props) {
  return (
    <PlayerProvider>
      <InnerLayout {...props} />
    </PlayerProvider>
  )
}
