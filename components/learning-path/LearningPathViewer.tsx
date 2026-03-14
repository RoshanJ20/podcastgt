/**
 * @module LearningPathViewer
 *
 * Top-level viewer for a learning path graph. Wraps the inner viewer
 * in a ReactFlowProvider and manages progress state (fetching completed
 * nodes, toggling completion). Supports both linear (ordered list) and
 * graph (React Flow canvas with mobile list fallback) display modes.
 */

'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type Node,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { NodeDetailModal } from './NodeDetailModal'
import { NodeList } from './NodeList'
import { viewerNodeTypes } from './ViewerPodcastNode'
import {
  toFlowNodes,
  toFlowEdges,
  topologicalSort,
  linearSort,
  type ViewerNodeData,
} from './graph-utils'
import type {
  LearningGraph,
  LearningGraphNode,
} from '@/lib/supabase/types'

function LearningPathViewerInner({
  graph,
  isLoggedIn,
}: {
  graph: LearningGraph
  isLoggedIn: boolean
}) {
  const [selectedPodcast, setSelectedPodcast] =
    useState<ViewerNodeData | null>(null)
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/progress?graph_id=${graph.id}`)
      .then((response) => response.json())
      .then((data: { node_id: string }[]) => {
        if (Array.isArray(data)) {
          setCompletedNodeIds(new Set(data.map((entry) => entry.node_id)))
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch progress:', error)
      })
  }, [graph.id, isLoggedIn])

  const handleToggleComplete = useCallback(
    async (nodeId: string) => {
      const isCompleted = completedNodeIds.has(nodeId)

      if (isCompleted) {
        const response = await fetch('/api/progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ node_id: nodeId }),
        })
        if (response.ok) {
          setCompletedNodeIds((prev) => {
            const next = new Set(prev)
            next.delete(nodeId)
            return next
          })
        }
      } else {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph_id: graph.id, node_id: nodeId }),
        })
        if (response.ok) {
          setCompletedNodeIds((prev) => new Set(prev).add(nodeId))
          fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_type: 'complete_node',
              graph_id: graph.id,
            }),
          }).catch((error: unknown) => {
            console.error('Failed to log activity:', error)
          })
        }
      }
    },
    [completedNodeIds, graph.id],
  )

  const isLinear = graph.path_type === 'linear'
  const flowNodes = useMemo(
    () => toFlowNodes(graph.nodes ?? [], completedNodeIds),
    [graph.nodes, completedNodeIds],
  )
  const flowEdges = useMemo(
    () => toFlowEdges(graph.edges ?? []),
    [graph.edges],
  )
  const orderedNodes = useMemo(() => {
    if (isLinear) return linearSort(graph.nodes ?? [])
    return topologicalSort(graph.nodes ?? [], graph.edges ?? [])
  }, [graph.nodes, graph.edges, isLinear])

  const handleFlowNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedPodcast(node.data as ViewerNodeData)
  }

  const handleListNodeClick = (node: LearningGraphNode) => {
    setSelectedPodcast({
      podcastId: node.podcast_id,
      nodeId: node.id,
      title: node.podcast?.title ?? 'Untitled',
      description: node.podcast?.description ?? null,
      domain: node.podcast?.domain ?? '',
      thumbnailUrl: node.podcast?.thumbnail_url ?? null,
      audioShortUrl: node.podcast?.audio_short_url ?? null,
      audioLongUrl: node.podcast?.audio_long_url ?? null,
      bulletinUrl: node.podcast?.bulletin_url ?? null,
      nodeType: node.node_type,
      completed: completedNodeIds.has(node.id),
    })
  }

  const totalNodes = (graph.nodes ?? []).length
  const completedCount = completedNodeIds.size
  const progressPercent =
    totalNodes > 0
      ? Math.round((completedCount / totalNodes) * 100)
      : 0

  return (
    <>
      {isLoggedIn && totalNodes > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalNodes} completed
            </span>
            <span className="font-medium text-primary">
              {progressPercent}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-[#38BDF8] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {isLinear ? (
        <NodeList
          nodes={orderedNodes}
          completedNodeIds={completedNodeIds}
          onNodeClick={handleListNodeClick}
        />
      ) : (
        <>
          <div className="hidden md:block h-[600px] rounded-lg border overflow-hidden">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={viewerNodeTypes}
              onNodeClick={handleFlowNodeClick}
              nodesDraggable={false}
              nodesConnectable={false}
              fitView
              className="bg-background"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
              />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable className="!bg-card !border" />
            </ReactFlow>
          </div>
          <div className="md:hidden">
            <NodeList
              nodes={orderedNodes}
              completedNodeIds={completedNodeIds}
              onNodeClick={handleListNodeClick}
            />
          </div>
        </>
      )}

      {selectedPodcast && (
        <NodeDetailModal
          open={!!selectedPodcast}
          onOpenChange={(open) => {
            if (!open) setSelectedPodcast(null)
          }}
          podcast={{
            id: selectedPodcast.podcastId,
            title: selectedPodcast.title,
            description: selectedPodcast.description,
            domain: selectedPodcast.domain,
            thumbnailUrl: selectedPodcast.thumbnailUrl,
            audioShortUrl: selectedPodcast.audioShortUrl,
            audioLongUrl: selectedPodcast.audioLongUrl,
            bulletinUrl: selectedPodcast.bulletinUrl,
          }}
          nodeId={selectedPodcast.nodeId}
          isCompleted={completedNodeIds.has(selectedPodcast.nodeId)}
          isLoggedIn={isLoggedIn}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </>
  )
}

export function LearningPathViewer({
  graph,
  isLoggedIn = false,
}: {
  graph: LearningGraph
  isLoggedIn?: boolean
}) {
  return (
    <ReactFlowProvider>
      <LearningPathViewerInner graph={graph} isLoggedIn={isLoggedIn} />
    </ReactFlowProvider>
  )
}
