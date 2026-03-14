/**
 * @module api/learning-graphs/[id]
 *
 * Handles operations on a single learning graph identified by its ID.
 *
 * Key responsibilities:
 * - Fetch a learning graph with its nodes, edges, and podcast details.
 * - Update a learning graph's metadata.
 * - Delete a learning graph.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/error-response'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Retrieve a single learning graph with its full node and edge data.
 *
 * @param _request - Unused incoming request.
 * @param context - Route context containing the graph `id` param.
 * @returns JSON object with the graph, its nodes (with podcast details), and edges.
 * @throws 500 if the database query fails.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: graphId } = await params
  const supabase = await createClient()

  const { data: graph, error: fetchError } = await supabase
    .from('learning_graphs')
    .select(`
      *,
      episodes:episodes(*),
      edges:learning_path_edges(*)
    `)
    .eq('id', graphId)
    .single()

  if (fetchError) return internalErrorResponse('fetch learning graph', fetchError)

  return NextResponse.json(graph)
}

/**
 * Update a learning graph's metadata (e.g. title, description).
 *
 * @param request - JSON body with fields to update.
 * @param context - Route context containing the graph `id` param.
 * @returns The updated learning graph.
 * @throws 401 if user is not authenticated.
 * @throws 400 if request body is empty.
 * @throws 500 if the update fails.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: graphId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  if (!body || Object.keys(body).length === 0) {
    return validationErrorResponse('Request body must contain at least one field to update')
  }

  const { data: updatedGraph, error: updateError } = await supabase
    .from('learning_graphs')
    .update(body)
    .eq('id', graphId)
    .select()
    .single()

  if (updateError) return internalErrorResponse('update learning graph', updateError)

  return NextResponse.json(updatedGraph)
}

/**
 * Delete a learning graph by ID.
 *
 * @param _request - Unused incoming request.
 * @param context - Route context containing the graph `id` param.
 * @returns JSON `{ success: true }` on successful deletion.
 * @throws 401 if user is not authenticated.
 * @throws 500 if the delete fails.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: graphId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const { error: deleteError } = await supabase.from('learning_graphs').delete().eq('id', graphId)
  if (deleteError) return internalErrorResponse('delete learning graph', deleteError)

  return NextResponse.json({ success: true })
}
