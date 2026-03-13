import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ListMusic } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Playlist } from '@/lib/supabase/types'

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link href={`/playlist/${playlist.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 cursor-pointer h-full glass-card hover:border-[#38BDF8]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#38BDF8]/10">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {playlist.thumbnail_url ? (
            <img
              src={playlist.thumbnail_url}
              alt={playlist.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#38BDF8]/30 to-[#60A5FA]/20">
              <ListMusic className="h-12 w-12 text-white/30" />
            </div>
          )}
          {/* Episode count badge */}
          {playlist.episode_count !== undefined && (
            <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[#60A5FA] to-[#38BDF8] text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg">
              {playlist.episode_count} episodes
            </div>
          )}
          {/* Domain badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[playlist.domain]}`}>
              {playlist.domain}
            </span>
          </div>
        </div>
        <CardContent className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">{playlist.title}</h3>
          {playlist.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{playlist.description}</p>
          )}
          <p className="text-xs text-muted-foreground">{playlist.year}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
