/**
 * @module api/learning-graphs/[id]/data
 *
 * Handles bulk replacement of episodes and edges for a learning graph.
 *
 * Key responsibilities:
 * - Validate incoming graph data against the Zod schema.
 * - Replace all existing episodes and edges atomically.
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
 * Build row payloads for inserting episodes into the database.
 *
 * @param graphId - The parent graph's UUID.
 * @param episodes - Validated episode data from the request.
 * @returns Array of row objects ready for Supabase insert.
 */
function buildEpisodeInsertPayloads(
  graphId: string,
  episodes: {
    title: string
    description?: string | null
    thumbnail_url?: string | null
    audio_url?: string | null
    transcript?: { full_text?: string | null; segments?: { start: number; end: number; text: string }[] | null } | null
    position_x: number
    position_y: number
    label?: string | null
    node_type: string
    sort_order?: number | null
  }[]
) {
  return episodes.map((ep) => ({
    graph_id: graphId,
    title: ep.title,
    description: ep.description ?? null,
    thumbnail_url: ep.thumbnail_url ?? null,
    audio_url: ep.audio_url ?? null,
    transcript: ep.transcript ?? null,
    position_x: ep.position_x,
    position_y: ep.position_y,
    label: ep.label ?? null,
    node_type: ep.node_type,
    sort_order: ep.sort_order ?? 0,
  }))
}

/**
 * Create a mapping from client-side temporary IDs to server-generated UUIDs.
 *
 * The client sends edges referencing episodes by temporary IDs (the episode's original
 * `id` or its array index as a string). This function maps those to the real UUIDs
 * returned after insertion.
 *
 * @param clientEpisodes - The original episode data sent by the client.
 * @param insertedEpisodes - The episodes returned by Supabase after insertion.
 * @returns A record mapping temporary IDs to real database UUIDs.
 */
function buildTemporaryIdMapping(
  clientEpisodes: { id?: string | null }[],
  insertedEpisodes: { id: string }[]
): Record<string, string> {
  const mapping: Record<string, string> = {}
  clientEpisodes.forEach((ep, index) => {
    const temporaryId = ep.id ?? String(index)
    mapping[temporaryId] = insertedEpisodes[index].id
  })
  return mapping
}

/**
 * Replace all episodes and edges for a learning graph.
 *
 * Performs a delete-then-insert strategy: removes existing edges and episodes,
 * inserts the new set, maps temporary client IDs to real UUIDs for edge references,
 * then returns the fully hydrated graph.
 *
 * @param request - JSON body validated against `saveGraphDataSchema`.
 * @param context - Route context containing the graph `id` param.
 * @returns The complete saved graph with episodes and edges.
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

  const { episodes, edges } = parsed.data

  // Delete existing edges before episodes to avoid FK constraint issues
  const { error: deleteEdgesError } = await supabase
    .from('learning_path_edges')
    .delete()
    .eq('graph_id', graphId)

  if (deleteEdgesError) return internalErrorResponse('delete existing edges', deleteEdgesError)

  const { error: deleteEpisodesError } = await supabase
    .from('episodes')
    .delete()
    .eq('graph_id', graphId)

  if (deleteEpisodesError) return internalErrorResponse('delete existing episodes', deleteEpisodesError)

  if (episodes.length === 0) {
    return NextResponse.json({ episodes: [], edges: [] })
  }

  const episodePayloads = buildEpisodeInsertPayloads(graphId, episodes)

  const { data: insertedEpisodes, error: insertEpisodesError } = await supabase
    .from('episodes')
    .insert(episodePayloads)
    .select()

  if (insertEpisodesError || !insertedEpisodes) {
    return internalErrorResponse('insert episodes', insertEpisodesError)
  }

  const temporaryIdMap = buildTemporaryIdMapping(episodes, insertedEpisodes)

  if (edges.length > 0) {
    const edgePayloads = edges.map((edge) => ({
      graph_id: graphId,
      source_episode_id: temporaryIdMap[edge.source_episode_id] ?? edge.source_episode_id,
      target_episode_id: temporaryIdMap[edge.target_episode_id] ?? edge.target_episode_id,
      label: edge.label ?? null,
    }))

    const { error: insertEdgesError } = await supabase
      .from('learning_path_edges')
      .insert(edgePayloads)

    if (insertEdgesError) return internalErrorResponse('insert edges', insertEdgesError)
  }

  const { data: savedGraph, error: fetchError } = await supabase
    .from('learning_graphs')
    .select(`
      *,
      episodes:episodes(*),
      edges:learning_path_edges(*)
    `)
    .eq('id', graphId)
    .single()

  if (fetchError) return internalErrorResponse('fetch saved graph', fetchError)

  return NextResponse.json(savedGraph)
}
