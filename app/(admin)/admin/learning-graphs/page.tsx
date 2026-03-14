/**
 * @module LearningGraphsPage
 *
 * Admin page listing all learning paths with their episode counts.
 *
 * Key responsibilities:
 * - Fetches all learning graphs with aggregated episode counts
 * - Enriches graph data by extracting episode counts from the joined relation
 * - Renders the LearningGraphManager for creating and managing graphs
 */
import { createClient } from '@/lib/supabase/server'
import { LearningGraphManager } from '@/components/admin/LearningGraphManager'
import type { LearningGraph } from '@/lib/supabase/types'

export default async function LearningGraphsPage() {
  const supabase = await createClient()
  const { data: graphs } = await supabase
    .from('learning_graphs')
    .select('*, episode_count:episodes(count)')
    .order('created_at', { ascending: false })

  const enriched = (graphs ?? []).map((graph) => ({
    ...graph,
    episode_count: (graph.episode_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          Create learning paths with episodes. Add episodes and connect them with edges.
        </p>
      </div>
      <LearningGraphManager graphs={enriched} />
    </div>
  )
}
