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
import { EpisodeDetailPanel } from './EpisodeDetailPanel'
import { NodeList } from './NodeList'
import { viewerNodeTypes } from './ViewerEpisodeNode'
import {
  toFlowNodes,
  toFlowEdges,
  topologicalSort,
  linearSort,
  type ViewerNodeData,
} from './graph-utils'
import type {
  LearningGraph,
  Episode,
} from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

function LearningPathViewerInner({
  graph,
  isLoggedIn,
}: {
  graph: LearningGraph
  isLoggedIn: boolean
}) {
  const [selectedEpisode, setSelectedEpisode] =
    useState<ViewerNodeData | null>(null)
  const [completedEpisodeIds, setCompletedEpisodeIds] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/progress?graph_id=${graph.id}`)
      .then((response) => response.json())
      .then((data: { episode_id: string }[]) => {
        if (Array.isArray(data)) {
          setCompletedEpisodeIds(new Set(data.map((entry) => entry.episode_id)))
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to fetch progress:', error)
      })
  }, [graph.id, isLoggedIn])

  const handleToggleComplete = useCallback(
    async (episodeId: string) => {
      const isCompleted = completedEpisodeIds.has(episodeId)

      if (isCompleted) {
        const response = await fetch('/api/progress', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ episode_id: episodeId }),
        })
        if (response.ok) {
          setCompletedEpisodeIds((prev) => {
            const next = new Set(prev)
            next.delete(episodeId)
            return next
          })
        }
      } else {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph_id: graph.id, episode_id: episodeId }),
        })
        if (response.ok) {
          setCompletedEpisodeIds((prev) => new Set(prev).add(episodeId))
          fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_type: 'complete_episode',
              graph_id: graph.id,
              episode_id: episodeId,
            }),
          }).catch((error: unknown) => {
            console.error('Failed to log activity:', error)
          })
        }
      }
    },
    [completedEpisodeIds, graph.id],
  )

  const isLinear = graph.path_type === 'linear'
  const flowNodes = useMemo(
    () => toFlowNodes(graph.episodes ?? [], completedEpisodeIds),
    [graph.episodes, completedEpisodeIds],
  )
  const flowEdges = useMemo(
    () => toFlowEdges(graph.edges ?? []),
    [graph.edges],
  )
  const orderedEpisodes = useMemo(() => {
    if (isLinear) return linearSort(graph.episodes ?? [])
    return topologicalSort(graph.episodes ?? [], graph.edges ?? [])
  }, [graph.episodes, graph.edges, isLinear])

  const handleFlowNodeClick = (_: React.MouseEvent, node: Node) => {
    const data = node.data as ViewerNodeData
    setSelectedEpisode(data)
  }

  const handleListEpisodeClick = (episode: Episode) => {
    setSelectedEpisode({
      episodeId: episode.id,
      title: episode.title,
      description: episode.description,
      thumbnailUrl: episode.thumbnail_url,
      audioUrl: episode.audio_url,
      transcript: episode.transcript,
      nodeType: episode.node_type,
      completed: completedEpisodeIds.has(episode.id),
    })
  }

  const totalEpisodes = (graph.episodes ?? []).length
  const completedCount = completedEpisodeIds.size
  const progressPercent =
    totalEpisodes > 0
      ? Math.round((completedCount / totalEpisodes) * 100)
      : 0

  const panelOpen = !!selectedEpisode

  return (
    <>
      {/* Progress bar */}
      {isLoggedIn && totalEpisodes > 0 && (
        <div className="mb-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} of {totalEpisodes} completed
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

      {/* Main content area: graph/list + side panel */}
      <div className="flex gap-0 rounded-lg border overflow-hidden bg-background">
        {/* Left side: graph or list */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out min-h-[500px]',
            panelOpen ? 'w-[55%] md:w-[60%]' : 'w-full',
          )}
        >
          {isLinear ? (
            <div className="p-4 h-full overflow-y-auto">
              <NodeList
                episodes={orderedEpisodes}
                completedEpisodeIds={completedEpisodeIds}
                onEpisodeClick={handleListEpisodeClick}
                selectedEpisodeId={selectedEpisode?.episodeId}
              />
            </div>
          ) : (
            <>
              <div className="hidden md:block h-[500px]">
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
                  {!panelOpen && (
                    <MiniMap pannable zoomable className="!bg-card !border" />
                  )}
                </ReactFlow>
              </div>
              <div className="md:hidden p-4">
                <NodeList
                  episodes={orderedEpisodes}
                  completedEpisodeIds={completedEpisodeIds}
                  onEpisodeClick={handleListEpisodeClick}
                  selectedEpisodeId={selectedEpisode?.episodeId}
                />
              </div>
            </>
          )}
        </div>

        {/* Right side panel */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out overflow-hidden',
            panelOpen ? 'w-[45%] md:w-[40%] opacity-100' : 'w-0 opacity-0',
          )}
        >
          {selectedEpisode && (
            <EpisodeDetailPanel
              episode={{
                title: selectedEpisode.title,
                description: selectedEpisode.description,
                thumbnailUrl: selectedEpisode.thumbnailUrl,
                audioUrl: selectedEpisode.audioUrl,
                transcript: selectedEpisode.transcript,
                nodeType: selectedEpisode.nodeType,
              }}
              episodeId={selectedEpisode.episodeId}
              graphId={graph.id}
              isCompleted={completedEpisodeIds.has(selectedEpisode.episodeId)}
              isLoggedIn={isLoggedIn}
              onToggleComplete={handleToggleComplete}
              onClose={() => setSelectedEpisode(null)}
            />
          )}
        </div>
      </div>
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
