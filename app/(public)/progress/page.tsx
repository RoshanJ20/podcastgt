import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProgressDashboard } from '@/components/progress/ProgressDashboard'

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
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*, graph:learning_graphs(id, title, domain), node:learning_graph_nodes(id, label, podcast:podcasts(id, title, thumbnail_url))')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  // Fetch bookmarks
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('id, created_at, podcast:podcasts(id, title, domain)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch recent activity
  const since = new Date()
  since.setDate(since.getDate() - 90)
  const { data: activity } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  // Enrich graphs with node counts
  const enrichedGraphs = (allGraphs ?? []).map((g) => ({
    id: g.id,
    title: g.title,
    domain: g.domain,
    nodeCount: (g.node_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text">Progress & Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning journey across all paths and bulletins.</p>
      </div>
      <ProgressDashboard
        graphs={enrichedGraphs}
        progress={(progress ?? []) as any}
        bookmarks={(bookmarks ?? []) as any}
        activity={(activity ?? []) as any}
      />
    </div>
  )
}
