'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  GitBranch,
  Bookmark,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Headphones,
} from 'lucide-react'
import { DOMAIN_COLORS } from '@/lib/supabase/types'
import type { Domain } from '@/lib/supabase/types'
import { ActivityHeatmap } from './ActivityHeatmap'

interface GraphInfo {
  id: string
  title: string
  domain: Domain
  nodeCount: number
}

interface ProgressEntry {
  id: string
  graph_id: string
  node_id: string
  completed_at: string
  graph?: { id: string; title: string; domain: Domain }
  node?: { id: string; label: string | null; podcast?: { id: string; title: string; thumbnail_url: string | null } }
}

interface BookmarkEntry {
  id: string
  created_at: string
  podcast?: { id: string; title: string; domain: Domain }
}

interface ActivityEntry {
  id: string
  activity_type: string
  podcast_id: string | null
  graph_id: string | null
  created_at: string
  metadata: Record<string, unknown>
}

interface Props {
  graphs: GraphInfo[]
  progress: ProgressEntry[]
  bookmarks: BookmarkEntry[]
  activity: ActivityEntry[]
}

function getStreak(progress: ProgressEntry[]): number {
  if (progress.length === 0) return 0

  const dates = [...new Set(
    progress.map((p) => new Date(p.completed_at).toDateString())
  )].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Must include today or yesterday to have an active streak
  if (dates[0] !== today && dates[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const curr = new Date(dates[i - 1])
    const prev = new Date(dates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diffDays === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getThisWeekCount(progress: ProgressEntry[]): number {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return progress.filter((p) => new Date(p.completed_at) >= startOfWeek).length
}

export function ProgressDashboard({ graphs, progress, bookmarks, activity }: Props) {
  // Stats
  const totalBulletinsCompleted = progress.length
  const uniqueGraphsStarted = new Set(progress.map((p) => p.graph_id)).size

  // Calculate fully completed paths
  const progressByGraph = progress.reduce<Record<string, Set<string>>>((acc, p) => {
    if (!acc[p.graph_id]) acc[p.graph_id] = new Set()
    acc[p.graph_id].add(p.node_id)
    return acc
  }, {})

  const fullyCompletedPaths = graphs.filter((g) => {
    const completed = progressByGraph[g.id]?.size ?? 0
    return g.nodeCount > 0 && completed >= g.nodeCount
  }).length

  const streak = getStreak(progress)
  const thisWeekCount = getThisWeekCount(progress)

  // Domain breakdown
  const domainProgress = progress.reduce<Record<string, number>>((acc, p) => {
    const domain = p.graph?.domain
    if (domain) acc[domain] = (acc[domain] ?? 0) + 1
    return acc
  }, {})

  // Merge progress + bookmarks into activity timeline for heatmap
  const allDates: string[] = [
    ...progress.map((p) => p.completed_at),
    ...bookmarks.map((b) => b.created_at),
    ...activity.map((a) => a.created_at),
  ]

  // Recent completions (last 10)
  const recentCompletions = progress.slice(0, 10)

  return (
    <div className="space-y-8">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{totalBulletinsCompleted}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Bulletins Completed</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/15">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{fullyCompletedPaths}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Paths Completed</p>
              </div>
              <div className="p-2 rounded-lg bg-[#60A5FA]/15">
                <Trophy className="h-5 w-5 text-[#60A5FA]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{streak}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-500/15">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{thisWeekCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">This Week</p>
              </div>
              <div className="p-2 rounded-lg bg-[#818CF8]/15">
                <TrendingUp className="h-5 w-5 text-[#818CF8]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity heatmap */}
      {/* <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-[#38BDF8]" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap dates={allDates} />
        </CardContent>
      </Card> */}

      {/* Learning path breakdown */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5 text-[#38BDF8]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Learning Paths</h2>
        </div>
        <div className="space-y-3">
          {graphs.map((graph) => {
            const completedNodes = progressByGraph[graph.id]?.size ?? 0
            const pct = graph.nodeCount > 0 ? Math.round((completedNodes / graph.nodeCount) * 100) : 0
            const isComplete = pct === 100

            return (
              <Card key={graph.id} className="glass-card hover:border-primary/20 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/learning-path/${graph.id}`} className="text-sm font-medium hover:underline truncate">
                          {graph.title}
                        </Link>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${DOMAIN_COLORS[graph.domain]}`}>
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
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground shrink-0 w-16 text-right">
                          {completedNodes}/{graph.nodeCount}
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary shrink-0">{pct}%</span>
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

      {/* Domain breakdown */}
      {Object.keys(domainProgress).length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[#60A5FA]" />
              Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(domainProgress)
                .sort(([, a], [, b]) => b - a)
                .map(([domain, count]) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[domain as Domain]}`}>
                      {domain}
                    </span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Recent completions */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-[#818CF8]" />
          <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Recent Activity</h2>
        </div>
        {recentCompletions.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No completions yet. Start a learning path to see activity here.</p>
              <Link href="/learning-path" className="text-primary hover:underline text-sm mt-2 inline-block">
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
                          {entry.node?.podcast?.title ?? entry.node?.label ?? 'Completed bulletin'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          in{' '}
                          <Link href={`/learning-path/${entry.graph_id}`} className="text-primary hover:underline">
                            {entry.graph?.title ?? 'Unknown path'}
                          </Link>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{relativeDate}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
