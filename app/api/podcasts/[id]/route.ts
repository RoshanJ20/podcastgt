/**
 * @module api/podcasts/[id]
 *
 * Handles operations on a single podcast identified by its ID.
 *
 * Key responsibilities:
 * - Fetch a podcast with its transcript data.
 * - Update podcast metadata.
 * - Delete a podcast.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, internalErrorResponse, notFoundResponse } from '@/lib/api/error-response'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Retrieve a single podcast with its associated transcript.
 *
 * @param _request - Unused incoming request.
 * @param context - Route context containing the podcast `id` param.
 * @returns JSON object with podcast data and nested transcript.
 * @throws 404 if the podcast does not exist.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: podcastId } = await params
  const supabase = await createClient()

  const { data: podcast, error: fetchError } = await supabase
    .from('podcasts')
    .select('*, transcripts(id, full_text, segments, transcript_type)')
    .eq('id', podcastId)
    .single()

  if (fetchError) return notFoundResponse('Podcast')

  return NextResponse.json(podcast)
}

/**
 * Update a podcast's metadata.
 *
 * @param request - JSON body with fields to update.
 * @param context - Route context containing the podcast `id` param.
 * @returns The updated podcast.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the update fails.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: podcastId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()

  const { data: updatedPodcast, error: updateError } = await supabase
    .from('podcasts')
    .update(body)
    .eq('id', podcastId)
    .select()
    .single()

  if (updateError) return internalErrorResponse('update podcast', updateError)

  return NextResponse.json(updatedPodcast)
}

/**
 * Delete a podcast by ID.
 *
 * @param _request - Unused incoming request.
 * @param context - Route context containing the podcast `id` param.
 * @returns JSON `{ success: true }` on successful deletion.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the delete fails.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: podcastId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { error: deleteError } = await supabase.from('podcasts').delete().eq('id', podcastId)

  if (deleteError) return internalErrorResponse('delete podcast', deleteError)

  return NextResponse.json({ success: true })
}
