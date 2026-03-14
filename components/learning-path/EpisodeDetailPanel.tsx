'use client'

import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/audio-player/AudioPlayer'
import { CheckCircle2, Circle, X, FileText, Headphones } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { EpisodeTranscript, GraphNodeType } from '@/lib/supabase/types'

interface EpisodeDetailPanelProps {
  episode: {
    title: string
    description: string | null
    thumbnailUrl: string | null
    audioUrl: string | null
    transcript: EpisodeTranscript | null
    nodeType?: GraphNodeType
  }
  episodeId?: string
  isCompleted?: boolean
  isLoggedIn?: boolean
  onToggleComplete?: (episodeId: string) => void
  onClose: () => void
}

const nodeTypeLabels: Partial<Record<GraphNodeType, { label: string; color: string }>> = {
  start: { label: 'Start', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
  milestone: { label: 'Milestone', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  end: { label: 'Final', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export function EpisodeDetailPanel({
  episode,
  episodeId,
  isCompleted,
  isLoggedIn,
  onToggleComplete,
  onClose,
}: EpisodeDetailPanelProps) {
  const nodeLabel = episode.nodeType ? nodeTypeLabels[episode.nodeType] : null

  return (
    <div className="h-full flex flex-col bg-card/80 backdrop-blur-sm border-l border-border">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 pb-3 border-b border-border/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {nodeLabel && (
              <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border', nodeLabel.color)}>
                {nodeLabel.label}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-base leading-snug">{episode.title}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0 -mt-1 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Thumbnail */}
          {episode.thumbnailUrl && (
            <div className="rounded-lg overflow-hidden border border-border/50">
              <img
                src={episode.thumbnailUrl}
                alt={episode.title}
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          {/* Description */}
          {episode.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {episode.description}
            </p>
          )}

          {/* Audio Player */}
          {episode.audioUrl ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Headphones className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Listen</span>
              </div>
              <AudioPlayer
                shortUrl={null}
                longUrl={episode.audioUrl}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/50 p-4 text-center">
              <Headphones className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground/70">No audio available yet</p>
            </div>
          )}

          {/* Transcript */}
          {episode.transcript?.full_text && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transcript</span>
              </div>
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {episode.transcript.full_text}
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with completion button */}
      {isLoggedIn && episodeId && onToggleComplete && (
        <div className="p-4 pt-3 border-t border-border/50">
          <Button
            variant={isCompleted ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleComplete(episodeId)}
            className={cn(
              'w-full',
              isCompleted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'hover:border-green-500/50 hover:text-green-400',
            )}
          >
            {isCompleted ? (
              <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Completed</>
            ) : (
              <><Circle className="h-4 w-4 mr-1.5" /> Mark complete</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
