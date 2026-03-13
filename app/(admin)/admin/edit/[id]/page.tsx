import { createClient } from '@/lib/supabase/server'
import { UploadForm } from '@/components/admin/UploadForm'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPodcastPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: podcast }, { data: playlists }] = await Promise.all([
    supabase.from('podcasts').select('*').eq('id', id).single(),
    supabase.from('playlists').select('id, title').order('title'),
  ])

  if (!podcast) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text inline-block">Edit Podcast</h1>
        <p className="text-muted-foreground mt-1">Update podcast metadata and files.</p>
      </div>
      <UploadForm
        playlists={playlists ?? []}
        editPodcast={{
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          domain: podcast.domain,
          year: podcast.year,
          content_type: podcast.content_type,
          playlist_id: podcast.playlist_id,
          tags: podcast.tags ?? [],
        }}
      />
    </div>
  )
}
