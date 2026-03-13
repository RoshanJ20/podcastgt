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
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text inline-block">Upload Bulletin</h1>
        <p className="text-muted-foreground mt-1">
          Add a new audio bulletin to the library.
        </p>
      </div>
      <UploadForm playlists={playlists ?? []} />
    </div>
  )
}
