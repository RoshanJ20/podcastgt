/**
 * @module HomePage
 *
 * Public landing page for Podcast Hub. Shows platform description,
 * recently added content, and quick-access category cards.
 */
import { createClient } from '@/lib/supabase/server'
import { PodcastCard } from '@/components/library/PodcastCard'
import { LearningPathCard } from '@/components/learning-path/LearningPathCard'
import { Suspense } from 'react'
import { Headphones, BookOpen, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Podcast, LearningGraph } from '@/lib/supabase/types'

async function RecentlyAdded() {
  const supabase = await createClient()

  const [{ data: recentPodcasts }, { data: recentGraphs }] = await Promise.all([
    supabase
      .from('podcasts')
      .select('*, transcript:transcripts(id)')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('learning_graphs')
      .select('*, episode_count:episodes(count)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const podcasts = (recentPodcasts ?? []) as Podcast[]
  const graphs = (recentGraphs ?? []).map((graph) => ({
    ...graph,
    episode_count: (graph.episode_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as LearningGraph[]

  if (podcasts.length === 0 && graphs.length === 0) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#818CF8]/15">
          <Sparkles className="h-5 w-5 text-[#818CF8]" />
        </div>
        <h2 className="text-xl font-semibold font-[family-name:var(--font-heading)]">Recently Added</h2>
      </div>

      {podcasts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Technical Releases</h3>
            <Link href="/bulletins" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {podcasts.map((podcast) => (
              <PodcastCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        </div>
      )}

      {graphs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Learning Paths</h3>
            <Link href="/learning-path" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {graphs.map((graph) => (
              <LearningPathCard key={graph.id} graph={graph} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

async function CategoryCards() {
  const supabase = await createClient()

  const [{ count: bulletinCount }, { count: pathCount }] = await Promise.all([
    supabase.from('podcasts').select('*', { count: 'exact', head: true }),
    supabase.from('learning_graphs').select('*', { count: 'exact', head: true }).eq('is_published', true),
  ])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link href="/bulletins" className="group">
        <div className="glass-card rounded-xl p-6 h-full transition-all duration-300 hover:border-[#60A5FA]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#60A5FA]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-[#60A5FA]/15">
              <Headphones className="h-6 w-6 text-[#60A5FA]" />
            </div>
            <div>
              <h3 className="font-semibold font-[family-name:var(--font-heading)]">Technical Releases</h3>
              <p className="text-xs text-muted-foreground">{bulletinCount ?? 0} releases</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Audio summaries of technical releases covering audit methodology, accounting standards, and more.
          </p>
          <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary group-hover:gap-2 transition-all">
            Browse releases <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </Link>

      <Link href="/learning-path" className="group">
        <div className="glass-card rounded-xl p-6 h-full transition-all duration-300 hover:border-[#38BDF8]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#38BDF8]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-[#38BDF8]/15">
              <BookOpen className="h-6 w-6 text-[#38BDF8]" />
            </div>
            <div>
              <h3 className="font-semibold font-[family-name:var(--font-heading)]">Learning Series</h3>
              <p className="text-xs text-muted-foreground">{pathCount ?? 0} paths</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Curated learning paths on everyday auditing and accounting topics, organized as structured episodes.
          </p>
          <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary group-hover:gap-2 transition-all">
            Explore paths <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-12 mb-2">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#60A5FA]/20 via-[#818CF8]/10 to-[#38BDF8]/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#60A5FA_0%,transparent_50%)] opacity-10" />
        <h1 className="text-4xl font-bold gradient-text font-[family-name:var(--font-heading)]">Podcast Hub</h1>
        <p className="text-muted-foreground mt-3 text-lg max-w-2xl leading-relaxed">
          A centralized repository of audio summaries of technical releases by National Audit Office
          and a curated learning series of everyday auditing and accounting topics.
        </p>
      </div>

      {/* Category cards */}
      <Suspense>
        <CategoryCards />
      </Suspense>

      {/* Recently added */}
      <Suspense>
        <RecentlyAdded />
      </Suspense>
    </div>
  )
}
