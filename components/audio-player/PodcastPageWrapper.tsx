/**
 * @module PodcastPageWrapper
 *
 * Full-page layout wrapper for the podcast detail view with integrated player and sidebar.
 *
 * Key responsibilities:
 * - Renders the podcast header with metadata (thumbnail, domain, tags, description)
 * - Wraps the audio player, transcript, and bookmark panel in a shared PlayerContext
 * - Provides responsive layout with desktop sidebar and mobile tab navigation
 * - Displays the bulletin PDF viewer when a PDF is available
 */
'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayerProvider, usePodcastPlayer } from './PlayerContext'
import { AudioPlayer } from './AudioPlayer'
import { TranscriptViewer } from './TranscriptViewer'
import { BookmarkPanel } from './BookmarkPanel'
import { BulletinViewer } from './BulletinViewer'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Podcast, TranscriptSegment } from '@/lib/supabase/types'
import { useListenTracker } from '@/hooks/use-listen-tracker'

interface Props {
  podcast: Podcast
  isLoggedIn: boolean
}

function InnerLayout({ podcast, isLoggedIn }: Props) {
  const { currentTime, seekTo, activeAudioType, setCurrentTime, handleSeek, setActiveAudioType } = usePodcastPlayer()
  const listenTracker = useListenTracker({ podcastId: podcast.id })
  const transcript = podcast.transcripts?.find((t) => t.transcript_type === activeAudioType) ?? podcast.transcripts?.[0]
  const segments = (transcript?.segments as TranscriptSegment[]) ?? []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Podcast header */}
        <div className="flex gap-4">
          <div className="shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-card ring-1 ring-border">
            {podcast.thumbnail_url ? (
              <img
                src={podcast.thumbnail_url}
                alt={podcast.title ?? 'Bulletin'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#60A5FA]/30 to-[#38BDF8]/20">
                <span className="text-2xl font-bold text-white/30 font-[family-name:var(--font-heading)]">{podcast.domain ?? ''}</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap gap-2">
              {podcast.domain && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${DOMAIN_COLORS[podcast.domain]}`}>
                  {podcast.domain}
                </span>
              )}
              {podcast.year != null && (
                <Badge variant="secondary" className="font-semibold">{podcast.year}</Badge>
              )}
            </div>
            <h1 className="text-xl font-bold leading-snug font-[family-name:var(--font-heading)]">{podcast.title ?? 'Untitled'}</h1>
            {podcast.description && (
              <p className="text-sm text-muted-foreground">{podcast.description}</p>
            )}
            {podcast.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {podcast.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-[#60A5FA]/15 text-[#93C5FD] px-2 py-0.5 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="bg-border/50" />

        <AudioPlayer
          shortUrl={podcast.audio_short_url}
          longUrl={podcast.audio_long_url}
          onTimeUpdate={(t) => { setCurrentTime(t); listenTracker.onTimeUpdate(t) }}
          onDurationModeChange={setActiveAudioType}
          onPlay={listenTracker.onPlay}
          seekTo={seekTo}
        />

        {/* Mobile: transcript + bookmarks */}
        <div className="lg:hidden">
          <Tabs defaultValue="transcript">
            <TabsList className="w-full">
              <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
              <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
            </TabsList>
            <TabsContent value="transcript" className="mt-3">
              <TranscriptViewer segments={segments} fullText={transcript?.full_text} currentTime={currentTime} onSeek={handleSeek} />
            </TabsContent>
            <TabsContent value="bookmarks" className="mt-3">
              <BookmarkPanel podcastId={podcast.id} currentTime={currentTime} onSeek={handleSeek} isLoggedIn={isLoggedIn} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Bulletins */}
        {podcast.bulletin_urls?.map((url, i) => (
          <BulletinViewer key={i} url={url} />
        ))}
      </div>

      {/* Right sidebar */}
      <div className="hidden lg:block space-y-4 sticky top-20">
        <Tabs defaultValue="transcript">
          <TabsList className="w-full">
            <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex-1">Bookmarks</TabsTrigger>
          </TabsList>
          <TabsContent value="transcript" className="mt-3">
            <TranscriptViewer segments={segments} fullText={transcript?.full_text} currentTime={currentTime} onSeek={handleSeek} />
          </TabsContent>
          <TabsContent value="bookmarks" className="mt-3">
            <BookmarkPanel podcastId={podcast.id} currentTime={currentTime} onSeek={handleSeek} isLoggedIn={isLoggedIn} />
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
