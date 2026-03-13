import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const domain = searchParams.get('domain')
  const contentType = searchParams.get('content_type')
  const year = searchParams.get('year')
  const tags = searchParams.get('tags')

  let query = supabase
    .from('podcasts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (domain) query = query.eq('domain', domain)
  if (contentType) query = query.eq('content_type', contentType)
  if (year) query = query.eq('year', parseInt(year))
  if (tags) query = query.overlaps('tags', tags.split(','))

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

  const body = await request.json()

  const { data, error } = await supabase
    .from('podcasts')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
