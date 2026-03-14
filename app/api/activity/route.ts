/**
 * @module api/activity
 *
 * Handles user activity tracking for analytics and engagement metrics.
 *
 * Key responsibilities:
 * - Retrieve recent user activity entries within a configurable time window.
 * - Record new activity events (e.g. podcast plays, graph views).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Retrieve the authenticated user's activity history.
 *
 * @param request - Incoming request; supports `days` query param (defaults to 90).
 * @returns JSON array of activity entries ordered by most recent first.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the database query fails.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const daysParam = request.nextUrl.searchParams.get('days') ?? '90'
  const dayCount = parseInt(daysParam, 10)
  if (isNaN(dayCount) || dayCount < 1) {
    return validationErrorResponse('days must be a positive integer')
  }

  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - dayCount)

  const { data: activities, error: fetchError } = await supabase
    .from('user_activity')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', sinceDate.toISOString())
    .order('created_at', { ascending: false })

  if (fetchError) return internalErrorResponse('fetch activity', fetchError)

  return NextResponse.json(activities)
}

/**
 * Record a new activity event for the authenticated user.
 *
 * @param request - JSON body with `activity_type` (required), optional `episode_id`, `graph_id`, `metadata`.
 * @returns The newly created activity entry with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `activity_type` is missing.
 * @throws 500 if the insert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { activity_type, episode_id, graph_id, metadata } = await request.json()

  if (!activity_type || typeof activity_type !== 'string') {
    return validationErrorResponse('activity_type is required and must be a string')
  }

  const { data: activityEntry, error: insertError } = await supabase
    .from('user_activity')
    .insert({
      user_id: user.id,
      activity_type,
      episode_id: episode_id ?? null,
      graph_id: graph_id ?? null,
      metadata: metadata ?? {},
    })
    .select()
    .single()

  if (insertError) return internalErrorResponse('record activity', insertError)

  return NextResponse.json(activityEntry, { status: 201 })
}
