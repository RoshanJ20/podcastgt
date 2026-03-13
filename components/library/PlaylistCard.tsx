import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ListMusic } from 'lucide-react'
import type { Playlist } from '@/lib/supabase/types'

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link href={`/playlist/${playlist.id}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {playlist.thumbnail_url ? (
            <img
              src={playlist.thumbnail_url}
              alt={playlist.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <ListMusic className="h-12 w-12 text-primary/30" />
            </div>
          )}
          {playlist.episode_count !== undefined && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
              {playlist.episode_count} episodes
            </div>
          )}
        </div>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-2 leading-snug">{playlist.title}</h3>
            <Badge variant="outline" className="text-xs shrink-0">{playlist.domain}</Badge>
          </div>
          {playlist.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{playlist.year}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
