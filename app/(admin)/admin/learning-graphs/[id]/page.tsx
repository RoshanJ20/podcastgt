/**
 * @module EditGraphPage
 *
 * Admin page for editing a specific learning path graph or linear path.
 *
 * Key responsibilities:
 * - Fetches the graph with its nodes, edges, and associated podcast data
 * - Returns a 404 if the graph does not exist
 * - Renders either LinearPathEditor or GraphEditor based on path_type
 */
import { createClient } from '@/lib/supabase/server'
import { GraphEditor } from '@/components/admin/GraphEditor'
import { LinearPathEditor } from '@/components/admin/LinearPathEditor'
import { notFound } from 'next/navigation'
import type { LearningGraph, Podcast } from '@/lib/supabase/types'

export default async function EditGraphPage({
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
      nodes:learning_graph_nodes(*, podcast:podcasts(id, title, thumbnail_url, domain, description, audio_short_url, audio_long_url, bulletin_url)),
      edges:learning_graph_edges(*)
    `)
    .eq('id', id)
    .single()

  if (!graph) notFound()

  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('id, title, thumbnail_url, domain')
    .order('title')

  const typedGraph = graph as LearningGraph
  const typedPodcasts = (podcasts ?? []) as Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain'>[]

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {typedGraph.path_type === 'linear' ? (
        <LinearPathEditor graph={typedGraph} initialPodcasts={typedPodcasts} />
      ) : (
        <GraphEditor graph={typedGraph} podcasts={typedPodcasts} />
      )}
    </div>
  )
}
