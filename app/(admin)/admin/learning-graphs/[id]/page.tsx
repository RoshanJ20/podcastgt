/**
 * @module EditGraphPage
 *
 * Admin page for editing a specific learning path graph or linear path.
 *
 * Key responsibilities:
 * - Fetches the graph with its episodes and edges
 * - Returns a 404 if the graph does not exist
 * - Renders either LinearPathEditor or GraphEditor based on path_type
 */
import { createClient } from '@/lib/supabase/server'
import { GraphEditor } from '@/components/admin/GraphEditor'
import { LinearPathEditor } from '@/components/admin/LinearPathEditor'
import { notFound } from 'next/navigation'
import type { LearningGraph } from '@/lib/supabase/types'

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
      episodes:episodes(*),
      edges:learning_path_edges(*)
    `)
    .eq('id', id)
    .single()

  if (!graph) notFound()

  const typedGraph = graph as LearningGraph

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {typedGraph.path_type === 'linear' ? (
        <LinearPathEditor graph={typedGraph} />
      ) : (
        <GraphEditor graph={typedGraph} />
      )}
    </div>
  )
}
