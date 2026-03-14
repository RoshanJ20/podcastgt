/**
 * @module graph-utils
 *
 * Utility functions for converting between database episode representations
 * and React Flow node/edge formats, plus automatic layout via dagre.
 */

import type { Edge, Node } from '@xyflow/react'
import dagre from 'dagre'
import type { Episode, LearningPathEdge, GraphNodeType, EpisodeTranscript } from '@/lib/supabase/types'

/** Data stored per React Flow node for episode editing. */
export type EpisodeNodeData = {
  episodeId?: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  transcript: EpisodeTranscript | null
  nodeType: GraphNodeType
}

/**
 * Converts database episodes into React Flow nodes.
 */
export function episodesToFlowNodes(
  episodes: Episode[]
): Node<EpisodeNodeData>[] {
  return episodes.map((ep) => ({
    id: ep.id,
    type: 'episode',
    position: { x: ep.position_x, y: ep.position_y },
    data: {
      episodeId: ep.id,
      title: ep.title,
      description: ep.description,
      thumbnailUrl: ep.thumbnail_url,
      audioUrl: ep.audio_url,
      transcript: ep.transcript,
      nodeType: ep.node_type,
    },
  }))
}

/**
 * Converts database learning-path edges into React Flow edges.
 */
export function dbEdgesToFlowEdges(dbEdges: LearningPathEdge[]): Edge[] {
  return dbEdges.map((e) => ({
    id: e.id,
    source: e.source_episode_id,
    target: e.target_episode_id,
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
  nodes: Node<EpisodeNodeData>[],
  edges: Edge[]
): Node<EpisodeNodeData>[] {
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
