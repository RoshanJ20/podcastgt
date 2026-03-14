/**
 * @module ProgressDashboard
 *
 * Main dashboard view that aggregates and displays a user's learning
 * progress. Computes derived statistics (streak, weekly count, domain
 * distribution, per-path progress) from raw data and delegates
 * rendering to focused sub-components: StatsSummary, LearningPathsBreakdown,
 * DomainBreakdown, and RecentActivity.
 */

'use client'

import { Separator } from '@/components/ui/separator'
import type { Domain } from '@/lib/supabase/types'
import { getStreak, getThisWeekCount } from './progress-utils'
import { StatsSummary } from './StatsSummary'
import { LearningPathsBreakdown } from './LearningPathsBreakdown'
import { DomainBreakdown } from './DomainBreakdown'
import { RecentActivity } from './RecentActivity'

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

export function ProgressDashboard({
  graphs,
  progress,
  bookmarks: _bookmarks,
  activity: _activity,
}: Props) {
  const totalBulletinsCompleted = progress.length
  const streak = getStreak(progress)
  const thisWeekCount = getThisWeekCount(progress)

  const progressByGraph = progress.reduce<Record<string, Set<string>>>(
    (accumulator, entry) => {
      if (!accumulator[entry.graph_id]) {
        accumulator[entry.graph_id] = new Set()
      }
      accumulator[entry.graph_id].add(entry.node_id)
      return accumulator
    },
    {},
  )

  const fullyCompletedPaths = graphs.filter((graph) => {
    const completedCount = progressByGraph[graph.id]?.size ?? 0
    return graph.nodeCount > 0 && completedCount >= graph.nodeCount
  }).length

  const domainProgress = progress.reduce<Record<string, number>>(
    (accumulator, entry) => {
      const domain = entry.graph?.domain
      if (domain) {
        accumulator[domain] = (accumulator[domain] ?? 0) + 1
      }
      return accumulator
    },
    {},
  )

  const recentCompletions = progress.slice(0, 10)

  return (
    <div className="space-y-8">
      <StatsSummary
        totalBulletinsCompleted={totalBulletinsCompleted}
        fullyCompletedPaths={fullyCompletedPaths}
        streak={streak}
        thisWeekCount={thisWeekCount}
      />

      <LearningPathsBreakdown
        graphs={graphs}
        progressByGraph={progressByGraph}
      />

      <DomainBreakdown domainProgress={domainProgress} />

      <Separator />

      <RecentActivity recentCompletions={recentCompletions} />
    </div>
  )
}
