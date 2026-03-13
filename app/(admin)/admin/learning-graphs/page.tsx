import { createClient } from '@/lib/supabase/server'
import { LearningGraphManager } from '@/components/admin/LearningGraphManager'
import type { LearningGraph } from '@/lib/supabase/types'

export default async function LearningGraphsPage() {
  const supabase = await createClient()
  const { data: graphs } = await supabase
    .from('learning_graphs')
    .select('*, node_count:learning_graph_nodes(count)')
    .order('created_at', { ascending: false })

  const enriched = (graphs ?? []).map((g) => ({
    ...g,
    node_count: (g.node_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Paths</h1>
        <p className="text-muted-foreground">
          Create visual learning path graphs. Add bulletins as nodes and connect them with edges.
        </p>
      </div>
      <LearningGraphManager graphs={enriched} />
    </div>
  )
}
