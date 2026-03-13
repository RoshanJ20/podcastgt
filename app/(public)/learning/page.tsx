import { createClient } from '@/lib/supabase/server'
import { PlaylistCard } from '@/components/library/PlaylistCard'
import { DomainFilter } from '@/components/library/DomainFilter'
import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import type { Playlist, Domain } from '@/lib/supabase/types'

interface PageProps {
  searchParams: Promise<{ domain?: string }>
}

async function LearningContent({ domain }: { domain?: string }) {
  const supabase = await createClient()

  let playlistQuery = supabase
    .from('playlists')
    .select('*, episode_count:podcasts(count)')
    .order('sort_order', { ascending: true })

  if (domain) {
    playlistQuery = playlistQuery.eq('domain', domain as Domain)
  }

  const { data: playlists } = await playlistQuery

  const enrichedPlaylists = (playlists ?? []).map((p) => ({
    ...p,
    episode_count: (p.episode_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as Playlist[]

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#38BDF8]/15">
            <BookOpen className="h-5 w-5 text-[#38BDF8]" />
          </div>
          <h2 className="text-xl font-semibold font-[family-name:var(--font-heading)]">Learning Series</h2>
        </div>
        <span className="text-sm text-muted-foreground">{enrichedPlaylists.length} playlists</span>
      </div>
      {enrichedPlaylists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {enrichedPlaylists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm py-8 text-center glass-card rounded-lg">
          No learning series yet{domain ? ` for ${domain}` : ''}.
        </p>
      )}
    </section>
  )
}

export default async function LearningPage({ searchParams }: PageProps) {
  const { domain } = await searchParams

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden px-8 py-10 mb-2">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#38BDF8]/20 via-[#818CF8]/10 to-[#60A5FA]/20" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,#38BDF8_0%,transparent_50%)] opacity-10" />
        <h1 className="text-4xl font-bold gradient-text font-[family-name:var(--font-heading)]">Learning Paths</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Structured learning series for professional development.
        </p>
      </div>

      <Suspense>
        <DomainFilter />
      </Suspense>

      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <LearningContent domain={domain} />
      </Suspense>
    </div>
  )
}
