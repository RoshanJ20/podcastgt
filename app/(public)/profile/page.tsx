/**
 * @module ProfilePage
 *
 * Authenticated user profile page showing bookmarks and learning progress.
 *
 * Key responsibilities:
 * - Authenticates the user and redirects unauthenticated visitors to login
 * - Fetches the user's bookmarks with associated podcast information
 * - Fetches learning path progress with graph and node details
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  // Fetch bookmarks with podcast info
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*, podcast:podcasts(id, title, thumbnail_url, domain)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch learning path progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*, graph:learning_graphs(id, title, domain), episode:episodes(id, title)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <ProfileContent
        user={{ id: user.id, email: user.email ?? '', createdAt: user.created_at }}
        bookmarks={bookmarks ?? []}
        progress={progress ?? []}
      />
    </div>
  )
}
