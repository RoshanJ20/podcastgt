import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PodcastCard } from '@/components/library/PodcastCard'
import { Badge } from '@/components/ui/badge'
import { ListMusic } from 'lucide-react'
import type { Podcast } from '@/lib/supabase/types'

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: playlist } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single()

  if (!playlist) notFound()

  const { data: episodes } = await supabase
    .from('podcasts')
    .select('*, transcript:transcripts(id)')
    .eq('playlist_id', id)
    .order('episode_order', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start gap-6">
        <div className="shrink-0 w-32 h-32 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
          {playlist.thumbnail_url ? (
            <img src={playlist.thumbnail_url} alt={playlist.title} className="w-full h-full object-cover" />
          ) : (
            <ListMusic className="h-12 w-12 text-primary/30" />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge>Learning Series</Badge>
            <Badge variant="outline">{playlist.domain}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{playlist.title}</h1>
          {playlist.description && (
            <p className="text-muted-foreground">{playlist.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {episodes?.length ?? 0} episodes · {playlist.year}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {episodes?.map((ep, i) => (
          <div key={ep.id} className="relative">
            <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {i + 1}
            </div>
            <PodcastCard podcast={ep as Podcast} />
          </div>
        ))}
      </div>
    </div>
  )
}
