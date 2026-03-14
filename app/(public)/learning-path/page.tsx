/**
 * @module LearningPathsPage
 *
 * Public page listing all published learning paths with per-user progress circles.
 */
import { createClient } from '@/lib/supabase/server'
import { LearningPathCard } from '@/components/learning-path/LearningPathCard'
import { DomainFilter } from '@/components/library/DomainFilter'
import { LEARNING_SERIES_DOMAINS } from '@/lib/supabase/types'
import type { LearningGraph, Domain } from '@/lib/supabase/types'
import { Suspense } from 'react'

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

export default async function LearningPathsPage({ searchParams }: PageProps) {
  const { domain } = await searchParams
  const supabase = await createClient()

  let graphQuery = supabase
    .from('learning_graphs')
    .select('*, episode_count:episodes(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (domain) {
    graphQuery = graphQuery.eq('domain', domain as Domain)
  }

  const [{ data: graphs }, { data: { user } }] = await Promise.all([
    graphQuery,
    supabase.auth.getUser(),
  ])

  const enriched = (graphs ?? []).map((graph) => ({
    ...graph,
    episode_count: (graph.episode_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  // Fetch per-graph completion counts for logged-in user
  let progressMap: Record<string, number> = {}
  if (user) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('graph_id')
      .eq('user_id', user.id)

    if (progress) {
      for (const entry of progress) {
        const gid = entry.graph_id as string
        progressMap[gid] = (progressMap[gid] ?? 0) + 1
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          Visual guides showing how episodes connect and build on each other.
        </p>
      </div>

      <Suspense>
        <DomainFilter domains={LEARNING_SERIES_DOMAINS} />
      </Suspense>

      {enriched.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No learning paths available yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {enriched.map((graph) => (
            <LearningPathCard
              key={graph.id}
              graph={graph}
              completedCount={progressMap[graph.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
