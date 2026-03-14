/**
 * @module LearningPathsBreakdown
 *
 * Shows per-path progress with a visual progress bar for each learning
 * path the user has access to. Displays the path title, domain badge,
 * completion badge (when 100%), node count fraction, and percentage.
 * Links each path title to its detail page.
 */

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitBranch, Trophy } from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'

interface GraphInfo {
  id: string
  title: string
  domain: Domain
  nodeCount: number
}

interface LearningPathsBreakdownProps {
  graphs: GraphInfo[]
  progressByGraph: Record<string, Set<string>>
}

export function LearningPathsBreakdown({
  graphs,
  progressByGraph,
}: LearningPathsBreakdownProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-5 w-5 text-[#38BDF8]" />
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
          Learning Paths
        </h2>
      </div>
      <div className="space-y-3">
        {graphs.map((graph) => {
          const completedNodes = progressByGraph[graph.id]?.size ?? 0
          const percent =
            graph.nodeCount > 0
              ? Math.round((completedNodes / graph.nodeCount) * 100)
              : 0
          const isComplete = percent === 100

          return (
            <Card
              key={graph.id}
              className="glass-card hover:border-primary/20 transition-colors"
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/learning-path/${graph.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {graph.title}
                      </Link>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${DOMAIN_COLORS[graph.domain]}`}
                      >
                        {graph.domain}
                      </span>
                      {isComplete && (
                        <Badge className="bg-green-600 text-white text-[10px] shrink-0">
                          <Trophy className="h-3 w-3 mr-0.5" />
                          Complete
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-[#60A5FA] to-[#38BDF8]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground shrink-0 w-16 text-right">
                        {completedNodes}/{graph.nodeCount}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-primary shrink-0">
                    {percent}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {graphs.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No published learning paths yet.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
