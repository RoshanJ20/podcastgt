import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveGraphDataSchema } from '@/lib/schemas/learning-graph'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: graphId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = saveGraphDataSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { nodes, edges } = parsed.data

  // Delete existing nodes and edges (edges cascade from nodes, but delete explicitly for clarity)
  const { error: deleteEdgesError } = await supabase
    .from('learning_graph_edges')
    .delete()
    .eq('graph_id', graphId)

  if (deleteEdgesError) {
    return NextResponse.json({ error: deleteEdgesError.message }, { status: 500 })
  }

  const { error: deleteNodesError } = await supabase
    .from('learning_graph_nodes')
    .delete()
    .eq('graph_id', graphId)

  if (deleteNodesError) {
    return NextResponse.json({ error: deleteNodesError.message }, { status: 500 })
  }

  if (nodes.length === 0) {
    return NextResponse.json({ nodes: [], edges: [] })
  }

  // Insert new nodes
  const nodeRows = nodes.map((node) => ({
    graph_id: graphId,
    podcast_id: node.podcast_id,
    position_x: node.position_x,
    position_y: node.position_y,
    label: node.label ?? null,
    node_type: node.node_type,
    sort_order: node.sort_order ?? 0,
  }))

  const { data: insertedNodes, error: insertNodesError } = await supabase
    .from('learning_graph_nodes')
    .insert(nodeRows)
    .select()

  if (insertNodesError || !insertedNodes) {
    return NextResponse.json({ error: insertNodesError?.message ?? 'Failed to insert nodes' }, { status: 500 })
  }

  // Build a mapping from client-side node index to server-generated UUID
  // The client sends edges referencing nodes by their temporary IDs (array index as string)
  // We need to map those to the real UUIDs
  const tempIdToRealId: Record<string, string> = {}
  nodes.forEach((node, index) => {
    const tempId = node.id ?? String(index)
    tempIdToRealId[tempId] = insertedNodes[index].id
  })

  // Insert edges with mapped node IDs
  if (edges.length > 0) {
    const edgeRows = edges.map((edge) => ({
      graph_id: graphId,
      source_node_id: tempIdToRealId[edge.source_node_id] ?? edge.source_node_id,
      target_node_id: tempIdToRealId[edge.target_node_id] ?? edge.target_node_id,
      label: edge.label ?? null,
    }))

    const { error: insertEdgesError } = await supabase
      .from('learning_graph_edges')
      .insert(edgeRows)

    if (insertEdgesError) {
      return NextResponse.json({ error: insertEdgesError.message }, { status: 500 })
    }
  }

  // Return the full graph data
  const { data: savedGraph, error: fetchError } = await supabase
    .from('learning_graphs')
    .select(`
      *,
      nodes:learning_graph_nodes(*, podcast:podcasts(id, title, thumbnail_url, domain, description, audio_short_url, audio_long_url, bulletin_url)),
      edges:learning_graph_edges(*)
    `)
    .eq('id', graphId)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(savedGraph)
}
