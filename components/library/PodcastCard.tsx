import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Play, FileText } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Podcast } from '@/lib/supabase/types'

export function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link href={`/podcast/${podcast.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 cursor-pointer h-full glass-card hover:border-[#8B5CF6]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#8B5CF6]/10">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {podcast.thumbnail_url ? (
            <img
              src={podcast.thumbnail_url}
              alt={podcast.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/20">
              <span className="text-4xl font-bold text-white/30 font-[family-name:var(--font-heading)]">
                {podcast.domain}
              </span>
            </div>
          )}
          {/* Hover play overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-full p-3 shadow-lg glow-primary transform scale-90 group-hover:scale-100 transition-transform">
              <Play className="h-6 w-6 text-white fill-white" />
            </div>
          </div>
          {/* Domain badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[podcast.domain]}`}>
              {podcast.domain}
            </span>
          </div>
        </div>
        <CardContent className="p-3 space-y-1.5">
          <h3 className="font-medium text-sm line-clamp-2 leading-snug">{podcast.title}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{podcast.year}</span>
            <div className="flex items-center gap-2">
              {podcast.transcript && (
                <span className="flex items-center gap-0.5 text-[#8B5CF6]" title="Transcript available">
                  <FileText className="h-3 w-3" />
                </span>
              )}
              {podcast.bulletin_url && (
                <span className="text-[#3B82F6] font-medium" title="Bulletin available">PDF</span>
              )}
            </div>
          </div>
          {podcast.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {podcast.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-[#8B5CF6]/15 text-[#A78BFA] px-1.5 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
