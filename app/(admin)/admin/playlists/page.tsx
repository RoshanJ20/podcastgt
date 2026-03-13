import { createClient } from '@/lib/supabase/server'
import { PlaylistManager } from '@/components/admin/PlaylistManager'
import type { Playlist } from '@/lib/supabase/types'

export default async function PlaylistsPage() {
  const supabase = await createClient()
  const { data: playlists } = await supabase
    .from('playlists')
    .select('*, episode_count:podcasts(count)')
    .order('created_at', { ascending: false })

  // Flatten the nested count
  const enriched = (playlists ?? []).map((p) => ({
    ...p,
    episode_count: (p.episode_count as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as Playlist[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Learning Series Playlists</h1>
        <p className="text-muted-foreground">
          Create and manage playlists. Assign episodes during upload.
        </p>
      </div>
      <PlaylistManager playlists={enriched} />
    </div>
  )
}
