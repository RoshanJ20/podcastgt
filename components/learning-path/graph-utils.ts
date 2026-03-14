/**
 * @module graph-utils
 *
 * Utility functions for transforming learning graph data between database
 * representations and React Flow node/edge formats. Includes sorting
 * algorithms for both graph (topological) and linear path modes.
 */

import type { Edge, Node } from '@xyflow/react'
import type { LearningGraphNode, LearningGraphEdge, GraphNodeType } from '@/lib/supabase/types'

export type ViewerNodeData = {
  podcastId: string
  nodeId: string
  title: string
  description: string | null
  domain: string
  thumbnailUrl: string | null
  audioShortUrl: string | null
  audioLongUrl: string | null
  bulletinUrl: string | null
  nodeType: GraphNodeType
  completed: boolean
}

/**
 * Converts database learning graph nodes into React Flow node objects
 * with viewer-specific data attached.
 */
export function toFlowNodes(
  dbNodes: LearningGraphNode[],
  completedNodeIds: Set<string>,
): Node<ViewerNodeData>[] {
  return dbNodes.map((graphNode) => ({
    id: graphNode.id,
    type: 'viewerPodcast',
    position: { x: graphNode.position_x, y: graphNode.position_y },
    draggable: false,
    connectable: false,
    data: {
      podcastId: graphNode.podcast_id,
      nodeId: graphNode.id,
      title: graphNode.podcast?.title ?? 'Untitled',
      description: graphNode.podcast?.description ?? null,
      domain: graphNode.podcast?.domain ?? '',
      thumbnailUrl: graphNode.podcast?.thumbnail_url ?? null,
      audioShortUrl: graphNode.podcast?.audio_short_url ?? null,
      audioLongUrl: graphNode.podcast?.audio_long_url ?? null,
      bulletinUrl: graphNode.podcast?.bulletin_url ?? null,
      nodeType: graphNode.node_type,
      completed: completedNodeIds.has(graphNode.id),
    },
  }))
}

/**
 * Converts database learning graph edges into React Flow edge objects
 * with consistent styling.
 */
export function toFlowEdges(dbEdges: LearningGraphEdge[]): Edge[] {
  return dbEdges.map((edge) => ({
    id: edge.id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    label: edge.label ?? undefined,
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  }))
}

/**
 * Performs a topological sort on graph nodes using Kahn's algorithm.
 * Used for graph-mode display to order nodes by dependency.
 * Nodes not reachable via edges are appended at the end.
 */
export function topologicalSort(
  nodes: LearningGraphNode[],
  edges: LearningGraphEdge[],
): LearningGraphNode[] {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  }

  for (const edge of edges) {
    adjacency.get(edge.source_node_id)?.push(edge.target_node_id)
    inDegree.set(
      edge.target_node_id,
      (inDegree.get(edge.target_node_id) ?? 0) + 1,
    )
  }

  const queue = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0)
  const sorted: LearningGraphNode[] = []

  while (queue.length > 0) {
    const currentNode = queue.shift()!
    sorted.push(currentNode)
    for (const neighborId of adjacency.get(currentNode.id) ?? []) {
      const newDegree = (inDegree.get(neighborId) ?? 1) - 1
      inDegree.set(neighborId, newDegree)
      if (newDegree === 0) {
        const neighborNode = nodes.find((node) => node.id === neighborId)
        if (neighborNode) queue.push(neighborNode)
      }
    }
  }

  const sortedIds = new Set(sorted.map((node) => node.id))
  for (const node of nodes) {
    if (!sortedIds.has(node.id)) sorted.push(node)
  }

  return sorted
}

/**
 * Sorts nodes by their sort_order field for linear path display.
 * Falls back to vertical position when sort_order values are equal.
 */
export function linearSort(nodes: LearningGraphNode[]): LearningGraphNode[] {
  return [...nodes].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }
    return first.position_y - second.position_y
  })
}
