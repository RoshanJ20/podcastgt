/**
 * @module api/users
 *
 * Manages user role assignments (superadmin-only operations).
 *
 * Key responsibilities:
 * - List all users with their roles and email addresses.
 * - Assign or update a user's role.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/error-response'

/**
 * List all users with their roles, enriched with email addresses from the auth system.
 *
 * Only accessible by superadmin users.
 *
 * @returns JSON array of user role records with `email` field appended.
 * @throws 401 if user is not authenticated.
 * @throws 403 if user is not a superadmin.
 * @throws 500 if the database query fails.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { data: callerRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerRole?.role !== 'superadmin') {
    return forbiddenResponse()
  }

  const serviceClient = await createServiceClient()

  const { data: userRoles, error: rolesError } = await serviceClient
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (rolesError) return internalErrorResponse('fetch user roles', rolesError)

  // Enrich role records with email addresses from the auth system
  const { data: authUserList } = await serviceClient.auth.admin.listUsers()
  const emailByUserId = Object.fromEntries(
    (authUserList?.users ?? []).map((authUser) => [authUser.id, authUser.email])
  )

  const enrichedRoles = userRoles.map((roleRecord) => ({
    ...roleRecord,
    email: emailByUserId[roleRecord.user_id] ?? null,
  }))

  return NextResponse.json(enrichedRoles)
}

/**
 * Assign or update a user's role.
 *
 * Only accessible by superadmin users.
 *
 * @param request - JSON body with `target_user_id` (required) and `role` (required).
 * @returns The upserted user role record.
 * @throws 401 if user is not authenticated.
 * @throws 403 if user is not a superadmin.
 * @throws 400 if required fields are missing.
 * @throws 500 if the upsert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { data: callerRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (callerRole?.role !== 'superadmin') {
    return forbiddenResponse()
  }

  const { target_user_id, role } = await request.json()

  if (!target_user_id || typeof target_user_id !== 'string') {
    return validationErrorResponse('target_user_id is required')
  }
  if (!role || typeof role !== 'string') {
    return validationErrorResponse('role is required')
  }

  const serviceClient = await createServiceClient()

  const { data: updatedRole, error: upsertError } = await serviceClient
    .from('user_roles')
    .upsert({ user_id: target_user_id, role, assigned_by: user.id }, { onConflict: 'user_id' })
    .select()
    .single()

  if (upsertError) return internalErrorResponse('assign role', upsertError)

  return NextResponse.json(updatedRole)
}
