/**
 * @module api/learning-graphs/[id]/data
 *
 * Handles bulk replacement of nodes and edges for a learning graph.
 *
 * Key responsibilities:
 * - Validate incoming graph data against the Zod schema.
 * - Replace all existing nodes and edges atomically.
 * - Map client-side temporary IDs to server-generated UUIDs for edges.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveGraphDataSchema } from '@/lib/schemas/learning-graph'
import {
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/error-response'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Build row payloads for inserting nodes into the database.
 *
 * @param graphId - The parent graph's UUID.
 * @param nodes - Validated node data from the request.
 * @returns Array of row objects ready for Supabase insert.
 */
function buildNodeInsertPayloads(
  graphId: string,
  nodes: { podcast_id: string; position_x: number; position_y: number; label?: string | null; node_type: string; sort_order?: number | null }[]
) {
  return nodes.map((node) => ({
    graph_id: graphId,
    podcast_id: node.podcast_id,
    position_x: node.position_x,
    position_y: node.position_y,
    label: node.label ?? null,
    node_type: node.node_type,
    sort_order: node.sort_order ?? 0,
  }))
}

/**
 * Create a mapping from client-side temporary IDs to server-generated UUIDs.
 *
 * The client sends edges referencing nodes by temporary IDs (the node's original `id`
 * or its array index as a string). This function maps those to the real UUIDs returned
 * after insertion.
 *
 * @param clientNodes - The original node data sent by the client.
 * @param insertedNodes - The nodes returned by Supabase after insertion.
 * @returns A record mapping temporary IDs to real database UUIDs.
 */
function buildTemporaryIdMapping(
  clientNodes: { id?: string | null }[],
  insertedNodes: { id: string }[]
): Record<string, string> {
  const mapping: Record<string, string> = {}
  clientNodes.forEach((node, index) => {
    const temporaryId = node.id ?? String(index)
    mapping[temporaryId] = insertedNodes[index].id
  })
  return mapping
}

/**
 * Replace all nodes and edges for a learning graph.
 *
 * Performs a delete-then-insert strategy: removes existing edges and nodes,
 * inserts the new set, maps temporary client IDs to real UUIDs for edge references,
 * then returns the fully hydrated graph.
 *
 * @param request - JSON body validated against `saveGraphDataSchema`.
 * @param context - Route context containing the graph `id` param.
 * @returns The complete saved graph with nodes (including podcast data) and edges.
 * @throws 401 if user is not authenticated.
 * @throws 400 if the request body fails schema validation.
 * @throws 500 if any database operation fails.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  const { id: graphId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()
  const parsed = saveGraphDataSchema.safeParse(body)
  if (!parsed.success) {
    return validationErrorResponse('Invalid graph data', parsed.error.flatten())
  }

  const { nodes, edges } = parsed.data

  // Delete existing edges before nodes to avoid FK constraint issues
  const { error: deleteEdgesError } = await supabase
    .from('learning_graph_edges')
    .delete()
    .eq('graph_id', graphId)

  if (deleteEdgesError) return internalErrorResponse('delete existing edges', deleteEdgesError)

  const { error: deleteNodesError } = await supabase
    .from('learning_graph_nodes')
    .delete()
    .eq('graph_id', graphId)

  if (deleteNodesError) return internalErrorResponse('delete existing nodes', deleteNodesError)

  if (nodes.length === 0) {
    return NextResponse.json({ nodes: [], edges: [] })
  }

  const nodePayloads = buildNodeInsertPayloads(graphId, nodes)

  const { data: insertedNodes, error: insertNodesError } = await supabase
    .from('learning_graph_nodes')
    .insert(nodePayloads)
    .select()

  if (insertNodesError || !insertedNodes) {
    return internalErrorResponse('insert nodes', insertNodesError)
  }

  const temporaryIdMap = buildTemporaryIdMapping(nodes, insertedNodes)

  if (edges.length > 0) {
    const edgePayloads = edges.map((edge) => ({
      graph_id: graphId,
      source_node_id: temporaryIdMap[edge.source_node_id] ?? edge.source_node_id,
      target_node_id: temporaryIdMap[edge.target_node_id] ?? edge.target_node_id,
      label: edge.label ?? null,
    }))

    const { error: insertEdgesError } = await supabase
      .from('learning_graph_edges')
      .insert(edgePayloads)

    if (insertEdgesError) return internalErrorResponse('insert edges', insertEdgesError)
  }

  const { data: savedGraph, error: fetchError } = await supabase
    .from('learning_graphs')
    .select(`
      *,
      nodes:learning_graph_nodes(*, podcast:podcasts(id, title, thumbnail_url, domain, description, audio_short_url, audio_long_url, bulletin_url)),
      edges:learning_graph_edges(*)
    `)
    .eq('id', graphId)
    .single()

  if (fetchError) return internalErrorResponse('fetch saved graph', fetchError)

  return NextResponse.json(savedGraph)
}
