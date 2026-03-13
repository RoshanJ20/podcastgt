import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { podcasts } = await request.json()
  if (!Array.isArray(podcasts) || podcasts.length === 0) {
    return NextResponse.json({ error: 'podcasts array required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('podcasts')
    .insert(podcasts)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
