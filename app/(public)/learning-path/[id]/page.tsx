/**
 * @module LearningPathDetailPage
 *
 * Public page for viewing and interacting with a specific learning path.
 *
 * Key responsibilities:
 * - Fetches the published learning graph with nodes, edges, and podcast data
 * - Returns a 404 if the graph does not exist or is unpublished
 * - Renders the LearningPathViewer with authentication status for progress tracking
 */
import { createClient } from '@/lib/supabase/server'
import { LearningPathViewer } from '@/components/learning-path/LearningPathViewer'
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import type { LearningGraph } from '@/lib/supabase/types'

export default async function LearningPathDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: graph } = await supabase
    .from('learning_graphs')
    .select(`
      *,
      nodes:learning_graph_nodes(*, podcast:podcasts(id, title, thumbnail_url, domain, description, audio_short_url, audio_long_url, bulletin_urls)),
      edges:learning_graph_edges(*)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!graph) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const typedGraph = graph as LearningGraph

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{typedGraph.title}</h1>
          <Badge variant="outline">{typedGraph.domain}</Badge>
        </div>
        {typedGraph.description && (
          <p className="text-muted-foreground mt-1">{typedGraph.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Click any bulletin to start listening. {(typedGraph.nodes?.length ?? 0)} bulletins in this path.
        </p>
      </div>

      <LearningPathViewer graph={typedGraph} isLoggedIn={!!user} />
    </div>
  )
}
