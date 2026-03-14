/**
 * @module api/podcasts
 *
 * Provides listing and creation endpoints for podcast episodes.
 *
 * Key responsibilities:
 * - List podcasts with optional filters (domain, content type, year, tags).
 * - Create a new podcast entry (authenticated users only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Retrieve all podcasts, optionally filtered by domain, content type, year, or tags.
 *
 * @param request - Incoming request with optional query params: `domain`, `content_type`, `year`, `tags`.
 * @returns JSON array of podcast objects ordered by sort_order then created_at.
 * @throws 500 if the database query fails.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const domain = searchParams.get('domain')
  const contentType = searchParams.get('content_type')
  const year = searchParams.get('year')
  const tags = searchParams.get('tags')

  let podcastQuery = supabase
    .from('podcasts')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (domain) podcastQuery = podcastQuery.eq('domain', domain)
  if (contentType) podcastQuery = podcastQuery.eq('content_type', contentType)
  if (year) podcastQuery = podcastQuery.eq('year', parseInt(year, 10))
  if (tags) podcastQuery = podcastQuery.overlaps('tags', tags.split(','))

  const { data: podcasts, error: fetchError } = await podcastQuery

  if (fetchError) return internalErrorResponse('fetch podcasts', fetchError)

  return NextResponse.json(podcasts)
}

/**
 * Create a new podcast entry.
 *
 * @param request - JSON body with podcast fields (title, domain, etc.).
 * @returns The newly created podcast with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the insert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()

  const { data: podcast, error: insertError } = await supabase
    .from('podcasts')
    .insert(body)
    .select()
    .single()

  if (insertError) return internalErrorResponse('create podcast', insertError)

  return NextResponse.json(podcast, { status: 201 })
}
