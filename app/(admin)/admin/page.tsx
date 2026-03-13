import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones, ListMusic, Mic, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: podcastCount }, { count: playlistCount }] = await Promise.all([
    supabase.from('podcasts').select('*', { count: 'exact', head: true }),
    supabase.from('playlists').select('*', { count: 'exact', head: true }),
  ])

  const { data: recentPodcasts } = await supabase
    .from('podcasts')
    .select('id, title, domain, content_type, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Podcasts', value: podcastCount ?? 0, icon: Headphones },
    { label: 'Learning Playlists', value: playlistCount ?? 0, icon: ListMusic },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Manage your podcast content</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/admin/upload">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mic className="h-5 w-5 text-primary" />
                Upload New Podcast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add a new audio podcast with title, description, domain, and files.
              </p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <Link href="/admin/playlists">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Create Learning Series
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build a playlist of episodes for structured learning.
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>

      {recentPodcasts && recentPodcasts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Uploads</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/manage">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPodcasts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-muted-foreground text-xs">{p.domain} · {p.content_type.replace('_', ' ')}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
