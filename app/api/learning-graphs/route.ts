/**
 * @module api/learning-graphs
 *
 * Provides CRUD operations for learning graph collections.
 *
 * Key responsibilities:
 * - List all learning graphs with their node counts.
 * - Create a new learning graph (authenticated users only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorizedResponse, validationErrorResponse, internalErrorResponse } from '@/lib/api/error-response'

/**
 * Retrieve all learning graphs ordered by most recently created.
 *
 * @returns JSON array of learning graphs, each with an aggregated `node_count`.
 * @throws 500 if the database query fails.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: graphs, error: fetchError } = await supabase
    .from('learning_graphs')
    .select('*, node_count:learning_graph_nodes(count)')
    .order('created_at', { ascending: false })

  if (fetchError) return internalErrorResponse('fetch learning graphs', fetchError)

  return NextResponse.json(graphs)
}

/**
 * Create a new learning graph.
 *
 * @param request - JSON body with `title` (required) and optional `description`, `domain`.
 * @returns The newly created learning graph with status 201.
 * @throws 401 if user is not authenticated.
 * @throws 400 if `title` is missing.
 * @throws 500 if the insert fails.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()

  if (!body.title || typeof body.title !== 'string') {
    return validationErrorResponse('title is required')
  }

  const { data: graph, error: insertError } = await supabase
    .from('learning_graphs')
    .insert(body)
    .select()
    .single()

  if (insertError) return internalErrorResponse('create learning graph', insertError)

  return NextResponse.json(graph, { status: 201 })
}
