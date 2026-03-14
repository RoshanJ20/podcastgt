/**
 * @module GraphEditor
 *
 * Main learning-graph editor component. Orchestrates state management for
 * nodes and edges, handles persistence via REST API, and composes the
 * toolbar, canvas, and sidebar sub-components.
 *
 * This is the public entry point; it provides the ReactFlowProvider wrapper
 * and delegates rendering to GraphEditorToolbar and GraphEditorCanvas.
 */

'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
import { GraphEditorToolbar } from './GraphEditorToolbar'
import { GraphEditorCanvas } from './GraphEditorCanvas'
import {
  dbNodesToFlowNodes,
  dbEdgesToFlowEdges,
  autoLayout,
  type PodcastSummary,
  type ExtendedPodcastNodeData,
} from './graph-utils'
import type { LearningGraph, GraphNodeType, Podcast } from '@/lib/supabase/types'

function GraphEditorInner({
  graph,
  initialPodcasts,
}: {
  graph: LearningGraph
  initialPodcasts: PodcastSummary[]
}) {
  const [saving, setSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(graph.is_published)
  const [podcasts, setPodcasts] = useState<PodcastSummary[]>(initialPodcasts)

  const initialNodes = useMemo(
    () => dbNodesToFlowNodes(graph.nodes ?? []),
    [graph.nodes]
  )
  const initialEdges = useMemo(
    () => dbEdgesToFlowEdges(graph.edges ?? []),
    [graph.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const usedPodcastIds = useMemo(
    () =>
      new Set(
        nodes.map((n) => (n.data as ExtendedPodcastNodeData).podcastId)
      ),
    [nodes]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
            animated: true,
            style: { stroke: 'var(--primary)', strokeWidth: 2 },
          },
          eds
        )
      )
    },
    [setEdges]
  )

  const handleAddPodcast = useCallback(
    (podcast: PodcastSummary) => {
      const newNode: Node<ExtendedPodcastNodeData> = {
        id: `temp-${Date.now()}`,
        type: 'podcast',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          podcastId: podcast.id,
          title: podcast.title,
          domain: podcast.domain,
          thumbnailUrl: podcast.thumbnail_url,
          nodeType: 'default',
        },
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const handlePodcastCreated = useCallback((podcast: PodcastSummary) => {
    setPodcasts((prev) => [podcast, ...prev])
  }, [])

  const handleAutoLayout = useCallback(() => {
    setNodes((nds) =>
      autoLayout(nds as Node<ExtendedPodcastNodeData>[], edges)
    )
  }, [edges, setNodes])

  const handleChangeNodeType = useCallback(
    (nodeId: string, nodeType: GraphNodeType) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: { ...n.data, nodeType } as ExtendedPodcastNodeData,
              }
            : n
        )
      )
    },
    [setNodes]
  )

  const handlePodcastUpdate = useCallback(
    (updated: {
      id: string
      title: string | null
      description: string | null
      domain: string | null
      thumbnailUrl: string | null
    }) => {
      setNodes((nds) =>
        nds.map((n) => {
          const data = n.data as ExtendedPodcastNodeData
          if (data.podcastId === updated.id) {
            return {
              ...n,
              data: {
                ...data,
                title: updated.title,
                description: updated.description,
                domain: updated.domain,
              } as ExtendedPodcastNodeData,
            }
          }
          return n
        })
      )
      setPodcasts((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? {
                ...p,
                title: updated.title,
                domain: updated.domain as Podcast['domain'],
              }
            : p
        )
      )
    },
    [setNodes]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const payload = {
        nodes: nodes.map((n) => {
          const data = n.data as ExtendedPodcastNodeData
          return {
            id: n.id,
            podcast_id: data.podcastId,
            position_x: n.position.x,
            position_y: n.position.y,
            label: null,
            node_type: data.nodeType,
          }
        }),
        edges: edges.map((e) => ({
          id: e.id,
          source_node_id: e.source,
          target_node_id: e.target,
          label: (e.label as string) ?? null,
        })),
      }

      const res = await fetch(`/api/learning-graphs/${graph.id}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')

      const saved = await res.json()
      if (saved.nodes) setNodes(dbNodesToFlowNodes(saved.nodes))
      if (saved.edges) setEdges(dbEdgesToFlowEdges(saved.edges))
      toast.success('Graph saved!')
    } catch {
      toast.error('Failed to save graph')
    } finally {
      setSaving(false)
    }
  }, [nodes, edges, graph.id, setNodes, setEdges])

  const handleTogglePublish = useCallback(async () => {
    const res = await fetch(`/api/learning-graphs/${graph.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !isPublished }),
    })
    if (res.ok) {
      setIsPublished(!isPublished)
      toast.success(isPublished ? 'Unpublished' : 'Published!')
    } else {
      toast.error('Failed to update')
    }
  }, [graph.id, isPublished])

  const selectedNode = nodes.find((n) => n.selected)

  return (
    <div className="flex flex-col h-full">
      <GraphEditorToolbar
        graphTitle={graph.title}
        isPublished={isPublished}
        saving={saving}
        selectedNode={
          selectedNode as Node<ExtendedPodcastNodeData> | undefined
        }
        onAutoLayout={handleAutoLayout}
        onTogglePublish={handleTogglePublish}
        onSave={handleSave}
        onChangeNodeType={handleChangeNodeType}
      />
      <GraphEditorCanvas
        nodes={nodes}
        edges={edges}
        podcasts={podcasts}
        usedPodcastIds={usedPodcastIds}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onAddPodcast={handleAddPodcast}
        onPodcastCreated={handlePodcastCreated}
        onChangeNodeType={handleChangeNodeType}
        onPodcastUpdate={handlePodcastUpdate}
      />
    </div>
  )
}

export function GraphEditor(props: {
  graph: LearningGraph
  podcasts: PodcastSummary[]
}) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner
        graph={props.graph}
        initialPodcasts={props.podcasts}
      />
    </ReactFlowProvider>
  )
}
