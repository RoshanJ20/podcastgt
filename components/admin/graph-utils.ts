/**
 * @module graph-utils
 *
 * Utility functions for converting between database graph representations
 * and React Flow node/edge formats, plus automatic layout via dagre.
 */

import type { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'
import type { PodcastNodeData } from './graph-nodes/PodcastNode'
import type { LearningGraphNode, LearningGraphEdge, Podcast } from '@/lib/supabase/types'

/** Summary fields needed from a Podcast record. */
export type PodcastSummary = Pick<Podcast, 'id' | 'title' | 'thumbnail_url' | 'domain'>

/** Extended data stored per-node, including fields used by the edit modal. */
export type ExtendedPodcastNodeData = PodcastNodeData & {
  description?: string | null
  audioShortUrl?: string | null
  audioLongUrl?: string | null
  bulletinUrl?: string | null
}

/**
 * Converts database learning-graph nodes into React Flow nodes.
 */
export function dbNodesToFlowNodes(
  dbNodes: LearningGraphNode[]
): Node<ExtendedPodcastNodeData>[] {
  return dbNodes.map((n) => ({
    id: n.id,
    type: 'podcast',
    position: { x: n.position_x, y: n.position_y },
    data: {
      podcastId: n.podcast_id,
      title: n.podcast?.title ?? 'Untitled',
      domain: n.podcast?.domain ?? '',
      thumbnailUrl: n.podcast?.thumbnail_url ?? null,
      nodeType: n.node_type,
      description: n.podcast?.description ?? null,
      audioShortUrl: n.podcast?.audio_short_url ?? null,
      audioLongUrl: n.podcast?.audio_long_url ?? null,
      bulletinUrl: n.podcast?.bulletin_url ?? null,
    },
  }))
}

/**
 * Converts database learning-graph edges into React Flow edges.
 */
export function dbEdgesToFlowEdges(dbEdges: LearningGraphEdge[]): Edge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.source_node_id,
    target: e.target_node_id,
    label: e.label ?? undefined,
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  }))
}

/**
 * Applies an automatic top-to-bottom dagre layout to the given nodes and edges.
 * Returns a new array of nodes with updated positions.
 */
export function autoLayout(
  nodes: Node<ExtendedPodcastNodeData>[],
  edges: Edge[]
): Node<ExtendedPodcastNodeData>[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 80 })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - 100, y: pos.y - 40 },
    }
  })
}
