/**
 * @module GraphEditor
 *
 * Main learning-path graph editor component. Orchestrates state management for
 * episode nodes and edges, handles persistence via REST API, and composes the
 * toolbar, canvas, and sidebar sub-components.
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
  episodesToFlowNodes,
  dbEdgesToFlowEdges,
  autoLayout,
  type EpisodeNodeData,
} from './graph-utils'
import type { LearningGraph, GraphNodeType } from '@/lib/supabase/types'
import type { EpisodeData } from './graph-nodes/EpisodeEditModal'

function GraphEditorInner({ graph }: { graph: LearningGraph }) {
  const [saving, setSaving] = useState(false)
  const [isPublished, setIsPublished] = useState(graph.is_published)
  const [newNodeId, setNewNodeId] = useState<string | null>(null)

  const initialNodes = useMemo(
    () => episodesToFlowNodes(graph.episodes ?? []),
    [graph.episodes]
  )
  const initialEdges = useMemo(
    () => dbEdgesToFlowEdges(graph.edges ?? []),
    [graph.edges]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

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

  const handleAddEpisode = useCallback(() => {
    const id = `temp-${Date.now()}`
    const newNode: Node<EpisodeNodeData> = {
      id,
      type: 'episode',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        title: 'New Episode',
        description: null,
        thumbnailUrl: null,
        audioUrl: null,
        transcript: null,
        nodeType: 'default',
      },
    }
    setNodes((nds) => [...nds, newNode])
    setNewNodeId(id)
  }, [setNodes])

  const handleAutoLayout = useCallback(() => {
    setNodes((nds) =>
      autoLayout(nds as Node<EpisodeNodeData>[], edges)
    )
  }, [edges, setNodes])

  const handleChangeNodeType = useCallback(
    (nodeId: string, nodeType: GraphNodeType) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, nodeType } as EpisodeNodeData }
            : n
        )
      )
    },
    [setNodes]
  )

  const handleEpisodeUpdate = useCallback(
    (nodeId: string, updated: EpisodeData) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  title: updated.title,
                  description: updated.description,
                  thumbnailUrl: updated.thumbnailUrl,
                  audioUrl: updated.audioUrl,
                  transcript: updated.transcript,
                  nodeType: updated.nodeType,
                } as EpisodeNodeData,
              }
            : n
        )
      )
    },
    [setNodes]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const payload = {
        episodes: nodes.map((n) => {
          const data = n.data as EpisodeNodeData
          return {
            id: n.id,
            title: data.title,
            description: data.description,
            thumbnail_url: data.thumbnailUrl,
            audio_url: data.audioUrl,
            transcript: data.transcript,
            position_x: n.position.x,
            position_y: n.position.y,
            label: null,
            node_type: data.nodeType,
          }
        }),
        edges: edges.map((e) => ({
          id: e.id,
          source_episode_id: e.source,
          target_episode_id: e.target,
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
      if (saved.episodes) setNodes(episodesToFlowNodes(saved.episodes))
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
          selectedNode as Node<EpisodeNodeData> | undefined
        }
        onAutoLayout={handleAutoLayout}
        onTogglePublish={handleTogglePublish}
        onSave={handleSave}
        onChangeNodeType={handleChangeNodeType}
      />
      <GraphEditorCanvas
        nodes={nodes}
        edges={edges}
        episodeCount={nodes.length}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onAddEpisode={handleAddEpisode}
        onChangeNodeType={handleChangeNodeType}
        onEpisodeUpdate={handleEpisodeUpdate}
        autoEditNodeId={newNodeId}
        onAutoEditDone={() => setNewNodeId(null)}
      />
    </div>
  )
}

export function GraphEditor({ graph }: { graph: LearningGraph }) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner graph={graph} />
    </ReactFlowProvider>
  )
}
