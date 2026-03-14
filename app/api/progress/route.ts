import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const graphId = request.nextUrl.searchParams.get('graph_id')

  let query = supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (graphId) {
    query = query.eq('graph_id', graphId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { graph_id, node_id } = await request.json()

  if (!graph_id || !node_id) {
    return NextResponse.json({ error: 'graph_id and node_id are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      { user_id: user.id, graph_id, node_id },
      { onConflict: 'user_id,node_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { node_id } = await request.json()

  const { error } = await supabase
    .from('user_progress')
    .delete()
    .eq('node_id', node_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
