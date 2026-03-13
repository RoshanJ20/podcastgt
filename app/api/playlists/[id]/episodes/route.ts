import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET — list episodes in playlist ordered by episode_order
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('podcasts')
    .select('id, title, domain, year, episode_order, thumbnail_url')
    .eq('playlist_id', id)
    .order('episode_order', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — assign podcast(s) to this playlist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { podcast_ids } = await request.json()
  if (!Array.isArray(podcast_ids) || podcast_ids.length === 0) {
    return NextResponse.json({ error: 'podcast_ids array required' }, { status: 400 })
  }

  // Get current max episode_order in this playlist
  const { data: existing } = await supabase
    .from('podcasts')
    .select('episode_order')
    .eq('playlist_id', id)
    .order('episode_order', { ascending: false })
    .limit(1)

  let nextOrder = (existing?.[0]?.episode_order ?? 0) + 1

  // Assign each podcast to this playlist
  const errors: string[] = []
  for (const podcastId of podcast_ids) {
    const { error } = await supabase
      .from('podcasts')
      .update({ playlist_id: id, episode_order: nextOrder })
      .eq('id', podcastId)

    if (error) errors.push(error.message)
    else nextOrder++
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// PATCH — reorder episodes (accepts ordered array of podcast IDs)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ordered_ids } = await request.json()
  if (!Array.isArray(ordered_ids)) {
    return NextResponse.json({ error: 'ordered_ids array required' }, { status: 400 })
  }

  const errors: string[] = []
  for (let i = 0; i < ordered_ids.length; i++) {
    const { error } = await supabase
      .from('podcasts')
      .update({ episode_order: i + 1 })
      .eq('id', ordered_ids[i])
      .eq('playlist_id', id)

    if (error) errors.push(error.message)
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join('; ') }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE — remove a podcast from this playlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { podcast_id } = await request.json()
  if (!podcast_id) {
    return NextResponse.json({ error: 'podcast_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('podcasts')
    .update({ playlist_id: null, episode_order: null })
    .eq('id', podcast_id)
    .eq('playlist_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
