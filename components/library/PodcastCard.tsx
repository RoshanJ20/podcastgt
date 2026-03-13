import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, FileText } from 'lucide-react'
import type { Podcast } from '@/lib/supabase/types'

export function PodcastCard({ podcast }: { podcast: Podcast }) {
  return (
    <Link href={`/podcast/${podcast.id}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {podcast.thumbnail_url ? (
            <img
              src={podcast.thumbnail_url}
              alt={podcast.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <span className="text-4xl font-bold text-primary/30">
                {podcast.domain}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow">
              <Play className="h-6 w-6 text-primary fill-primary" />
            </div>
          </div>
        </div>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-2 leading-snug">{podcast.title}</h3>
            <Badge variant="outline" className="text-xs shrink-0">{podcast.domain}</Badge>
          </div>
          {podcast.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{podcast.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{podcast.year}</span>
            <div className="flex items-center gap-2">
              {podcast.transcript && (
                <span className="flex items-center gap-0.5" title="Transcript available">
                  <FileText className="h-3 w-3" />
                </span>
              )}
              {podcast.bulletin_url && (
                <span title="Bulletin available">PDF</span>
              )}
            </div>
          </div>
          {podcast.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {podcast.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
