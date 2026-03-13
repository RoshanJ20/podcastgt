import { createClient } from '@/lib/supabase/server'
import { UploadForm } from '@/components/admin/UploadForm'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: playlists } = await supabase
    .from('playlists')
    .select('id, title')
    .order('title')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Podcast</h1>
        <p className="text-muted-foreground">
          Add a new audio podcast to the library.
        </p>
      </div>
      <UploadForm playlists={playlists ?? []} />
    </div>
  )
}
