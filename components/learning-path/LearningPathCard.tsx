/**
 * @module LearningPathCard
 *
 * Card component for displaying a learning path summary in the public library grid.
 * Optionally shows a circular progress indicator when completedCount is provided.
 */
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { GitBranch, List } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { LearningGraph } from '@/lib/supabase/types'

function ProgressCircle({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/30"
        />
        <circle
          cx="20" cy="20" r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-[8px] font-bold text-foreground">{pct}%</span>
    </div>
  )
}

export function LearningPathCard({
  graph,
  completedCount,
}: {
  graph: LearningGraph
  completedCount?: number
}) {
  const episodeCount = graph.episode_count ?? 0
  const showProgress = completedCount !== undefined && completedCount > 0 && episodeCount > 0

  return (
    <Link href={`/learning-path/${graph.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 cursor-pointer h-full glass-card ring-0 hover:border-[#38BDF8]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#38BDF8]/10 pt-0 gap-0">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {graph.thumbnail_url ? (
            <img
              src={graph.thumbnail_url}
              alt={graph.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#38BDF8]/30 to-[#60A5FA]/20">
              <GitBranch className="h-12 w-12 text-white/30" />
            </div>
          )}
          {episodeCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[#60A5FA] to-[#38BDF8] text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-lg">
              {episodeCount} episodes
            </div>
          )}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[graph.domain]}`}>
              {graph.domain}
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-black/50 text-white/80 backdrop-blur-sm flex items-center gap-0.5">
              {graph.path_type === 'linear' ? <List className="h-2.5 w-2.5" /> : <GitBranch className="h-2.5 w-2.5" />}
              {graph.path_type === 'linear' ? 'Linear' : 'Graph'}
            </span>
          </div>
        </div>
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm line-clamp-2 leading-snug flex-1 min-w-0">{graph.title}</h3>
            {showProgress && (
              <div className="shrink-0">
                <ProgressCircle completed={completedCount} total={episodeCount} />
              </div>
            )}
          </div>
          {graph.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{graph.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
