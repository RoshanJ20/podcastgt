/**
 * @module PodcastPlayerClient
 *
 * Client-side podcast player component with inline transcript and bookmarks.
 *
 * Key responsibilities:
 * - Wraps the AudioPlayer, TranscriptViewer, and BookmarkPanel in a shared PlayerContext
 * - Provides mobile-responsive tabbed layout for transcript and bookmarks
 * - Serves as the main player entry point for embedded podcast views
 */
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AudioPlayer } from './AudioPlayer'
import { TranscriptViewer } from './TranscriptViewer'
import { BookmarkPanel } from './BookmarkPanel'
import { PlayerProvider, usePodcastPlayer } from './PlayerContext'
import type { Podcast, TranscriptSegment } from '@/lib/supabase/types'

interface PodcastPlayerClientProps {
  podcast: Podcast
  isLoggedIn: boolean
}

function PlayerWithControls({ podcast, isLoggedIn }: PodcastPlayerClientProps) {
  const { currentTime, seekTo, setCurrentTime, handleSeek } = usePodcastPlayer()
  const { activeAudioType, setActiveAudioType } = usePodcastPlayer()
  const transcript = podcast.transcripts?.find((t) => t.transcript_type === activeAudioType) ?? podcast.transcripts?.[0]
  const segments = (transcript?.segments as TranscriptSegment[]) ?? []

  return (
    <div className="space-y-4">
      <AudioPlayer
        shortUrl={podcast.audio_short_url}
        longUrl={podcast.audio_long_url}
        onTimeUpdate={setCurrentTime}
        seekTo={seekTo}
      />

      {/* On mobile: show transcript + bookmarks inline */}
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
    </div>
  )
}

export function PodcastPlayerClient({ podcast, isLoggedIn }: PodcastPlayerClientProps) {
  return (
    <PlayerProvider>
      <PlayerWithControls podcast={podcast} isLoggedIn={isLoggedIn} />
    </PlayerProvider>
  )
}
