/**
 * @module RecentActivity
 *
 * Displays the user's most recent bulletin completions as a vertical
 * timeline of cards. Each entry shows the podcast thumbnail, title,
 * parent learning path link, and a relative timestamp. Shows an
 * empty-state prompt when no completions exist.
 */

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock } from 'lucide-react'
import { getRelativeDate } from './progress-utils'
import type { Domain } from '@/lib/supabase/types'

interface ProgressEntry {
  id: string
  graph_id: string
  node_id: string
  completed_at: string
  graph?: { id: string; title: string; domain: Domain }
  node?: {
    id: string
    label: string | null
    podcast?: {
      id: string
      title: string
      thumbnail_url: string | null
    }
  }
}

interface RecentActivityProps {
  recentCompletions: ProgressEntry[]
}

export function RecentActivity({ recentCompletions }: RecentActivityProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-[#818CF8]" />
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
          Recent Activity
        </h2>
      </div>
      {recentCompletions.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>
              No completions yet. Start a learning path to see activity
              here.
            </p>
            <Link
              href="/learning-path"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Browse learning paths
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recentCompletions.map((entry) => {
            const relativeDate = getRelativeDate(entry.completed_at)
            return (
              <Card key={entry.id} className="glass-card">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-green-500/15 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    {entry.node?.podcast?.thumbnail_url ? (
                      <img
                        src={entry.node.podcast.thumbnail_url}
                        alt=""
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {entry.node?.podcast?.title ??
                          entry.node?.label ??
                          'Completed bulletin'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        in{' '}
                        <Link
                          href={`/learning-path/${entry.graph_id}`}
                          className="text-primary hover:underline"
                        >
                          {entry.graph?.title ?? 'Unknown path'}
                        </Link>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {relativeDate}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
