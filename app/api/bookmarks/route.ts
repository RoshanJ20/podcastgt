/**
 * @module api/bookmarks
 *
 * Manages user bookmarks on podcast episodes at specific timestamps.
 *
 * Key responsibilities:
 * - List all bookmarks for the authenticated user.
 * - Create a new bookmark with a timestamp and optional note.
 * - Delete a bookmark owned by the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Retrieve all bookmarks for the authenticated user.
 *
 * @returns JSON array of bookmarks with associated podcast details, ordered by most recent first.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the database query fails.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { data: bookmarks, error: fetchError } = await supabase
    .from('bookmarks')
    .select('*, podcast:podcasts(id, title, thumbnail_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (fetchError) return internalErrorResponse('fetch bookmarks', fetchError)

  return NextResponse.json(bookmarks)
}

/**
 * Create a new bookmark for the authenticated user.
 *
 * @param request - JSON body with `podcast_id` (required), `timestamp_seconds` (required), optional `note`.
 * @returns The newly created bookmark with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if required fields are missing.
 * @throws 500 if the insert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { podcast_id, timestamp_seconds, note } = await request.json()

  if (!podcast_id || typeof podcast_id !== 'string') {
    return validationErrorResponse('podcast_id is required')
  }
  if (timestamp_seconds === undefined || typeof timestamp_seconds !== 'number') {
    return validationErrorResponse('timestamp_seconds is required and must be a number')
  }

  const { data: bookmark, error: insertError } = await supabase
    .from('bookmarks')
    .insert({ user_id: user.id, podcast_id, timestamp_seconds, note })
    .select()
    .single()

  if (insertError) return internalErrorResponse('create bookmark', insertError)

  return NextResponse.json(bookmark, { status: 201 })
}

/**
 * Delete a bookmark owned by the authenticated user.
 *
 * @param request - JSON body with `id` (required) — the bookmark ID to delete.
 * @returns JSON `{ success: true }` on successful deletion.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `id` is missing.
 * @throws 500 if the delete fails.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { id } = await request.json()

  if (!id || typeof id !== 'string') {
    return validationErrorResponse('id is required')
  }

  const { error: deleteError } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) return internalErrorResponse('delete bookmark', deleteError)

  return NextResponse.json({ success: true })
}
