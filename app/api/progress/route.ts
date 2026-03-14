/**
 * @module api/progress
 *
 * Tracks user completion progress through learning graph nodes.
 *
 * Key responsibilities:
 * - Retrieve progress entries for the authenticated user (optionally filtered by graph).
 * - Mark a learning graph node as completed.
 * - Remove a completion record (uncomplete a node).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Retrieve progress entries for the authenticated user.
 *
 * @param request - Incoming request; supports optional `graph_id` query param to filter.
 * @returns JSON array of progress entries ordered by most recently completed first.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the database query fails.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const graphId = request.nextUrl.searchParams.get('graph_id')

  let progressQuery = supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })

  if (graphId) {
    progressQuery = progressQuery.eq('graph_id', graphId)
  }

  const { data: progressEntries, error: fetchError } = await progressQuery

  if (fetchError) return internalErrorResponse('fetch progress', fetchError)

  return NextResponse.json(progressEntries)
}

/**
 * Mark a learning graph node as completed for the authenticated user.
 *
 * @param request - JSON body with `graph_id` (required) and `node_id` (required).
 * @returns The upserted progress entry with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if required fields are missing.
 * @throws 500 if the upsert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { graph_id, node_id } = await request.json()

  if (!graph_id || typeof graph_id !== 'string') {
    return validationErrorResponse('graph_id is required')
  }
  if (!node_id || typeof node_id !== 'string') {
    return validationErrorResponse('node_id is required')
  }

  const { data: progressEntry, error: upsertError } = await supabase
    .from('user_progress')
    .upsert(
      { user_id: user.id, graph_id, node_id },
      { onConflict: 'user_id,node_id' }
    )
    .select()
    .single()

  if (upsertError) return internalErrorResponse('record progress', upsertError)

  return NextResponse.json(progressEntry, { status: 201 })
}

/**
 * Remove a completion record for a learning graph node.
 *
 * @param request - JSON body with `node_id` (required).
 * @returns JSON `{ success: true }` on successful deletion.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `node_id` is missing.
 * @throws 500 if the delete fails.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { node_id } = await request.json()

  if (!node_id || typeof node_id !== 'string') {
    return validationErrorResponse('node_id is required')
  }

  const { error: deleteError } = await supabase
    .from('user_progress')
    .delete()
    .eq('node_id', node_id)
    .eq('user_id', user.id)

  if (deleteError) return internalErrorResponse('remove progress', deleteError)

  return NextResponse.json({ success: true })
}
