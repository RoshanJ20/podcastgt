'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TranscriptViewer } from './TranscriptViewer'
import { BookmarkPanel } from './BookmarkPanel'
import { usePodcastPlayer } from './PlayerContext'
import type { Podcast, TranscriptSegment } from '@/lib/supabase/types'

interface PodcastSidebarProps {
  podcast: Podcast
  isLoggedIn: boolean
}

export function PodcastSidebar({ podcast, isLoggedIn }: PodcastSidebarProps) {
  const { currentTime, handleSeek } = usePodcastPlayer()
  const transcript = podcast.transcript
  const segments = (transcript?.segments as TranscriptSegment[]) ?? []

  return (
    <div className="space-y-4 sticky top-20">
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
  )
}
