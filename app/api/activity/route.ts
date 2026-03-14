import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = parseInt(request.nextUrl.searchParams.get('days') ?? '90')
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data, error } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { activity_type, podcast_id, graph_id, metadata } = await request.json()

  if (!activity_type) {
    return NextResponse.json({ error: 'activity_type is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_activity')
    .insert({
      user_id: user.id,
      activity_type,
      podcast_id: podcast_id ?? null,
      graph_id: graph_id ?? null,
      metadata: metadata ?? {},
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
