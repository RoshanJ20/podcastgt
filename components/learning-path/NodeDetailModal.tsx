'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AudioPlayer } from '@/components/audio-player/AudioPlayer'
import { ExternalLink, FileText, CheckCircle2, Circle } from 'lucide-react'
import Link from 'next/link'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'

interface NodeDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  podcast: {
    id: string
    title: string
    description: string | null
    domain: string
    thumbnailUrl: string | null
    audioShortUrl: string | null
    audioLongUrl: string | null
    bulletinUrl: string | null
  }
  nodeId?: string
  isCompleted?: boolean
  isLoggedIn?: boolean
  onToggleComplete?: (nodeId: string) => void
}

export function NodeDetailModal({ open, onOpenChange, podcast, nodeId, isCompleted, isLoggedIn, onToggleComplete }: NodeDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {podcast.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {podcast.thumbnailUrl && (
            <img
              src={podcast.thumbnailUrl}
              alt={podcast.title}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}

          <div className="flex items-center gap-2">
            <Badge className={DOMAIN_COLORS[podcast.domain as Domain]}>
              {podcast.domain}
            </Badge>
          </div>

          {podcast.description && (
            <p className="text-sm text-muted-foreground">{podcast.description}</p>
          )}

          {/* Audio Player */}
          {(podcast.audioShortUrl || podcast.audioLongUrl) && (
            <div className="border rounded-lg p-3">
              <AudioPlayer
                shortUrl={podcast.audioShortUrl}
                longUrl={podcast.audioLongUrl}
              />
            </div>
          )}

          {/* PDF Link */}
          {podcast.bulletinUrl && (
            <a
              href={podcast.bulletinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              View Bulletin PDF
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <div className="flex items-center justify-between pt-2">
            {isLoggedIn && nodeId && onToggleComplete ? (
              <Button
                variant={isCompleted ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToggleComplete(nodeId)}
                className={isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
              >
                {isCompleted ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Completed</>
                ) : (
                  <><Circle className="h-4 w-4 mr-1.5" /> Mark complete</>
                )}
              </Button>
            ) : (
              <div />
            )}
            <Button variant="outline" asChild>
              <Link href={`/podcast/${podcast.id}`}>
                View Full Page
                <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
