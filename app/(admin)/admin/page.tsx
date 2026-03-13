import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Headphones, GitBranch, Mic, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { PodcastTable } from '@/components/admin/PodcastTable'
import type { Podcast } from '@/lib/supabase/types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: podcastCount }, { count: learningPathCount }, { data: podcasts }] = await Promise.all([
    supabase.from('podcasts').select('*', { count: 'exact', head: true }),
    supabase.from('learning_graphs').select('*', { count: 'exact', head: true }),
    supabase.from('podcasts').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
  ])

  const stats = [
    { label: 'Total Bulletins', value: podcastCount ?? 0, icon: Headphones, color: '#8B5CF6' },
    { label: 'Learning Paths', value: learningPathCount ?? 0, icon: GitBranch, color: '#3B82F6' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] gradient-text inline-block">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your podcast content</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="glass-card hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold font-[family-name:var(--font-heading)]">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Link href="/admin/upload">
          <Card className="glass-card hover-lift cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-[family-name:var(--font-heading)]">
                <div className="p-2 rounded-lg bg-[#8B5CF6]/15 group-hover:bg-[#8B5CF6]/25 transition-colors">
                  <Mic className="h-5 w-5 text-[#8B5CF6]" />
                </div>
                Upload New Bulletin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add a new audio bulletin with title, description, domain, and files.
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/learning-graphs">
          <Card className="glass-card hover-lift cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-[family-name:var(--font-heading)]">
                <div className="p-2 rounded-lg bg-[#3B82F6]/15 group-hover:bg-[#3B82F6]/25 transition-colors">
                  <BookOpen className="h-5 w-5 text-[#3B82F6]" />
                </div>
                Create Learning Path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Build a structured learning path — linear or visual graph.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* All Podcasts table */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">All Bulletins</h2>
        <p className="text-sm text-muted-foreground -mt-1">Drag rows to reorder. Click edit or delete to manage.</p>
        <PodcastTable initialPodcasts={(podcasts as Podcast[]) ?? []} />
      </div>
    </div>
  )
}
