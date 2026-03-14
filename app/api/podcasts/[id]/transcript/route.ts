/**
 * @module api/podcasts/[id]/transcript
 *
 * Manages transcript data for a specific podcast episode.
 *
 * Key responsibilities:
 * - Upsert transcript text and time-stamped segments for a podcast.
 * - Retrieve the transcript for a given podcast.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  unauthorizedResponse,
  validationErrorResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api/error-response'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Upsert (create or replace) the transcript for a podcast.
 *
 * @param request - JSON body with `full_text` (required) and `segments` (optional array).
 * @param context - Route context containing the podcast `id` param.
 * @returns The saved transcript with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `full_text` is missing.
 * @throws 500 if the upsert fails.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: podcastId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { full_text, segments, transcript_type = 'short' } = await request.json()

  if (!full_text || typeof full_text !== 'string') {
    return validationErrorResponse('full_text is required and must be a string')
  }

  if (!['short', 'long'].includes(transcript_type)) {
    return validationErrorResponse('transcript_type must be "short" or "long"')
  }

  const { data: transcript, error: upsertError } = await supabase
    .from('transcripts')
    .upsert(
      { podcast_id: podcastId, full_text, segments, transcript_type },
      { onConflict: 'podcast_id,transcript_type' }
    )
    .select()
    .single()

  if (upsertError) return internalErrorResponse('save transcript', upsertError)

  return NextResponse.json(transcript, { status: 201 })
}

/**
 * Retrieve the transcript for a podcast.
 *
 * @param _request - Unused incoming request.
 * @param context - Route context containing the podcast `id` param.
 * @returns The transcript object for the given podcast.
 * @throws 404 if no transcript exists for this podcast.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: podcastId } = await params
  const supabase = await createClient()

  const { data: transcripts, error: fetchError } = await supabase
    .from('transcripts')
    .select('*')
    .eq('podcast_id', podcastId)

  if (fetchError) return internalErrorResponse('fetch transcripts', fetchError)
  if (!transcripts || transcripts.length === 0) return notFoundResponse('Transcript')

  return NextResponse.json(transcripts)
}
