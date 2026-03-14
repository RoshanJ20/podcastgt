import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressDashboard } from '@/components/progress/ProgressDashboard'
import type { Domain } from '@/lib/supabase/types'

// Supabase returns joined relations as arrays; these helpers unwrap them
function unwrapOne<T>(val: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(val)) return val[0] ?? undefined
  return val ?? undefined
}

export default async function ProgressPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/progress')
  }

  // Fetch all learning graphs with node counts
  const { data: allGraphs } = await supabase
    .from('learning_graphs')
    .select('id, title, domain, is_published, node_count:learning_graph_nodes(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  // Fetch user progress across all graphs
  const { data: rawProgress } = await supabase
    .from('user_progress')
    .select('*, graph:learning_graphs(id, title, domain), node:learning_graph_nodes(id, label, podcast:podcasts(id, title, thumbnail_url))')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  // Fetch bookmarks
  const { data: rawBookmarks } = await supabase
    .from('bookmarks')
    .select('id, created_at, podcast:podcasts(id, title, domain)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recent activity
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data: rawActivity } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  // Enrich graphs with node counts
  const enrichedGraphs = (allGraphs ?? []).map((g) => ({
    id: g.id as string,
    title: g.title as string,
    domain: g.domain as Domain,
    nodeCount: (g.node_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  // Transform progress: unwrap Supabase joined arrays into single objects
  const progress = (rawProgress ?? []).map((p) => {
    const graph = unwrapOne(p.graph)
    const rawNode = unwrapOne(p.node)
    const node = rawNode
      ? { ...rawNode, podcast: unwrapOne((rawNode as Record<string, unknown>).podcast as unknown[]) as { id: string; title: string; thumbnail_url: string | null } | undefined }
      : undefined
    return {
      id: p.id as string,
      graph_id: p.graph_id as string,
      node_id: p.node_id as string,
      completed_at: p.completed_at as string,
      graph: graph ? { id: graph.id as string, title: graph.title as string, domain: graph.domain as Domain } : undefined,
      node: node ? { id: node.id as string, label: node.label as string | null, podcast: node.podcast } : undefined,
    }
  })

  // Transform bookmarks: unwrap podcast join
  const bookmarks = (rawBookmarks ?? []).map((b) => {
    const podcast = unwrapOne(b.podcast)
    return {
      id: b.id as string,
      created_at: b.created_at as string,
      podcast: podcast ? { id: podcast.id as string, title: podcast.title as string, domain: podcast.domain as Domain } : undefined,
    }
  })

  // Transform activity
  const activity = (rawActivity ?? []).map((a) => ({
    id: a.id as string,
    activity_type: a.activity_type as string,
    podcast_id: a.podcast_id as string | null,
    graph_id: a.graph_id as string | null,
    created_at: a.created_at as string,
    metadata: (a.metadata ?? {}) as Record<string, unknown>,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text">Progress & Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey across all paths and bulletins.</p>
      </div>
      <ProgressDashboard
        graphs={enrichedGraphs}
        progress={progress}
        bookmarks={bookmarks}
        activity={activity}
      />
    </div>
  )
}
