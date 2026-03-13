import { createClient } from '@/lib/supabase/server'
import { PodcastTable } from '@/components/admin/PodcastTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Podcast } from '@/lib/supabase/types'

export default async function ManagePage() {
  const supabase = await createClient()
  const { data: podcasts } = await supabase
    .from('podcasts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Podcasts</h1>
          <p className="text-muted-foreground">Drag rows to reorder. Click edit or delete to manage.</p>
        </div>
        <Button asChild>
          <Link href="/admin/upload">
            <Plus className="h-4 w-4 mr-2" />
            Upload New
          </Link>
        </Button>
      </div>

      <PodcastTable initialPodcasts={(podcasts as Podcast[]) ?? []} />
    </div>
  )
}
