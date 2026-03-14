/**
 * @module graph-utils
 *
 * Utility functions for transforming learning path data between database
 * representations and React Flow node/edge formats. Includes sorting
 * algorithms for both graph (topological) and linear path modes.
 */

import type { Edge, Node } from '@xyflow/react'
import type { Episode, LearningPathEdge, GraphNodeType, EpisodeTranscript } from '@/lib/supabase/types'

export type ViewerNodeData = {
  episodeId: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  audioUrl: string | null
  transcript: EpisodeTranscript | null
  nodeType: GraphNodeType
  completed: boolean
}

/**
 * Converts database episodes into React Flow node objects
 * with viewer-specific data attached.
 */
export function toFlowNodes(
  episodes: Episode[],
  completedEpisodeIds: Set<string>,
): Node<ViewerNodeData>[] {
  return episodes.map((ep) => ({
    id: ep.id,
    type: 'viewerEpisode',
    position: { x: ep.position_x, y: ep.position_y },
    draggable: false,
    connectable: false,
    data: {
      episodeId: ep.id,
      title: ep.title,
      description: ep.description,
      thumbnailUrl: ep.thumbnail_url,
      audioUrl: ep.audio_url,
      transcript: ep.transcript,
      nodeType: ep.node_type,
      completed: completedEpisodeIds.has(ep.id),
    },
  }))
}

/**
 * Converts database learning path edges into React Flow edge objects
 * with consistent styling.
 */
export function toFlowEdges(dbEdges: LearningPathEdge[]): Edge[] {
  return dbEdges.map((edge) => ({
    id: edge.id,
    source: edge.source_episode_id,
    target: edge.target_episode_id,
    label: edge.label ?? undefined,
    animated: true,
    style: { stroke: 'var(--primary)', strokeWidth: 2 },
  }))
}

/**
 * Performs a topological sort on episodes using Kahn's algorithm.
 * Used for graph-mode display to order episodes by dependency.
 * Episodes not reachable via edges are appended at the end.
 */
export function topologicalSort(
  episodes: Episode[],
  edges: LearningPathEdge[],
): Episode[] {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const ep of episodes) {
    adjacency.set(ep.id, [])
    inDegree.set(ep.id, 0)
  }

  for (const edge of edges) {
    adjacency.get(edge.source_episode_id)?.push(edge.target_episode_id)
    inDegree.set(
      edge.target_episode_id,
      (inDegree.get(edge.target_episode_id) ?? 0) + 1,
    )
  }

  const queue = episodes.filter((ep) => (inDegree.get(ep.id) ?? 0) === 0)
  const sorted: Episode[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)
    for (const neighborId of adjacency.get(current.id) ?? []) {
      const newDegree = (inDegree.get(neighborId) ?? 1) - 1
      inDegree.set(neighborId, newDegree)
      if (newDegree === 0) {
        const neighbor = episodes.find((ep) => ep.id === neighborId)
        if (neighbor) queue.push(neighbor)
      }
    }
  }

  const sortedIds = new Set(sorted.map((ep) => ep.id))
  for (const ep of episodes) {
    if (!sortedIds.has(ep.id)) sorted.push(ep)
  }

  return sorted
}

/**
 * Sorts episodes by their sort_order field for linear path display.
 * Falls back to vertical position when sort_order values are equal.
 */
export function linearSort(episodes: Episode[]): Episode[] {
  return [...episodes].sort((first, second) => {
    if (first.sort_order !== second.sort_order) {
      return first.sort_order - second.sort_order
    }
    return first.position_y - second.position_y
  })
}
