/**
 * @module api/podcasts/batch
 *
 * Handles bulk creation of multiple podcast entries in a single request.
 *
 * Key responsibilities:
 * - Validate that the request contains a non-empty array of podcasts.
 * - Insert all podcast entries in one database operation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Create multiple podcast entries in a single batch.
 *
 * @param request - JSON body with `podcasts` (required, non-empty array of podcast objects).
 * @returns JSON array of the newly created podcasts with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `podcasts` is missing or not a non-empty array.
 * @throws 500 if the insert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { podcasts } = await request.json()
  if (!Array.isArray(podcasts) || podcasts.length === 0) {
    return validationErrorResponse('podcasts must be a non-empty array')
  }

  const { data: createdPodcasts, error: insertError } = await supabase
    .from('podcasts')
    .insert(podcasts)
    .select()

  if (insertError) return internalErrorResponse('batch create podcasts', insertError)

  return NextResponse.json(createdPodcasts, { status: 201 })
}
