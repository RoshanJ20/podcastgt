import { createClient } from '@/lib/supabase/server'
import { PodcastCard } from '@/components/library/PodcastCard'
import { LearningPathCard } from '@/components/learning-path/LearningPathCard'
import { DomainFilter } from '@/components/library/DomainFilter'
import { Suspense } from 'react'
import { Headphones, GitBranch } from 'lucide-react'
import type { Podcast, LearningGraph, Domain } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

async function LibraryContent({ domain }: { domain?: string }) {
  const supabase = await createClient()

  let podcastQuery = supabase
    .from('podcasts')
    .select('*, transcript:transcripts(id)')
    .eq('content_type', 'technical')
    .order('sort_order', { ascending: true })

  let graphQuery = supabase
    .from('learning_graphs')
    .select('*, node_count:learning_graph_nodes(count)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (domain) {
    podcastQuery = podcastQuery.eq('domain', domain as Domain)
    graphQuery = graphQuery.eq('domain', domain as Domain)
  }

  const [{ data: podcasts }, { data: graphs }] = await Promise.all([
    podcastQuery,
    graphQuery,
  ])

  const enrichedGraphs = (graphs ?? []).map((g) => ({
    ...g,
    node_count: (g.node_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  return (
    <div className="space-y-12">
      {/* Technical Content */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#8B5CF6]/15">
              <Headphones className="h-5 w-5 text-[#8B5CF6]" />
            </div>
            <h2 className="text-xl font-semibold font-[family-name:var(--font-heading)]">Technical Content</h2>
          </div>
          <span className="text-sm text-muted-foreground">{podcasts?.length ?? 0} bulletins</span>
        </div>
        {podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {podcasts.map((p) => (
              <PodcastCard key={p.id} podcast={p as Podcast} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center glass-card rounded-lg">
            No technical content yet{domain ? ` for ${domain}` : ''}.
          </p>
        )}
      </section>

      {/* Learning Paths */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#3B82F6]/15">
              <GitBranch className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <h2 className="text-xl font-semibold font-[family-name:var(--font-heading)]">Learning Paths</h2>
          </div>
          <span className="text-sm text-muted-foreground">{enrichedGraphs.length} paths</span>
        </div>
        {enrichedGraphs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {enrichedGraphs.map((g) => (
              <LearningPathCard key={g.id} graph={g} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center glass-card rounded-lg">
            No learning paths yet{domain ? ` for ${domain}` : ''}.
          </p>
        )}
      </section>
    </div>
  )
}

export default async function LibraryPage({ searchParams }: PageProps) {
  const { domain } = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-10 mb-2">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#8B5CF6]/20 via-[#6366F1]/10 to-[#3B82F6]/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#8B5CF6_0%,transparent_50%)] opacity-10" />
        <h1 className="text-4xl font-bold gradient-text font-[family-name:var(--font-heading)]">Library</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Browse audio insights from National Audit Office experts.
        </p>
      </div>

      <Suspense>
        <DomainFilter />
      </Suspense>

      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <LibraryContent domain={domain} />
      </Suspense>
    </div>
  )
}
