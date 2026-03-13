'use client'

import { useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { TranscriptSegment } from '@/lib/supabase/types'

interface TranscriptViewerProps {
  segments: TranscriptSegment[]
  fullText?: string | null
  currentTime: number
  onSeek: (time: number) => void
}

export function TranscriptViewer({ segments, fullText, currentTime, onSeek }: TranscriptViewerProps) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Find the active segment index
  const activeIndex = segments.findIndex(
    (seg, i) =>
      currentTime >= seg.start &&
      (i === segments.length - 1 || currentTime < segments[i + 1].start)
  )

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeIndex])

  if (segments.length === 0 && !fullText) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No transcript available.
      </div>
    )
  }

  if (segments.length === 0 && fullText) {
    return (
      <ScrollArea className="h-64">
        <p className="text-sm leading-relaxed whitespace-pre-wrap px-1">{fullText}</p>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-64" ref={containerRef}>
      <div className="space-y-1 px-1">
        {segments.map((seg, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={i}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSeek(seg.start)}
              className={cn(
                'w-full text-left text-sm leading-relaxed px-2 py-1 rounded transition-colors',
                isActive
                  ? 'bg-[#60A5FA]/10 text-[#93C5FD] font-medium border-l-2 border-[#60A5FA]'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-2 border-transparent'
              )}
            >
              <span className="text-xs font-mono mr-2 opacity-60">{formatTime(seg.start)}</span>
              {seg.text}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
