import { createClient } from '@/lib/supabase/server'
import { PodcastCard } from '@/components/library/PodcastCard'
import { DomainFilter } from '@/components/library/DomainFilter'
import { Suspense } from 'react'
import { Headphones } from 'lucide-react'
import type { Podcast, Domain } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

async function PodcastsContent({ domain }: { domain?: string }) {
  const supabase = await createClient()

  let podcastQuery = supabase
    .from('podcasts')
    .select('*, transcript:transcripts(id)')
    .eq('content_type', 'technical')
    .order('sort_order', { ascending: true })

  if (domain) {
    podcastQuery = podcastQuery.eq('domain', domain as Domain)
  }

  const { data: podcasts } = await podcastQuery

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#60A5FA]/15">
            <Headphones className="h-5 w-5 text-[#60A5FA]" />
          </div>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-heading)]">Bulletins</h2>
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
          No bulletins yet{domain ? ` for ${domain}` : ''}.
        </p>
      )}
    </section>
  )
}

export default async function PodcastsPage({ searchParams }: PageProps) {
  const { domain } = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-10 mb-2">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#60A5FA]/20 via-[#818CF8]/10 to-[#38BDF8]/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#60A5FA_0%,transparent_50%)] opacity-10" />
        <h1 className="text-4xl font-bold gradient-text font-[family-name:var(--font-heading)]">Bulletins</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Browse audio bulletins from National Audit Office experts.
        </p>
      </div>

      <Suspense>
        <DomainFilter />
      </Suspense>

      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <PodcastsContent domain={domain} />
      </Suspense>
    </div>
  )
}
