import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PodcastPageWrapper } from '@/components/audio-player/PodcastPageWrapper'
import type { Podcast } from '@/lib/supabase/types'

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: podcast } = await supabase
    .from('podcasts')
    .select('*, transcript:transcripts(id, full_text, segments)')
    .eq('id', id)
    .single()

  if (!podcast) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <PodcastPageWrapper podcast={podcast as Podcast} isLoggedIn={!!user} />
    </div>
  )
}
