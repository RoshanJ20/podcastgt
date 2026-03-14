/**
 * @module LearningPathsPage
 *
 * Public page listing all published learning paths.
 *
 * Key responsibilities:
 * - Fetches published learning graphs with aggregated node counts
 * - Enriches graph data by extracting node counts from joined relations
 * - Renders a responsive grid of LearningPathCard components
 */
import { createClient } from '@/lib/supabase/server'
import { LearningPathCard } from '@/components/learning-path/LearningPathCard'
import type { LearningGraph } from '@/lib/supabase/types'

export default async function LearningPathsPage() {
  const supabase = await createClient()

  const { data: graphs } = await supabase
    .from('learning_graphs')
    .select('*, node_count:learning_graph_nodes(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const enriched = (graphs ?? []).map((graph) => ({
    ...graph,
    node_count: (graph.node_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          Visual guides showing how bulletins connect and build on each other.
        </p>
      </div>

      {enriched.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No learning paths available yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {enriched.map((graph) => (
            <LearningPathCard key={graph.id} graph={graph} />
          ))}
        </div>
      )}
    </div>
  )
}
