import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Episode } from '@/lib/supabase/types'

interface NodeListProps {
  episodes: Episode[]
  completedEpisodeIds: Set<string>
  onEpisodeClick: (episode: Episode) => void
  selectedEpisodeId?: string
}

export function NodeList({ episodes, completedEpisodeIds, onEpisodeClick, selectedEpisodeId }: NodeListProps) {
  return (
    <div className="space-y-2">
      {episodes.map((episode, index) => {
        const isCompleted = completedEpisodeIds.has(episode.id)
        const isSelected = selectedEpisodeId === episode.id
        return (
          <Card
            key={episode.id}
            className={cn(
              'cursor-pointer transition-all duration-200',
              isCompleted && 'border-green-500/30 bg-green-500/5',
              isSelected
                ? 'border-primary ring-1 ring-primary/30 shadow-md'
                : 'hover:shadow-md hover:border-border/80',
            )}
            onClick={() => onEpisodeClick(episode)}
          >
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <span
                className={cn(
                  'text-sm font-bold w-7 h-7 shrink-0 flex items-center justify-center rounded-full',
                  isCompleted
                    ? 'bg-green-500/10 text-green-500'
                    : isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </span>
              {episode.thumbnail_url && (
                <img
                  src={episode.thumbnail_url}
                  alt=""
                  className="w-9 h-9 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {episode.title}
                </p>
                {episode.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {episode.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
