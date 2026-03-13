import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// List all users with roles (superadmin only)
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const serviceClient = await createServiceClient()

  const { data: roles, error } = await serviceClient
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch auth user emails via admin API
  const { data: authUsers } = await serviceClient.auth.admin.listUsers()
  const emailMap = Object.fromEntries(
    (authUsers?.users ?? []).map((u) => [u.id, u.email])
  )

  const enriched = roles.map((r) => ({ ...r, email: emailMap[r.user_id] ?? null }))

  return NextResponse.json(enriched)
}

// Assign or update a user's role (superadmin only)
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { target_user_id, role } = await request.json()

  const serviceClient = await createServiceClient()

  const { data, error } = await serviceClient
    .from('user_roles')
    .upsert({ user_id: target_user_id, role, assigned_by: user.id }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
